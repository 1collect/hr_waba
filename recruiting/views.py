import hashlib
import hmac
import json
import re
from datetime import datetime, timezone as datetime_timezone

from django.conf import settings
from django.contrib.admin.views.decorators import staff_member_required
from django.core.exceptions import ImproperlyConfigured
from django.db.models import Q
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from .models import Candidate
from .services import BotService, IncomingMessage
from .transports import get_transport


STATUS_VARIANTS = {
    Candidate.Status.NEW: 'neutral',
    Candidate.Status.SURVEY_IN_PROGRESS: 'warning',
    Candidate.Status.SURVEY_COMPLETED: 'success',
    Candidate.Status.CONTACTED: 'info',
    Candidate.Status.REJECTED: 'danger',
    Candidate.Status.HIRED: 'success',
}


@staff_member_required(login_url='/admin/login/')
def candidates_page(request):
    return render(request, 'recruiting/candidates.html')


def _candidate_summary(candidate):
    answers = list(candidate.answers.all())
    primary = {answer.question.key: answer.text for answer in answers}
    phone = re.sub(r'\D', '', candidate.external_id)
    return {
        'id': candidate.id,
        'external_id': candidate.external_id,
        'display_name': candidate.display_name,
        'name': primary.get('full_name') or candidate.display_name or candidate.external_id,
        'status': candidate.status,
        'status_label': candidate.get_status_display(),
        'status_variant': STATUS_VARIANTS.get(candidate.status, 'neutral'),
        'current_question': candidate.current_question.text if candidate.current_question else None,
        'answers_count': len(answers),
        'survey_completed': candidate.survey_completed_at is not None,
        'updated_at': candidate.updated_at.isoformat(),
        'wa_url': f'https://wa.me/{phone}' if len(phone) >= 7 else None,
        'primary_answers': primary,
    }


@staff_member_required(login_url='/admin/login/')
@require_GET
def candidate_list_api(request):
    candidates = Candidate.objects.select_related('current_question').prefetch_related(
        'answers__question'
    )
    query = request.GET.get('q', '').strip()
    status = request.GET.get('status', '').strip()
    if query:
        candidates = candidates.filter(
            Q(external_id__icontains=query) | Q(display_name__icontains=query)
        )
    if status:
        candidates = candidates.filter(status=status)
    rows = [_candidate_summary(candidate) for candidate in candidates]
    return JsonResponse({'results': rows, 'count': len(rows)})


@staff_member_required(login_url='/admin/login/')
@require_GET
def candidate_detail_api(request, candidate_id):
    candidate = get_object_or_404(
        Candidate.objects.select_related('current_question').prefetch_related(
            'answers__question', 'messages'
        ),
        pk=candidate_id,
    )
    data = _candidate_summary(candidate)
    data['answers'] = [
        {
            'question': answer.question.text,
            'question_key': answer.question.key,
            'position': answer.question.position,
            'answer': answer.text,
            'answered_at': answer.answered_at.isoformat(),
        }
        for answer in candidate.answers.all()
    ]
    data['messages'] = [
        {
            'id': message.id,
            'direction': message.direction,
            'text': message.text,
            'transport': message.transport,
            'sent_at': message.sent_at.isoformat(),
        }
        for message in candidate.messages.all()
    ]
    return JsonResponse(data)


def _signature_is_valid(request):
    app_secret = settings.WHATSAPP['APP_SECRET']
    if not app_secret:
        return False
    supplied = request.headers.get('X-Hub-Signature-256', '')
    expected = 'sha256=' + hmac.new(
        app_secret.encode('utf-8'), request.body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(supplied, expected)


def _whatsapp_message_text(message):
    message_type = message.get('type', 'unknown')
    if message_type == 'text':
        return message.get('text', {}).get('body', '')
    if message_type == 'button':
        return message.get('button', {}).get('text') or '[Кнопка]'
    if message_type == 'interactive':
        interactive = message.get('interactive', {})
        selection = interactive.get('button_reply') or interactive.get('list_reply') or {}
        return selection.get('title') or selection.get('id') or '[Интерактивный ответ]'
    captions = message.get(message_type, {})
    if isinstance(captions, dict) and captions.get('caption'):
        return captions['caption']
    labels = {
        'audio': '[Аудиосообщение]',
        'document': '[Документ]',
        'image': '[Изображение]',
        'location': '[Геолокация]',
        'sticker': '[Стикер]',
        'video': '[Видео]',
    }
    return labels.get(message_type, f'[Сообщение: {message_type}]')


def _parse_whatsapp_messages(payload):
    for entry in payload.get('entry', []):
        for change in entry.get('changes', []):
            value = change.get('value', {})
            contacts = {
                contact.get('wa_id'): contact.get('profile', {}).get('name', '')
                for contact in value.get('contacts', [])
            }
            for message in value.get('messages', []):
                sender = message.get('from')
                if not sender:
                    continue
                text = _whatsapp_message_text(message)
                sent_at = None
                if message.get('timestamp'):
                    try:
                        sent_at = datetime.fromtimestamp(
                            int(message['timestamp']), tz=datetime_timezone.utc
                        )
                    except (TypeError, ValueError, OSError):
                        sent_at = None
                yield IncomingMessage(
                    sender_id=sender,
                    text=text,
                    sent_at=sent_at,
                    external_message_id=message.get('id'),
                    display_name=contacts.get(sender, ''),
                    metadata={'type': message.get('type'), 'raw': message},
                )


@csrf_exempt
@require_http_methods(['GET', 'POST'])
def whatsapp_webhook(request):
    if request.method == 'GET':
        verify_token = settings.WHATSAPP['WEBHOOK_VERIFY_TOKEN']
        if (
            verify_token
            and request.GET.get('hub.mode') == 'subscribe'
            and request.GET.get('hub.verify_token') == verify_token
        ):
            return HttpResponse(request.GET.get('hub.challenge', ''))
        return HttpResponseForbidden('Webhook verification failed')

    if not _signature_is_valid(request):
        return HttpResponseForbidden('Invalid signature or WHATSAPP_APP_SECRET is not configured')
    if settings.BOT_TRANSPORT != 'whatsapp':
        return HttpResponse('WhatsApp transport is disabled', status=503)
    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return HttpResponseBadRequest('Invalid JSON')

    messages = list(_parse_whatsapp_messages(payload))
    if messages:
        try:
            service = BotService(get_transport())
        except ImproperlyConfigured as exc:
            return HttpResponseBadRequest(str(exc))
        for message in messages:
            service.handle(message)
    return JsonResponse({'status': 'ok'})
