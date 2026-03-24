# backend/appointments_app/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Appointment
from notifications.utils import notify_appointment_confirmed

@receiver(post_save, sender=Appointment)
def appointment_post_save(sender, instance, created, **kwargs):
    """Send notifications when appointment status changes"""
    if instance.status == 'confirmed' and not getattr(instance, '_notifications_sent', False):
        notify_appointment_confirmed(instance)
        instance._notifications_sent = True