from django.test import TestCase
from django.utils import timezone

from recruiting.models import Answer, Candidate, Message, Question
from recruiting.services import BotService, COMPLETION_MESSAGE, IncomingMessage
from recruiting.transports.base import MessageTransport, SendResult


class RecordingTransport(MessageTransport):
    name = 'test'

    def __init__(self):
        self.sent = []

    def send_message(self, recipient_id, text):
        self.sent.append((recipient_id, text))
        return SendResult()


class BotServiceTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        Question.objects.all().delete()
        cls.questions = [
            Question.objects.create(key='name', position=1, text='Ваше имя?'),
            Question.objects.create(key='city', position=2, text='Ваш город?'),
        ]

    def setUp(self):
        self.transport = RecordingTransport()
        self.service = BotService(self.transport)

    def test_first_message_starts_survey_without_becoming_answer(self):
        candidate = self.service.handle(IncomingMessage(sender_id='77001234567', text='Здравствуйте'))

        candidate.refresh_from_db()
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_IN_PROGRESS)
        self.assertEqual(candidate.current_question, self.questions[0])
        self.assertEqual(candidate.answers.count(), 0)
        self.assertEqual(self.transport.sent, [('77001234567', 'Ваше имя?')])
        self.assertEqual(candidate.messages.count(), 2)

    def test_answers_are_saved_one_at_a_time_then_survey_completes(self):
        self.service.handle(IncomingMessage(sender_id='77001234567', text='Старт'))
        self.service.handle(IncomingMessage(sender_id='77001234567', text='Иван Петров'))
        candidate = self.service.handle(IncomingMessage(sender_id='77001234567', text='Алматы'))

        candidate.refresh_from_db()
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)
        self.assertIsNone(candidate.current_question)
        self.assertIsNotNone(candidate.survey_completed_at)
        self.assertEqual(
            list(Answer.objects.values_list('text', flat=True)), ['Иван Петров', 'Алматы']
        )
        self.assertEqual(self.transport.sent[-1][1], COMPLETION_MESSAGE)
        self.assertEqual(Message.objects.filter(candidate=candidate).count(), 6)

    def test_duplicate_external_message_is_idempotent(self):
        incoming = IncomingMessage(
            sender_id='77001234567', text='Старт', external_message_id='wamid.123'
        )
        self.service.handle(incoming)
        self.service.handle(incoming)

        self.assertEqual(Candidate.objects.count(), 1)
        self.assertEqual(Message.objects.filter(direction=Message.Direction.INCOMING).count(), 1)
        self.assertEqual(len(self.transport.sent), 1)

    def test_typing_state_is_set_and_cleared_by_message(self):
        self.service.handle(IncomingMessage(sender_id='77001234567', text='Старт'))
        self.service.set_typing('77001234567')
        candidate = Candidate.objects.get(external_id='77001234567')
        self.assertGreater(candidate.typing_until, timezone.now())

        self.service.handle(IncomingMessage(sender_id='77001234567', text='Иван'))
        candidate.refresh_from_db()
        self.assertIsNone(candidate.typing_until)
