from django.test import TestCase

from recruiting.models import Candidate, Question
from recruiting.services import BotService, COMPLETION_MESSAGE, GREETING, IncomingMessage
from recruiting.tests.test_bot_service import RecordingTransport


class QuestionnaireTransport(RecordingTransport):
    def send_buttons(self, recipient_id, text, buttons):
        return self.send_message(recipient_id, text)


class RequestedQuestionnaireTests(TestCase):
    def test_seeded_questions_are_sent_as_one_questionnaire(self):
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
        questionnaire = GREETING + '\n\n' + '\n'.join(
            f'{position}. {question}' for position, question in enumerate(expected, 1)
        )
        self.assertEqual([text for _, text in transport.sent], [questionnaire])
        self.assertEqual(candidate.answers.count(), 0)
        candidate = service.handle(IncomingMessage(
            sender_id='survey-test',
            text=(
                '1. Иванов Иван Иванович\n'
                '2. 25\n'
                '3. Нет\n'
                '4. Нет\n'
                '5. Нет\n'
                '6. Магазин'
            ),
        ))
        self.assertEqual(len(transport.sent), 2)
        self.assertEqual(candidate.answers.count(), 6)
        self.assertEqual(transport.sent[-1][1], COMPLETION_MESSAGE)
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)
