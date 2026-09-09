from django.urls import path

from . import views

app_name = 'recruiting'

urlpatterns = [
    path('numbers/', views.channels_page, name='channels'),
    path('numbers/<int:channel_id>/edit/', views.channels_page, name='channel-edit'),
    path('numbers/<int:channel_id>/test/', views.channel_test_page, name='channel-test'),
    path('login/', views.login_page, name='login'),
    path('candidates/', views.candidates_page, name='candidates'),
    path('questions/', views.questions_page, name='questions'),
    path('api/questions/builder/', views.question_builder_api, name='question-builder-api'),
    path('api/candidates/', views.candidate_list_api, name='candidate-list-api'),
    path('api/candidates/<int:candidate_id>/', views.candidate_detail_api, name='candidate-detail-api'),
    path('api/candidates/<int:candidate_id>/answers/<int:answer_id>/', views.candidate_answer_api, name='candidate-answer-api'),
    path('webhooks/whatsapp/', views.whatsapp_webhook, name='whatsapp-webhook'),
]
