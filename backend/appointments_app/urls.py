# backend/appointments/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet)
router.register(r'appointments/(?P<appointment_id>\d+)/messages', views.AppointmentMessageViewSet, basename='appointment-messages')

urlpatterns = [
    path('', include(router.urls)),
]