from django.utils import timezone

from .base import MessageTransport, SendResult


class TerminalTransport(MessageTransport):
    name = 'terminal'

    def __init__(self, output=None):
        self.output = output or print

    def send_message(self, recipient_id: str, text: str) -> SendResult:
        self.output(f'Бот → {recipient_id}: {text}')
        return SendResult(sent_at=timezone.now())
