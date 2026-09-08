from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from .terminal import TerminalTransport
from .whatsapp import WhatsAppTransport


def get_transport(name=None):
    transport_name = (name or settings.BOT_TRANSPORT).lower()
    if transport_name == 'terminal':
        return TerminalTransport()
    if transport_name == 'whatsapp':
        return WhatsAppTransport.from_settings()
    raise ImproperlyConfigured(
        f'Неизвестный BOT_TRANSPORT={transport_name!r}; используйте terminal или whatsapp.'
    )


__all__ = ('get_transport', 'TerminalTransport', 'WhatsAppTransport')
