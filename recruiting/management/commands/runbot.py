from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from recruiting.services import BotService, IncomingMessage
from recruiting.transports.terminal import TerminalTransport


class Command(BaseCommand):
    help = 'Запускает интерактивный терминальный транспорт рекрутингового бота.'

    def add_arguments(self, parser):
        parser.add_argument('--candidate', help='Номер или идентификатор кандидата')

    def handle(self, *args, **options):
        if settings.BOT_TRANSPORT != 'terminal':
            raise CommandError(
                'Команда runbot доступна при BOT_TRANSPORT=terminal. '
                'Для whatsapp используйте webhook.'
            )
        candidate_id = options['candidate'] or input('Номер/ID кандидата: ').strip()
        if not candidate_id:
            self.stderr.write('Идентификатор не может быть пустым.')
            return

        transport = TerminalTransport(output=self.stdout.write)
        service = BotService(transport)
        self.stdout.write(
            'Введите сообщение кандидата. Команды: /typing, /switch, /quit.'
        )
        while True:
            try:
                text = input(f'{candidate_id} → Бот: ').strip()
            except (EOFError, KeyboardInterrupt):
                self.stdout.write('\nРабота завершена.')
                break
            if text == '/quit':
                break
            if text == '/switch':
                candidate_id = input('Номер/ID кандидата: ').strip() or candidate_id
                continue
            if text == '/typing':
                service.set_typing(candidate_id)
                continue
            if not text:
                continue
            service.handle(IncomingMessage(sender_id=candidate_id, text=text))
