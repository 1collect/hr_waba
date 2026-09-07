from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from recruiting.models import Question


class QuestionPageTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('editor', is_staff=True)
        self.url = reverse('recruiting:questions')

    def test_requires_staff(self):
        self.assertEqual(self.client.get(self.url).status_code, 302)
        self.user.is_staff = False
        self.user.save()
        self.client.force_login(self.user)
        self.assertEqual(self.client.post(self.url, {'action': 'add'}).status_code, 302)

    def test_add_and_edit_question_preserves_identity_and_order(self):
        self.client.force_login(self.user)
        last_position = Question.objects.order_by('-position').first().position
        response = self.client.post(self.url, {
            'action': 'add', 'new-text': 'Ваш опыт?', 'new-is_active': 'on',
        })
        self.assertRedirects(response, self.url)
        question = Question.objects.get(text='Ваш опыт?')
        self.assertEqual(question.position, last_position + 1)
        key = question.key
        response = self.client.post(self.url, {
            'action': 'edit', 'question_id': question.pk,
            f'q-{question.pk}-text': 'Где вы работали?',
        })
        self.assertRedirects(response, self.url)
        question.refresh_from_db()
        self.assertEqual(question.text, 'Где вы работали?')
        self.assertFalse(question.is_active)
        self.assertEqual(question.key, key)
        self.assertEqual(question.position, last_position + 1)

    def test_empty_text_is_rejected_and_editor_stays_open(self):
        self.client.force_login(self.user)
        question = Question.objects.first()
        original = question.text
        response = self.client.post(self.url, {
            'action': 'edit', 'question_id': question.pk, f'q-{question.pk}-text': '   ',
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(next(row for row in response.context['rows'] if row['question'].pk == question.pk)['open'])
        question.refresh_from_db()
        self.assertEqual(question.text, original)

    def test_csrf_is_required(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.user)
        self.assertEqual(client.post(self.url, {'action': 'add', 'new-text': 'Тест'}).status_code, 403)

    def test_invalid_question_id_is_rejected(self):
        self.client.force_login(self.user)
        for value in ('', 'invalid', '-1', '9' * 40):
            response = self.client.post(self.url, {'action': 'edit', 'question_id': value})
            self.assertEqual(response.status_code, 400)

    def test_question_text_is_escaped(self):
        self.client.force_login(self.user)
        question = Question.objects.first()
        question.text = '<script>alert(1)</script>'
        question.save()
        response = self.client.get(self.url)
        self.assertContains(response, '&lt;script&gt;alert(1)&lt;/script&gt;')
        self.assertNotContains(response, '<script>alert(1)</script>')
