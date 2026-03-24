# backend/appointments_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.exceptions import PermissionDenied
from . import views

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('', include(router.urls)),
    # Nested routes for messages
    path('appointments/<int:appointment_id>/messages/', 
         views.AppointmentMessageViewSet.as_view({
             'get': 'list',
             'post': 'create'
         }), name='appointment-messages'),
    path('appointments/<int:appointment_id>/messages/<int:pk>/',
         views.AppointmentMessageViewSet.as_view({
             'get': 'retrieve',
             'delete': 'destroy'
         }), name='appointment-message-detail'),
    # Nested routes for feedback (optional)
    path('appointments/<int:appointment_id>/feedback/',
         views.AppointmentFeedbackViewSet.as_view({
             'get': 'retrieve',
             'post': 'create',
             'put': 'update'
         }), name='appointment-feedback'),
]