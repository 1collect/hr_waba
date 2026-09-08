from dataclasses import dataclass
from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from .models import Answer, Candidate, Message, Question


COMPLETION_MESSAGE = 'Спасибо! Ожидайте, с вами свяжутся наши сотрудники.'
GREETING = 'Здравствуйте! Для рассмотрения вашей кандидатуры, пожалуйста, ответьте на несколько вопросов:'
EDIT_HELP = 'Чтобы посмотреть и исправить ответы, отправьте /ответы. Для изменения отправьте /изменить и номер вопроса, например /изменить 1.'


def normalize_answer(question, text):
    text = text.strip()
    if not text:
        raise ValueError('Введите ответ, пожалуйста.')
    if question.answer_type == Question.AnswerType.YES_NO:
        choices = {'да': 'Да', 'нет': 'Нет'}
        if text.casefold() not in choices:
            raise ValueError('Выберите «Да» или «Нет».')
        return choices[text.casefold()]
    if question.answer_type == Question.AnswerType.NUMBER:
        if not text.isascii() or not text.isdecimal() or len(text) > 9:
            raise ValueError('Введите целое неотрицательное число.')
        return str(int(text))
    return text


def eligible_questions(candidate):
    answers = dict(candidate.answers.values_list('question_id', 'text'))
    eligible = set()
    result = []
    for question in Question.objects.filter(is_active=True):
        if question.show_if_question_id and (
            question.show_if_question_id not in eligible
            or answers.get(question.show_if_question_id) != question.show_if_answer
        ):
            continue
        eligible.add(question.pk)
        result.append(question)
    return result


def reconcile_answers(candidate):
    questions = eligible_questions(candidate)
    # Keep historical answers to disabled questions, but discard obsolete branches.
    candidate.answers.filter(question__is_active=True).exclude(
        question_id__in=[q.pk for q in questions]
    ).delete()
    answered = set(candidate.answers.values_list('question_id', flat=True))
    return next((q for q in questions if q.pk not in answered), None)


@dataclass(frozen=True)
class IncomingMessage:
    sender_id: str
    text: str
    sent_at: datetime | None = None
    external_message_id: str | None = None
    display_name: str = ''
    metadata: dict | None = None


class BotService:
    """Transport-agnostic questionnaire orchestration."""

    def __init__(self, transport):
        self.transport = transport

    @transaction.atomic
    def handle(self, incoming: IncomingMessage) -> Candidate:
        timestamp = incoming.sent_at or timezone.now()
        candidate, created = Candidate.objects.select_for_update().get_or_create(
            external_id=incoming.sender_id,
            defaults={'display_name': incoming.display_name},
        )
        if incoming.display_name and candidate.display_name != incoming.display_name:
            candidate.display_name = incoming.display_name
            candidate.save(update_fields=('display_name', 'updated_at'))

        # Meta can retry a webhook; the external ID makes processing idempotent.
        if incoming.external_message_id and Message.objects.filter(
            external_message_id=incoming.external_message_id
        ).exists():
            return candidate

        Message.objects.create(
            candidate=candidate,
            direction=Message.Direction.INCOMING,
            text=incoming.text,
            transport=self.transport.name,
            external_message_id=incoming.external_message_id,
            sent_at=timestamp,
            metadata=incoming.metadata or {},
        )
        now = timezone.now()
        Candidate.objects.filter(pk=candidate.pk).update(typing_until=None, updated_at=now)
        candidate.typing_until = None
        candidate.updated_at = now

        if created or candidate.status == Candidate.Status.NEW:
            first_question = next(iter(eligible_questions(candidate)), None)
            if not first_question:
                candidate.status = Candidate.Status.SURVEY_COMPLETED
                candidate.survey_started_at = timestamp
                candidate.survey_completed_at = timestamp
                candidate.current_question = None
                candidate.save()
                self._send(candidate, COMPLETION_MESSAGE)
                return candidate
            candidate.status = Candidate.Status.SURVEY_IN_PROGRESS
            candidate.survey_started_at = timestamp
            candidate.current_question = first_question
            candidate.save()
            self._send_question(candidate, first_question, greeting=True)
            return candidate

        command = incoming.text.strip().casefold()
        if command == '/ответы':
            rows = [f'{a.question.position}. {a.question.text}\nОтвет: {a.text}'
                    for a in candidate.answers.select_related('question')]
            self._send(candidate, '\n\n'.join(rows + [EDIT_HELP]))
            return candidate
        if command.startswith('/изменить') and candidate.status in (
            Candidate.Status.SURVEY_IN_PROGRESS, Candidate.Status.SURVEY_COMPLETED,
        ):
            parts = command.split()
            number = int(parts[1]) if len(parts) == 2 and parts[1].isascii() and parts[1].isdigit() and len(parts[1]) < 10 else None
            question = next((q for q in eligible_questions(candidate) if q.position == number), None)
            if not question or not candidate.answers.filter(question=question).exists():
                self._send(candidate, 'Укажите номер уже заполненного вопроса.\n' + EDIT_HELP)
                return candidate
            candidate.current_question = question
            candidate.question_needs_prompt = False
            candidate.status = Candidate.Status.SURVEY_IN_PROGRESS
            candidate.survey_completed_at = None
            candidate.save()
            self._send_question(candidate, question)
            return candidate

        if candidate.status != Candidate.Status.SURVEY_IN_PROGRESS or not candidate.current_question_id:
            return candidate

        current_question = candidate.current_question
        if candidate.question_needs_prompt or current_question.pk not in {q.pk for q in eligible_questions(candidate)}:
            candidate.current_question = reconcile_answers(candidate)
            candidate.question_needs_prompt = False
            self._advance(candidate, timestamp)
            return candidate
        # A delayed click on an earlier question must not answer the current one.
        selection = (incoming.metadata or {}).get('raw', {}).get('interactive', {}).get('button_reply', {})
        button_id = selection.get('id', '')
        if button_id.startswith('question:') and button_id not in (
            f'question:{current_question.pk}:yes', f'question:{current_question.pk}:no',
        ):
            self._send_question(candidate, current_question)
            return candidate
        try:
            answer_text = normalize_answer(current_question, incoming.text)
        except ValueError as exc:
            self._send(candidate, str(exc))
            self._send_question(candidate, current_question)
            return candidate
        Answer.objects.update_or_create(
            candidate=candidate,
            question=current_question,
            defaults={'text': answer_text},
        )
        candidate.current_question = reconcile_answers(candidate)
        self._advance(candidate, timestamp)
        return candidate

    def _advance(self, candidate, timestamp):
        if candidate.current_question:
            candidate.save()
            self._send_question(candidate, candidate.current_question)
        else:
            candidate.status = Candidate.Status.SURVEY_COMPLETED
            candidate.current_question = None
            candidate.survey_completed_at = timestamp
            candidate.save()
            self._send(candidate, COMPLETION_MESSAGE)

    def _send_question(self, candidate, question, greeting=False):
        text = question.text
        if greeting:
            text = GREETING + '\n\n' + EDIT_HELP + '\n\n' + text
        buttons = []
        if question.answer_type == Question.AnswerType.YES_NO:
            buttons = [
                {'id': f'question:{question.pk}:yes', 'title': 'Да'},
                {'id': f'question:{question.pk}:no', 'title': 'Нет'},
            ]
        self._send(candidate, text, buttons)

    def set_typing(self, sender_id: str, is_typing=True, ttl_seconds=6) -> None:
        typing_until = timezone.now() + timedelta(seconds=ttl_seconds) if is_typing else None
        Candidate.objects.filter(external_id=sender_id).update(typing_until=typing_until)

    def _send(self, candidate: Candidate, text: str, buttons=None) -> None:
        if not buttons and len(text) > 4000:
            for start in range(0, len(text), 4000):
                self._send(candidate, text[start:start + 4000])
            return
        result = (self.transport.send_buttons(candidate.external_id, text, buttons) if buttons
                  else self.transport.send_message(candidate.external_id, text))
        Message.objects.create(
            candidate=candidate,
            direction=Message.Direction.OUTGOING,
            text=text,
            transport=self.transport.name,
            external_message_id=result.external_message_id,
            sent_at=result.sent_at or timezone.now(),
            metadata={**result.metadata, 'buttons': buttons or [], 'question_id': candidate.current_question_id},
        )
