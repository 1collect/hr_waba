from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import Client, TestCase

from recruiting.forms import PhoneChannelForm
from recruiting.models import Candidate, PhoneChannel
from recruiting.services import BotService, IncomingMessage
from recruiting.transports.terminal import TerminalTransport


class PhoneChannelTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('staff', is_staff=True)
        self.client.force_login(self.user)
        self.first = PhoneChannel.objects.create(name='Алматы', phone_number='+77001111111')
        self.second = PhoneChannel.objects.create(name='Астана', phone_number='+77002222222')

    def test_staff_only_and_csrf(self):
        self.client.logout()
        for url in ('/numbers/', f'/numbers/{self.first.pk}/edit/', f'/numbers/{self.first.pk}/test/'):
            self.assertEqual(self.client.get(url).status_code, 302)
            self.assertEqual(self.client.post(url, {}).status_code, 302)
        ordinary = get_user_model().objects.create_user('ordinary')
        self.client.force_login(ordinary)
        self.assertEqual(self.client.post('/numbers/', {}).status_code, 302)
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.user)
        self.assertEqual(client.post('/numbers/', {}).status_code, 403)

    def test_create_normalizes_and_rejects_duplicates(self):
        response = self.client.post('/numbers/', {
            'name': 'Отдел', 'phone_number': '+7 (700) 333-33-33', 'is_active': 'on',
        })
        self.assertRedirects(response, '/numbers/')
        self.assertTrue(PhoneChannel.objects.filter(phone_number='+77003333333').exists())
        response = self.client.post('/numbers/', {
            'name': 'Другой отдел', 'phone_number': '77003333333', 'is_active': 'on',
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.context['form'].errors)
        for phone in ('abc', '+0 7001234567', '123', '+7700<script>'):
            self.assertFalse(PhoneChannelForm(data={'name': 'Отдел', 'phone_number': phone}).is_valid())

    def test_same_candidate_has_independent_surveys_and_history(self):
        transport = TerminalTransport(output=lambda text: None)
        first_bot = BotService(transport, channel=self.first)
        second_bot = BotService(transport, channel=self.second)
        first = first_bot.handle(IncomingMessage(sender_id='77009999999', text='Привет'))
        second = second_bot.handle(IncomingMessage(sender_id='77009999999', text='Привет'))
        first_bot.handle(IncomingMessage(sender_id='77009999999', text='Иван Иванов'))
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertNotEqual(first.pk, second.pk)
        self.assertNotEqual(first.current_question_id, second.current_question_id)
        self.assertEqual(first.answers.count(), 1)
        self.assertEqual(second.answers.count(), 0)
        self.assertEqual(second.messages.count(), 2)
        first_bot.set_typing('77009999999')
        second.refresh_from_db()
        self.assertIsNone(second.typing_until)
        response = self.client.get('/api/candidates/', {'channel': self.first.pk})
        self.assertEqual([row['id'] for row in response.json()['results']], [first.pk])
        self.assertEqual(response.json()['results'][0]['channel_name'], 'Алматы')

    def test_disabled_channel_keeps_history_and_blocks_processing(self):
        url = f'/numbers/{self.first.pk}/test/'
        response = self.client.post(url, {'sender': '+77009999999', 'text': 'Привет'})
        self.assertEqual(response.status_code, 302)
        self.assertContains(self.client.get(response.url), 'Привет')
        candidate = Candidate.objects.get(channel=self.first)
        self.assertEqual(candidate.messages.first().transport, 'application_test')
        count = candidate.messages.count()
        self.client.post(f'/numbers/{self.first.pk}/edit/', {
            'name': 'Алматы', 'phone_number': self.first.phone_number,
        })
        response = self.client.post(url, {'sender': '+77009999999', 'text': 'Иван'})
        self.assertContains(response, 'Этот номер выключен')
        self.assertEqual(candidate.messages.count(), count)
        self.client.post(f'/numbers/{self.first.pk}/edit/', {
            'name': 'Алматы', 'phone_number': self.first.phone_number, 'is_active': 'on',
        })
        self.assertEqual(self.client.post(url, {'sender': '+77009999999', 'text': 'Иван'}).status_code, 302)
        self.assertEqual(candidate.answers.count(), 1)

    def test_legacy_candidates_remain_separate_and_unique(self):
        legacy = Candidate.objects.create(external_id='77009999999')
        scoped = Candidate.objects.create(external_id=legacy.external_id, channel=self.first)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Candidate.objects.create(external_id=legacy.external_id)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Candidate.objects.create(external_id=legacy.external_id, channel=self.first)
        response = self.client.get('/api/candidates/', {'channel': 'none'})
        self.assertEqual([row['id'] for row in response.json()['results']], [legacy.pk])
        self.assertNotEqual(legacy.pk, scoped.pk)
        self.assertEqual(self.client.get('/api/candidates/', {'channel': 'bad'}).status_code, 400)

    def test_number_pages_escape_user_content(self):
        self.first.name = '<script>alert(1)</script>'
        self.first.save()
        for url in ('/numbers/', f'/numbers/{self.first.pk}/edit/', f'/numbers/{self.first.pk}/test/'):
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
            self.assertNotContains(response, '<script>alert(1)</script>')
