# backend/notifications/utils.py
from notifications.models import Notification

def create_notification(user, title, message, notification_type, priority="medium", related_url=None):
    """Helper function to create notifications consistently"""
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        type=notification_type,
        priority=priority,
        related_url=related_url
    )

def notify_appointment_confirmed(appointment):
    """Create notifications when an appointment is confirmed"""
    # Notify patient
    create_notification(
        user=appointment.patient.user,
        title="Appointment Confirmed",
        message=f"Your appointment with Dr. {appointment.provider.last_name} has been confirmed for {appointment.confirmed_date}",
        notification_type="appointment",
        related_url=f"/appointments/{appointment.id}"
    )
    
    # Notify provider
    create_notification(
        user=appointment.provider,
        title="Appointment Confirmed",
        message=f"Appointment with {appointment.patient.user.get_full_name()} confirmed for {appointment.confirmed_date}",
        notification_type="appointment",
        related_url=f"/appointments/{appointment.id}"
    )

def notify_appointment_cancelled(appointment, cancelled_by):
    """Create notifications when an appointment is cancelled"""
    # Notify patient
    create_notification(
        user=appointment.patient.user,
        title="Appointment Cancelled",
        message=f"Your appointment with Dr. {appointment.provider.last_name} has been cancelled.",
        notification_type="appointment",
        priority="high",
        related_url=f"/appointments/{appointment.id}"
    )
    
    # Notify provider
    create_notification(
        user=appointment.provider,
        title="Appointment Cancelled",
        message=f"Appointment with {appointment.patient.user.get_full_name()} has been cancelled.",
        notification_type="appointment",
        priority="high",
        related_url=f"/appointments/{appointment.id}"
    )

def notify_new_report(patient, report_title):
    """Create notification when a new report is added"""
    create_notification(
        user=patient.user,
        title="New Medical Report",
        message=f"A new report '{report_title}' has been added to your record",
        notification_type="report",
        related_url="/reports"
    )

def notify_prescription_ready(patient, medication):
    """Create notification when a prescription is ready"""
    create_notification(
        user=patient.user,
        title="Prescription Ready",
        message=f"Your prescription for {medication} is ready for pickup",
        notification_type="prescription",
        priority="high",
        related_url="/prescriptions"
    )

def notify_lab_results_ready(patient, test_name):
    """Create notification when lab results are available"""
    create_notification(
        user=patient.user,
        title="Lab Results Available",
        message=f"Your {test_name} results are now available to view",
        notification_type="lab_result",
        related_url="/lab-results"
    )