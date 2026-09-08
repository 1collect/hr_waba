import hashlib
import hmac
import json
import re
from uuid import uuid4
from datetime import datetime, timezone as datetime_timezone

from django.conf import settings
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import user_passes_test
from django.contrib import messages
from django.core.exceptions import ImproperlyConfigured
from django.db import IntegrityError, transaction
from django.db.models import Max, Q
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods

from .models import Answer, Candidate, Question
from .forms import QuestionForm
from .builder import snapshot, save_scenario, BuilderConflict
from .services import BotService, IncomingMessage, GREETING, normalize_answer, reconcile_answers
from .transports import get_transport


STATUS_VARIANTS = {
    Candidate.Status.NEW: 'neutral',
    Candidate.Status.SURVEY_IN_PROGRESS: 'warning',
    Candidate.Status.SURVEY_COMPLETED: 'success',
    Candidate.Status.CONTACTED: 'info',
    Candidate.Status.REJECTED: 'danger',
    Candidate.Status.HIRED: 'success',
}

staff_required = user_passes_test(
    lambda user: user.is_active and user.is_staff,
    login_url='/login/',
)


@never_cache
@require_http_methods(['GET', 'POST'])
def login_page(request):
    next_url = request.POST.get('next') or request.GET.get('next') or '/candidates/'
    if not url_has_allowed_host_and_scheme(next_url, allowed_hosts={request.get_host()}):
        next_url = '/candidates/'
    if request.user.is_authenticated and request.user.is_staff:
        return redirect(next_url)

    error = None
    if request.method == 'POST':
        user = authenticate(
            request,
            username=request.POST.get('username', ''),
            password=request.POST.get('password', ''),
        )
        if user and user.is_active and user.is_staff:
            login(request, user)
            return redirect(next_url)
        error = 'Неверный логин или пароль'
    return render(request, 'recruiting/login.html', {'error': error, 'next': next_url})


@staff_required
@ensure_csrf_cookie
def candidates_page(request):
    return render(request, 'recruiting/candidates.html')


@staff_required
@require_http_methods(['GET', 'POST'])
def questions_page(request):
    editing = None
    form = QuestionForm(prefix='new')
    edit_form = None
    if request.method == 'POST':
        action = request.POST.get('action')
        if action in ('up', 'down'):
            try:
                question_id = int(request.POST.get('question_id', ''))
                if not 0 < question_id <= 9223372036854775807:
                    raise ValueError
            except (TypeError, ValueError):
                return HttpResponseBadRequest('Invalid question ID')
            with transaction.atomic():
                ordered = list(Question.objects.select_for_update().all())
                index = next((i for i, q in enumerate(ordered) if q.pk == question_id), None)
                if index is None:
                    return HttpResponseBadRequest('Invalid question ID')
                target = index + (-1 if action == 'up' else 1)
                if 0 <= target < len(ordered):
                    first, second = ordered[index], ordered[target]
                    positions = {q.pk: q.position for q in ordered}
                    positions[first.pk], positions[second.pk] = second.position, first.position
                    if any(q.show_if_question_id and positions[q.show_if_question_id] >= positions[q.pk] for q in ordered):
                        messages.error(request, 'Вопрос с условием должен идти после вопроса, от которого зависит.')
                    else:
                        Question.objects.filter(pk=first.pk).update(position=max(positions.values()) + 1)
                        Question.objects.filter(pk=second.pk).update(position=positions[second.pk])
                        Question.objects.filter(pk=first.pk).update(position=positions[first.pk])
            return redirect('recruiting:questions')
        elif action == 'edit':
            try:
                question_id = int(request.POST.get('question_id', ''))
            except (TypeError, ValueError):
                return HttpResponseBadRequest('Invalid question ID')
            if not 0 < question_id <= 9223372036854775807:
                return HttpResponseBadRequest('Invalid question ID')
            editing = get_object_or_404(Question, pk=question_id)
            edit_form = QuestionForm(request.POST, instance=editing, prefix=f'q-{editing.pk}')
            if edit_form.is_valid():
                edit_form.save()
                messages.success(request, 'Вопрос сохранён')
                return redirect('recruiting:questions')
        elif action == 'add':
            form = QuestionForm(request.POST, prefix='new')
            if form.is_valid():
                try:
                    with transaction.atomic():
                        question = form.save(commit=False)
                        question.key = f'question_{uuid4().hex}'
                        question.position = (Question.objects.aggregate(last=Max('position'))['last'] or 0) + 1
                        question.save()
                except IntegrityError:
                    form.add_error(None, 'Список изменился. Повторите сохранение.')
                else:
                    messages.success(request, 'Вопрос добавлен')
                    return redirect('recruiting:questions')
        else:
            return HttpResponseBadRequest('Unknown action')
    questions = list(Question.objects.all())
    rows = [{
        'question': question,
        'form': edit_form if editing and editing.pk == question.pk else QuestionForm(
            instance=question, prefix=f'q-{question.pk}'
        ),
        'open': bool(editing and editing.pk == question.pk),
    } for question in questions]
    return render(request, 'recruiting/questions.html', {
        'rows': rows, 'form': form,
        'active_count': sum(question.is_active for question in questions),
        'preview_questions': [{
            'id': q.pk, 'text': q.text, 'answer_type': q.answer_type,
            'show_if_question': q.show_if_question_id, 'show_if_answer': q.show_if_answer,
        } for q in questions if q.is_active],
        'greeting': GREETING,
        'builder_data': snapshot(questions),
    })


@staff_required
@require_http_methods(['GET', 'POST'])
def question_builder_api(request):
    if request.method == 'GET':
        return JsonResponse(snapshot())
    try:
        return JsonResponse(save_scenario(json.loads(request.body)))
    except BuilderConflict as exc:
        return JsonResponse({'error': str(exc)}, status=409)
    except (ValueError, UnicodeDecodeError) as exc:
        return JsonResponse({'error': str(exc)}, status=400)
    except IntegrityError:
        return JsonResponse({'error': 'Анкета изменилась во время сохранения. Обновите страницу.'}, status=409)


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


@staff_required
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


@staff_required
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
            'id': answer.id,
            'answer_type': answer.question.answer_type,
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


@staff_required
@require_http_methods(['POST'])
@transaction.atomic
def candidate_answer_api(request, candidate_id, answer_id):
    candidate = get_object_or_404(Candidate.objects.select_for_update(), pk=candidate_id)
    answer = get_object_or_404(Answer.objects.select_related('question'), candidate=candidate, pk=answer_id)
    try:
        payload = json.loads(request.body)
        if not isinstance(payload, dict) or not isinstance(payload.get('answer'), str):
            raise ValueError('Передайте текст ответа.')
        text = normalize_answer(answer.question, payload['answer'])
    except (ValueError, UnicodeDecodeError) as exc:
        return JsonResponse({'error': str(exc)}, status=400)
    answer.text = text
    answer.save(update_fields=['text'])
    next_question = reconcile_answers(candidate)
    if candidate.status in (Candidate.Status.SURVEY_IN_PROGRESS, Candidate.Status.SURVEY_COMPLETED):
        if next_question:
            candidate.question_needs_prompt = candidate.question_needs_prompt or candidate.current_question_id != next_question.pk
            candidate.current_question = next_question
            candidate.status = Candidate.Status.SURVEY_IN_PROGRESS
            candidate.survey_completed_at = None
        else:
            candidate.current_question = None
            candidate.question_needs_prompt = False
            candidate.status = Candidate.Status.SURVEY_COMPLETED
            candidate.survey_completed_at = candidate.survey_completed_at or timezone.now()
    candidate.save()
    return JsonResponse({'status': 'ok'})


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
    if settings.BOT_TRANSPORT not in ('whatsapp', 'whatsapp_test'):
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
