from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime


@dataclass(frozen=True)
class SendResult:
    external_message_id: str | None = None
    sent_at: datetime | None = None
    metadata: dict = field(default_factory=dict)


class MessageTransport(ABC):
    name: str

    @abstractmethod
    def send_message(self, recipient_id: str, text: str) -> SendResult:
        raise NotImplementedError
