from django.test import TestCase

from recruiting.models import Candidate, Question
from recruiting.services import BotService, COMPLETION_MESSAGE, GREETING, IncomingMessage
from recruiting.tests.test_bot_service import RecordingTransport


class QuestionnaireTransport(RecordingTransport):
    def send_buttons(self, recipient_id, text, buttons):
        return self.send_message(recipient_id, text)


class RequestedQuestionnaireTests(TestCase):
    def test_seeded_questions_are_sent_one_at_a_time(self):
        expected = [
            'Ваше полное ФИО?',
            'Сколько Вам лет?',
            'Учитесь ли Вы сейчас?',
            'Имеется ли у Вас судимость?',
            'Имеется ли арест или ограничение на банковских счетах?',
            'Ваше последнее место работы?',
        ]
        self.assertEqual(list(Question.objects.filter(is_active=True).values_list('text', flat=True)), expected)
        transport = QuestionnaireTransport()
        service = BotService(transport)
        candidate = service.handle(IncomingMessage(sender_id='survey-test', text='Здравствуйте'))
        self.assertEqual([text for _, text in transport.sent], [GREETING + '\n\n' + expected[0]])
        self.assertEqual(candidate.answers.count(), 0)
        for index, answer in enumerate(['Иванов Иван Иванович', '25', 'Нет', 'Нет', 'Нет', 'Магазин']):
            candidate = service.handle(IncomingMessage(sender_id='survey-test', text=answer))
            self.assertEqual(len(transport.sent), index + 2)
            self.assertEqual(candidate.answers.count(), index + 1)
            self.assertEqual(transport.sent[-1][1], expected[index + 1] if index < 5 else COMPLETION_MESSAGE)
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)
