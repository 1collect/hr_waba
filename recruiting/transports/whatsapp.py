import json
from urllib import error, request

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone

from .base import MessageTransport, SendResult


class WhatsAppTransport(MessageTransport):
    name = 'whatsapp'

    def __init__(self, access_token, phone_number_id, api_version, api_base_url):
        self.access_token = access_token
        self.phone_number_id = phone_number_id
        self.api_version = api_version
        self.api_base_url = api_base_url.rstrip('/')

    @classmethod
    def from_settings(cls):
        config = settings.WHATSAPP
        missing = [key for key in ('ACCESS_TOKEN', 'PHONE_NUMBER_ID') if not config[key]]
        if missing:
            names = ', '.join(f'WHATSAPP_{key}' for key in missing)
            raise ImproperlyConfigured(f'Для WhatsApp не заполнены: {names}')
        return cls(
            config['ACCESS_TOKEN'], config['PHONE_NUMBER_ID'],
            config['API_VERSION'], config['API_BASE_URL'],
        )

    def send_message(self, recipient_id: str, text: str) -> SendResult:
        return self._send(recipient_id, {'type': 'text', 'text': {'preview_url': False, 'body': text}})

    def send_buttons(self, recipient_id: str, text: str, buttons: list) -> SendResult:
        return self._send(recipient_id, {
            'type': 'interactive',
            'interactive': {
                'type': 'button', 'body': {'text': text},
                'action': {'buttons': [{'type': 'reply', 'reply': button} for button in buttons]},
            },
        })

    def _send(self, recipient_id, content) -> SendResult:
        url = f'{self.api_base_url}/{self.api_version}/{self.phone_number_id}/messages'
        payload = json.dumps({
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': recipient_id,
            **content,
        }).encode('utf-8')
        http_request = request.Request(
            url,
            data=payload,
            method='POST',
            headers={
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json',
            },
        )
        try:
            with request.urlopen(http_request, timeout=15) as response:
                data = json.loads(response.read().decode('utf-8'))
        except error.HTTPError as exc:
            details = exc.read().decode('utf-8', errors='replace')
            raise RuntimeError(f'WhatsApp API вернул HTTP {exc.code}: {details}') from exc
        message_id = (data.get('messages') or [{}])[0].get('id')
        return SendResult(external_message_id=message_id, sent_at=timezone.now(), metadata=data)
