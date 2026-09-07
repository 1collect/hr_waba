# Recruiting WhatsApp bot

Рекрутинговый бот на Django и SQLite. Анкетирование не зависит от транспорта:
сейчас сообщения можно вводить в терминале, а подготовленный адаптер Meta WhatsApp
Cloud API подключается настройкой окружения.

## Запуск

```powershell
Copy-Item .env.example .env
.\.venv\Scripts\python.exe manage.py migrate
.\.venv\Scripts\python.exe manage.py createsuperuser
.\.venv\Scripts\python.exe manage.py runserver
```

Панель кандидатов: `http://127.0.0.1:8000/`. Вход выполняется через собственную
страницу приложения.

Вопросы анкеты: `http://127.0.0.1:8000/questions/`. Вопросы можно добавлять,
редактировать и выключать. Новые вопросы добавляются в конец анкеты.

Терминальный бот запускается отдельно:

```powershell
.\.venv\Scripts\python.exe manage.py runbot --candidate 77001234567
```

Доступны команды `/typing`, `/switch` и `/quit`. Список кандидатов и открытый
диалог обновляются через WebSocket.

## WhatsApp Cloud API

Заполните переменные `WHATSAPP_*` из `.env.example`, установите
`BOT_TRANSPORT=whatsapp` и зарегистрируйте публичный callback
`https://your-domain.example/webhooks/whatsapp/` в Meta. GET используется для
проверки verify token, POST проверяет подпись `X-Hub-Signature-256` через App Secret.

Основная логика находится в `recruiting/services.py`, а транспортные адаптеры —
в `recruiting/transports/`. Поэтому переключение транспорта не меняет анкету,
модели или панель.

## Проверка

```powershell
.\.venv\Scripts\python.exe manage.py test
```
