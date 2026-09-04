from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.test import TransactionTestCase

from recruiting.consumers import RecruitingConsumer


class RecruitingWebSocketTests(TransactionTestCase):
    def setUp(self):
        self.staff = get_user_model().objects.create_user(
            username='realtime-staff', password='secret', is_staff=True
        )

    async def test_anonymous_connection_is_rejected(self):
        communicator = WebsocketCommunicator(RecruitingConsumer.as_asgi(), '/ws/recruiting/')
        communicator.scope['user'] = AnonymousUser()
        connected, code = await communicator.connect()
        self.assertFalse(connected)
        self.assertEqual(code, 4403)

    async def test_staff_connection_is_accepted(self):
        communicator = WebsocketCommunicator(RecruitingConsumer.as_asgi(), '/ws/recruiting/')
        communicator.scope['user'] = self.staff
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        message = await communicator.receive_json_from(timeout=2)
        self.assertEqual(message, {'type': 'candidates.changed'})
        await communicator.disconnect()
