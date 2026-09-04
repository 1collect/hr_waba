from django.urls import path

from .consumers import RecruitingConsumer


websocket_urlpatterns = [
    path('ws/recruiting/', RecruitingConsumer.as_asgi()),
]
