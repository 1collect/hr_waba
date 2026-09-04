from django.urls import path

from . import views

app_name = 'recruiting'

urlpatterns = [
    path('login/', views.login_page, name='login'),
    path('candidates/', views.candidates_page, name='candidates'),
    path('api/candidates/', views.candidate_list_api, name='candidate-list-api'),
    path('api/candidates/<int:candidate_id>/', views.candidate_detail_api, name='candidate-detail-api'),
    path('webhooks/whatsapp/', views.whatsapp_webhook, name='whatsapp-webhook'),
]
