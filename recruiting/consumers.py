import asyncio

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.db.models import Count, Max
from django.utils import timezone

from .models import Candidate


class RecruitingConsumer(AsyncJsonWebsocketConsumer):
    poll_interval = 0.75

    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated or not user.is_active or not user.is_staff:
            await self.close(code=4403)
            return
        self.candidate_id = None
        self.feed_fingerprint = None
        self.detail_fingerprint = None
        self.typing = None
        await self.accept()
        self.watch_task = asyncio.create_task(self.watch_changes())

    async def disconnect(self, close_code):
        task = getattr(self, 'watch_task', None)
        if task:
            task.cancel()

    async def receive_json(self, content, **kwargs):
        event_type = content.get('type')
        if event_type == 'candidate.subscribe':
            try:
                self.candidate_id = int(content['candidate_id'])
            except (KeyError, TypeError, ValueError):
                return
            self.detail_fingerprint = None
            self.typing = None
        elif event_type == 'candidate.unsubscribe':
            self.candidate_id = None
            self.detail_fingerprint = None
            self.typing = None

    async def watch_changes(self):
        try:
            while True:
                feed = await self.get_feed_fingerprint()
                if self.feed_fingerprint is None or feed != self.feed_fingerprint:
                    await self.send_json({'type': 'candidates.changed'})
                self.feed_fingerprint = feed

                if self.candidate_id is not None:
                    detail = await self.get_candidate_fingerprint(self.candidate_id)
                    if detail is None:
                        await self.send_json({
                            'type': 'candidate.removed', 'candidate_id': self.candidate_id
                        })
                        self.candidate_id = None
                    else:
                        fingerprint, typing = detail
                        if self.detail_fingerprint is None or fingerprint != self.detail_fingerprint:
                            await self.send_json({
                                'type': 'candidate.changed', 'candidate_id': self.candidate_id
                            })
                        if typing != self.typing:
                            await self.send_json({
                                'type': 'candidate.typing',
                                'candidate_id': self.candidate_id,
                                'typing': typing,
                            })
                        self.detail_fingerprint = fingerprint
                        self.typing = typing
                await asyncio.sleep(self.poll_interval)
        except asyncio.CancelledError:
            pass

    @database_sync_to_async
    def get_feed_fingerprint(self):
        return tuple(Candidate.objects.order_by('id').annotate(
            answer_count=Count('answers'),
            last_message_id=Max('messages__id'),
        ).values_list('id', 'status', 'updated_at', 'answer_count', 'last_message_id'))

    @database_sync_to_async
    def get_candidate_fingerprint(self, candidate_id):
        candidate = Candidate.objects.filter(pk=candidate_id).annotate(
            answer_count=Count('answers'),
            last_message_id=Max('messages__id'),
        ).values(
            'status', 'updated_at', 'answer_count', 'last_message_id', 'typing_until'
        ).first()
        if candidate is None:
            return None
        typing_until = candidate.pop('typing_until')
        typing = bool(typing_until and typing_until > timezone.now())
        return tuple(candidate.values()), typing
