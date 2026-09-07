import json
from unittest.mock import patch, MagicMock

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from recruiting.forms import QuestionForm
from recruiting.models import Answer, Candidate, Question
from recruiting.services import BotService, IncomingMessage
from recruiting.tests.test_bot_service import RecordingTransport
from recruiting.transports.whatsapp import WhatsAppTransport


class QuestionnaireFlowTests(TestCase):
    def setUp(self):
        Question.objects.update(show_if_question=None)
        Question.objects.all().delete()
        self.parent = Question.objects.create(key='studying', position=1, text='Учитесь?', answer_type='yes_no')
        self.child = Question.objects.create(key='school', position=2, text='Где учитесь?', show_if_question=self.parent, show_if_answer='Да')
        self.last = Question.objects.create(key='work', position=3, text='Последнее место работы?')
        self.transport = RecordingTransport()
        self.bot = BotService(self.transport)

    def send(self, text, **kwargs):
        return self.bot.handle(IncomingMessage(sender_id='test', text=text, **kwargs))

    def test_yes_no_validation_and_branching(self):
        candidate = self.send('Привет')
        self.assertEqual(candidate.messages.last().metadata['buttons'][0]['title'], 'Да')
        candidate = self.send('Возможно')
        self.assertEqual(candidate.current_question, self.parent)
        self.assertFalse(candidate.answers.exists())
        candidate = self.send(' нет ')
        self.assertEqual(candidate.current_question, self.last)
        self.assertEqual(candidate.answers.get().text, 'Нет')
        candidate = self.send('Магазин')
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)

    def test_editing_completed_answer_asks_new_branch_and_keeps_other_answers(self):
        for text in ('Привет', 'Нет', 'Магазин', '/изменить 1', 'Да'):
            candidate = self.send(text)
        self.assertEqual(candidate.current_question, self.child)
        self.assertEqual(candidate.answers.get(question=self.last).text, 'Магазин')
        candidate = self.send('Университет')
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)

    def test_editing_removes_obsolete_branch(self):
        for text in ('Привет', 'Да', 'Университет', 'Магазин', '/изменить 1', 'Нет'):
            candidate = self.send(text)
        self.assertFalse(candidate.answers.filter(question=self.child).exists())
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)

    def test_stale_button_does_not_answer_next_question(self):
        self.send('Привет')
        self.send('Нет')
        candidate = self.send('Да', metadata={'raw': {'interactive': {'button_reply': {
            'id': f'question:{self.parent.pk}:yes', 'title': 'Да',
        }}}})
        self.assertEqual(candidate.current_question, self.last)
        self.assertFalse(candidate.answers.filter(question=self.last).exists())

    def test_number_and_empty_answer_validation(self):
        self.parent.answer_type = 'number'
        self.parent.save()
        self.send('Старт')
        for text in ('', '  ', 'двадцать', '-2', '1.5'):
            candidate = self.send(text)
            self.assertFalse(candidate.answers.exists())
        candidate = self.send('25')
        self.assertEqual(candidate.answers.get().text, '25')

    def test_staff_edit_reconciles_without_sending_and_requires_valid_answer(self):
        for text in ('Привет', 'Нет', 'Магазин'):
            candidate = self.send(text)
        user = get_user_model().objects.create_user('editor', is_staff=True)
        answer = candidate.answers.get(question=self.parent)
        url = reverse('recruiting:candidate-answer-api', args=[candidate.pk, answer.pk])
        self.assertEqual(self.client.post(url, data='{}', content_type='application/json').status_code, 302)
        self.client.force_login(user)
        for payload in ('[]', '{', '{"answer": "maybe"}', '{"answer": null}'):
            self.assertEqual(self.client.post(url, data=payload, content_type='application/json').status_code, 400)
        response = self.client.post(url, data=json.dumps({'answer': 'Да'}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        candidate.refresh_from_db()
        self.assertEqual(candidate.current_question, self.child)
        self.assertTrue(candidate.question_needs_prompt)
        self.client.post(url, data=json.dumps({'answer': 'Да'}), content_type='application/json')
        candidate.refresh_from_db()
        self.assertTrue(candidate.question_needs_prompt)
        candidate = self.send('Продолжить')
        self.assertFalse(candidate.answers.filter(question=self.child).exists())
        self.assertEqual(self.transport.sent[-1][1], self.child.text)
        candidate = self.send('Университет')
        self.assertEqual(candidate.status, Candidate.Status.SURVEY_COMPLETED)
        csrf_client = Client(enforce_csrf_checks=True)
        csrf_client.force_login(user)
        self.assertEqual(csrf_client.post(url, data='{}', content_type='application/json').status_code, 403)
        other = Candidate.objects.create(external_id='other')
        other_url = reverse('recruiting:candidate-answer-api', args=[other.pk, answer.pk])
        self.assertEqual(self.client.post(other_url, data='{}', content_type='application/json').status_code, 404)

    def test_conditions_cannot_cycle_or_lose_parent_type(self):
        form = QuestionForm({'text': 'Учитесь?', 'answer_type': 'text', 'is_active': 'on'}, instance=self.parent)
        self.assertFalse(form.is_valid())
        form = QuestionForm({'text': 'Учитесь?', 'answer_type': 'yes_no', 'is_active': 'on',
                             'show_if_question': self.parent.pk, 'show_if_answer': 'Да'}, instance=self.parent)
        self.assertFalse(form.is_valid())

    def test_answer_list_splits_long_messages(self):
        candidate = self.send('Привет')
        Answer.objects.create(candidate=candidate, question=self.last, text='А' * 8000)
        self.transport.sent.clear()
        self.send('/ответы')
        self.assertGreater(len(self.transport.sent), 1)
        self.assertTrue(all(len(text) <= 4000 for _, text in self.transport.sent))

    def test_reorder_rejects_child_before_parent(self):
        user = get_user_model().objects.create_user('editor', is_staff=True)
        self.client.force_login(user)
        url = reverse('recruiting:questions')
        self.client.post(url, {'action': 'up', 'question_id': self.child.pk})
        self.child.refresh_from_db()
        self.assertEqual(self.child.position, 2)
        self.client.post(url, {'action': 'up', 'question_id': self.last.pk})
        self.last.refresh_from_db()
        self.assertEqual(self.last.position, 2)


class WhatsAppButtonsTests(TestCase):
    @patch('recruiting.transports.whatsapp.request.urlopen')
    def test_interactive_payload(self, urlopen):
        response = MagicMock()
        response.read.return_value = b'{"messages":[{"id":"wamid.test"}]}'
        urlopen.return_value.__enter__.return_value = response
        transport = WhatsAppTransport('token', 'phone', 'v23.0', 'https://graph.facebook.com')
        result = transport.send_buttons('7700', 'Учитесь?', [
            {'id': 'question:1:yes', 'title': 'Да'}, {'id': 'question:1:no', 'title': 'Нет'},
        ])
        payload = json.loads(urlopen.call_args.args[0].data)
        self.assertEqual(payload['type'], 'interactive')
        self.assertEqual(payload['interactive']['action']['buttons'][1]['reply']['title'], 'Нет')
        self.assertEqual(result.external_message_id, 'wamid.test')
