# backend/appointments_app/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
from patients.models import Patient

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('requested', 'Requested'),
        ('proposed', 'Counter Proposed'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('no_show', 'No Show'),
        ('rescheduled', 'Rescheduled'),
    )
    
    APPOINTMENT_TYPES = (
        ('checkup', 'General Checkup'),
        ('followup', 'Follow-up Visit'),
        ('emergency', 'Emergency'),
        ('consultation', 'Consultation'),
        ('procedure', 'Procedure'),
        ('vaccination', 'Vaccination'),
        ('lab_test', 'Lab Test'),
        ('imaging', 'Imaging/Radiology'),
    )
    
    # CHANGE THIS related_name to avoid conflict
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments_app')
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='provider_appointments')
    
    # Basic Info
    title = models.CharField(max_length=200)
    appointment_type = models.CharField(max_length=20, choices=APPOINTMENT_TYPES, default='checkup')
    description = models.TextField(blank=True)
    reason = models.TextField(help_text="Reason for appointment", blank=True)
    
    # Time Management
    patient_suggested_date = models.DateTimeField()
    provider_proposed_date = models.DateTimeField(null=True, blank=True)
    confirmed_date = models.DateTimeField(null=True, blank=True)
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    
    # Duration in minutes
    estimated_duration = models.IntegerField(default=30, help_text="Estimated duration in minutes")
    
    # Status & Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    cancellation_reason = models.TextField(blank=True)
    rescheduled_from = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='appointments_created')
    
    # Notifications
    reminder_sent = models.BooleanField(default=False)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-patient_suggested_date', '-created_at']
        indexes = [
            models.Index(fields=['status', 'patient_suggested_date']),
            models.Index(fields=['provider', 'status']),
        ]
    
    def __str__(self):
        return f"{self.get_appointment_type_display()} - {self.patient.user.get_full_name()} - {self.status}"
    
    def confirm(self, confirmed_by):
        self.status = 'confirmed'
        self.confirmed_date = self.provider_proposed_date or self.patient_suggested_date
        self.save()
        AppointmentMessage.objects.create(
            appointment=self,
            sender=confirmed_by,
            message=f"Appointment confirmed for {self.confirmed_date.strftime('%B %d, %Y at %I:%M %p')}"
        )
    
    def cancel(self, cancelled_by, reason):
        self.status = 'cancelled'
        self.cancellation_reason = reason
        self.save()
        AppointmentMessage.objects.create(
            appointment=self,
            sender=cancelled_by,
            message=f"Appointment cancelled. Reason: {reason}"
        )
    
    def complete(self):
        self.status = 'completed'
        self.actual_end_time = timezone.now()
        self.save()
    
    def reschedule(self, new_date, rescheduled_by):
        # Create new appointment with reference to this one
        new_appointment = Appointment.objects.create(
            patient=self.patient,
            provider=self.provider,
            title=self.title,
            appointment_type=self.appointment_type,
            description=self.description,
            reason=self.reason,
            patient_suggested_date=new_date,
            status='requested',
            rescheduled_from=self,
            created_by=rescheduled_by
        )
        
        # Update original appointment
        self.status = 'rescheduled'
        self.save()
        
        AppointmentMessage.objects.create(
            appointment=self,
            sender=rescheduled_by,
            message=f"Appointment rescheduled to {new_date.strftime('%B %d, %Y at %I:%M %p')}"
        )
        
        return new_appointment


class AppointmentMessage(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def mark_as_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save()


class AppointmentReminder(models.Model):
    REMINDER_TYPES = (
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('push', 'Push Notification'),
    )
    
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=10, choices=REMINDER_TYPES)
    scheduled_time = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='pending')
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['scheduled_time']


class AppointmentFeedback(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='feedback')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], null=True, blank=True)
    feedback = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Feedback for {self.appointment}"