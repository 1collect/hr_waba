from django.test import TestCase
from django.utils import timezone

from recruiting.models import Answer, Candidate, Message, Question
from recruiting.questionnaire_ai import ExtractedAnswer
from recruiting.services import BotService, COMPLETION_MESSAGE, GREETING, IncomingMessage
from recruiting.transports.base import MessageTransport, SendResult


class RecordingTransport(MessageTransport):
    name = 'test'

    def __init__(self):
        self.sent = []

    def send_message(self, recipient_id, text):
        self.sent.append((recipient_id, text))
        return SendResult()


class RepeatingRecordingTransport(RecordingTransport):
    name = 'whatsapp_test'
    restart_completed_surveys = True


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
        self.assertEqual(self.transport.sent[0][0], '77001234567')
        self.assertEqual(
            self.transport.sent[0][1],
            GREETING + '\n\n1. Ваше имя?\n2. Ваш город?',
        )
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

    def test_numbered_answers_complete_the_whole_questionnaire_at_once(self):
        self.service.handle(IncomingMessage(sender_id='77001234567', text='Старт'))

        candidate = self.service.handle(IncomingMessage(
            sender_id='77001234567',
            text='1. Иван Петров\n2. Алматы',
        ))

        candidate.refresh_from_db()
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)
        self.assertEqual(
            list(candidate.answers.values_list('text', flat=True)),
            ['Иван Петров', 'Алматы'],
        )
        self.assertEqual(Message.objects.filter(candidate=candidate).count(), 4)

    def test_ai_analyzer_can_extract_multiple_answers_from_free_text(self):
        class FakeAnalyzer:
            def extract(inner_self, text, questions, previous_prompt=''):
                return [
                    ExtractedAnswer(questions[0].pk, 'Иван Петров'),
                    ExtractedAnswer(questions[1].pk, 'Алматы'),
                ]

        service = BotService(self.transport, analyzer=FakeAnalyzer())
        service.handle(IncomingMessage(sender_id='77001234567', text='Старт'))
        candidate = service.handle(IncomingMessage(
            sender_id='77001234567', text='Меня зовут Иван Петров, живу в Алматы',
        ))

        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)
        self.assertEqual(candidate.answers.count(), 2)

    def test_message_without_any_answer_is_ignored_without_outgoing_reply(self):
        class SilentAnalyzer:
            def extract(inner_self, text, questions, previous_prompt=''):
                return []

        service = BotService(self.transport, analyzer=SilentAnalyzer())
        service.handle(IncomingMessage(sender_id='77001234567', text='Старт'))
        self.transport.sent.clear()

        candidate = service.handle(IncomingMessage(
            sender_id='77001234567', text='Расскажите подробнее о вакансии',
        ))

        self.assertEqual(candidate.answers.count(), 0)
        self.assertEqual(self.transport.sent, [])
        self.assertEqual(candidate.messages.filter(direction=Message.Direction.INCOMING).count(), 2)

    def test_one_answer_produces_only_one_followup_message(self):
        class PartialAnalyzer:
            def extract(inner_self, text, questions, previous_prompt=''):
                return [ExtractedAnswer(questions[0].pk, 'Иван Петров')]

        service = BotService(self.transport, analyzer=PartialAnalyzer())
        service.handle(IncomingMessage(sender_id='77001234567', text='Старт'))
        self.transport.sent.clear()

        candidate = service.handle(IncomingMessage(
            sender_id='77001234567', text='Меня зовут Иван Петров',
        ))

        self.assertEqual(candidate.answers.count(), 1)
        self.assertEqual(len(self.transport.sent), 1)
        self.assertIn('Ваш город?', self.transport.sent[0][1])

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

    def test_whatsapp_test_can_repeat_completed_survey(self):
        service = BotService(RepeatingRecordingTransport())
        service.handle(IncomingMessage(sender_id='77001234567', text='Start'))
        service.handle(IncomingMessage(sender_id='77001234567', text='First name'))
        candidate = service.handle(IncomingMessage(sender_id='77001234567', text='First city'))
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)

        candidate = service.handle(IncomingMessage(sender_id='77001234567', text='Again'))
        candidate.refresh_from_db()
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_IN_PROGRESS)
        self.assertEqual(candidate.current_question, self.questions[0])
        self.assertEqual(candidate.answers.count(), 0)
        self.assertIsNone(candidate.survey_completed_at)

        service.handle(IncomingMessage(sender_id='77001234567', text='Second name'))
        candidate = service.handle(IncomingMessage(sender_id='77001234567', text='Second city'))
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)
        self.assertEqual(
            list(candidate.answers.values_list('text', flat=True)),
            ['Second name', 'Second city'],
        )
        self.assertEqual(Candidate.objects.filter(external_id='77001234567').count(), 1)

    def test_whatsapp_test_ignores_old_button_after_completion(self):
        transport = RepeatingRecordingTransport()
        service = BotService(transport)
        service.handle(IncomingMessage(sender_id='77001234567', text='Start'))
        service.handle(IncomingMessage(sender_id='77001234567', text='First name'))
        candidate = service.handle(IncomingMessage(sender_id='77001234567', text='First city'))
        sent_count = len(transport.sent)

        candidate = service.handle(IncomingMessage(
            sender_id='77001234567',
            text='Yes',
            metadata={'raw': {'interactive': {'button_reply': {
                'id': f'question:{self.questions[0].pk}:yes',
                'title': 'Yes',
            }}}},
        ))

        candidate.refresh_from_db()
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)
        self.assertEqual(candidate.answers.count(), 2)
        self.assertEqual(len(transport.sent), sent_count)
