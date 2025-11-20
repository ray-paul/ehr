# backend/appointments_app/models.py
from django.db import models
from django.contrib.auth.models import User
from patients.models import Patient

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('requested', 'Requested'),
        ('proposed', 'Counter Proposed'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    provider = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Patient's suggested time
    patient_suggested_date = models.DateTimeField()
    
    # Provider's counter proposal
    provider_proposed_date = models.DateTimeField(null=True, blank=True)
    
    # Final confirmed time
    confirmed_date = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} - {self.patient.user.get_full_name()}"

class AppointmentMessage(models.Model):
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']