import hashlib
import hmac
import json

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse

from recruiting.models import Candidate
from recruiting.views import _parse_whatsapp_messages


TEST_WHATSAPP = {
    'ACCESS_TOKEN': '',
    'APP_ID': '',
    'PHONE_NUMBER_ID': '',
    'BUSINESS_ACCOUNT_ID': '',
    'WEBHOOK_VERIFY_TOKEN': 'verify-me',
    'APP_SECRET': 'app-secret',
    'WEBHOOK_CALLBACK_URL': '',
    'API_VERSION': 'v23.0',
    'API_BASE_URL': 'https://graph.facebook.com',
}


class CandidateViewsTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            'recruiter', password='secret', is_staff=True
        )
        self.candidate = Candidate.objects.create(external_id='77001234567')

    def test_candidate_page_and_api_require_login(self):
        for url in (
            reverse('recruiting:candidates'),
            reverse('recruiting:candidate-list-api'),
            reverse('recruiting:candidate-detail-api', args=[self.candidate.id]),
        ):
            response = self.client.get(url)
            self.assertEqual(response.status_code, 302)
            self.assertTrue(response.url.startswith('/login/'))

    def test_custom_login_accepts_staff_user(self):
        response = self.client.post(reverse('recruiting:login'), {
            'username': 'recruiter', 'password': 'secret', 'next': '/candidates/'
        })
        self.assertRedirects(response, '/candidates/', fetch_redirect_response=False)

    def test_custom_login_rejects_external_redirect(self):
        response = self.client.post(reverse('recruiting:login'), {
            'username': 'recruiter', 'password': 'secret', 'next': 'https://example.com/'
        })
        self.assertRedirects(response, '/candidates/', fetch_redirect_response=False)

    def test_root_uses_application_route_and_admin_is_disabled(self):
        self.assertRedirects(self.client.get('/'), '/candidates/', fetch_redirect_response=False)
        self.assertEqual(self.client.get('/admin/').status_code, 404)

    def test_custom_login_does_not_allow_non_staff_user(self):
        get_user_model().objects.create_user('candidate-user', password='secret')
        response = self.client.post(reverse('recruiting:login'), {
            'username': 'candidate-user', 'password': 'secret'
        })
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Неверный логин или пароль')

    def test_authenticated_recruiter_can_read_candidates(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse('recruiting:candidates')).status_code, 200)
        response = self.client.get(reverse('recruiting:candidate-list-api'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['results'][0]['wa_url'], 'https://wa.me/77001234567')


@override_settings(WHATSAPP=TEST_WHATSAPP, BOT_TRANSPORT='whatsapp')
class WhatsAppWebhookTests(TestCase):
    def test_parser_accepts_non_text_first_message(self):
        payload = {
            'entry': [{'changes': [{'value': {
                'contacts': [{'wa_id': '7700', 'profile': {'name': 'Иван'}}],
                'messages': [{
                    'from': '7700', 'id': 'wamid.image', 'type': 'image',
                    'timestamp': '1700000000', 'image': {'id': 'media-id'},
                }],
            }}]}]
        }
        parsed = list(_parse_whatsapp_messages(payload))
        self.assertEqual(parsed[0].text, '[Изображение]')
        self.assertEqual(parsed[0].display_name, 'Иван')

    def test_verification_requires_matching_token(self):
        url = reverse('recruiting:whatsapp-webhook')
        response = self.client.get(url, {
            'hub.mode': 'subscribe', 'hub.verify_token': 'verify-me', 'hub.challenge': '42'
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, b'42')

    def test_post_rejects_invalid_signature(self):
        response = self.client.post(
            reverse('recruiting:whatsapp-webhook'),
            data='{}', content_type='application/json',
            HTTP_X_HUB_SIGNATURE_256='sha256=wrong',
        )
        self.assertEqual(response.status_code, 403)

    def test_status_only_webhook_with_valid_signature_is_acknowledged(self):
        body = json.dumps({'entry': []}).encode()
        signature = 'sha256=' + hmac.new(b'app-secret', body, hashlib.sha256).hexdigest()
        response = self.client.post(
            reverse('recruiting:whatsapp-webhook'),
            data=body, content_type='application/json',
            HTTP_X_HUB_SIGNATURE_256=signature,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})
