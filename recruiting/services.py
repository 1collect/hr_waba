from dataclasses import dataclass
from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from .models import Answer, Candidate, Message, Question


COMPLETION_MESSAGE = 'Спасибо! Ожидайте, с вами свяжутся наши сотрудники.'


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
            first_question = Question.objects.filter(is_active=True).order_by('position').first()
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
            self._send(candidate, first_question.text)
            return candidate

        if candidate.status != Candidate.Status.SURVEY_IN_PROGRESS or not candidate.current_question_id:
            return candidate

        current_question = candidate.current_question
        Answer.objects.update_or_create(
            candidate=candidate,
            question=current_question,
            defaults={'text': incoming.text},
        )
        next_question = Question.objects.filter(
            is_active=True, position__gt=current_question.position
        ).order_by('position').first()

        if next_question:
            candidate.current_question = next_question
            candidate.save(update_fields=('current_question', 'updated_at'))
            self._send(candidate, next_question.text)
        else:
            candidate.status = Candidate.Status.SURVEY_COMPLETED
            candidate.current_question = None
            candidate.survey_completed_at = timestamp
            candidate.save(update_fields=(
                'status', 'current_question', 'survey_completed_at', 'updated_at'
            ))
            self._send(candidate, COMPLETION_MESSAGE)
        return candidate

    def set_typing(self, sender_id: str, is_typing=True, ttl_seconds=6) -> None:
        typing_until = timezone.now() + timedelta(seconds=ttl_seconds) if is_typing else None
        Candidate.objects.filter(external_id=sender_id).update(typing_until=typing_until)

    def _send(self, candidate: Candidate, text: str) -> None:
        result = self.transport.send_message(candidate.external_id, text)
        Message.objects.create(
            candidate=candidate,
            direction=Message.Direction.OUTGOING,
            text=text,
            transport=self.transport.name,
            external_message_id=result.external_message_id,
            sent_at=result.sent_at or timezone.now(),
            metadata=result.metadata,
        )
