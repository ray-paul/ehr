# backend/reports/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from patients.models import Patient

class Report(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    # Associate report with a Patient (nullable to ease migrations)
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class ReportAttachment(models.Model):
    ATTACHMENT_TYPES = [
        ('lab', 'Lab Report'),
        ('escript', 'E-Script'),
        ('radiography', 'Radiography'),
        ('diagnostic', 'Diagnostic Report'),
    ]

    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='report_attachments/')
    attachment_type = models.CharField(max_length=32, choices=ATTACHMENT_TYPES)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='report_attachments_uploaded')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_attachment_type_display()} - {self.file.name}"


class Prescription(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('dispensed', 'Dispensed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='reports_prescriptions')
    drug_name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration = models.CharField(max_length=100)
    instructions = models.TextField(blank=True)
    refills = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports_prescriptions_created')
    created_at = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateField()
    
    def save(self, *args, **kwargs):
        if not self.expiry_date:
            self.expiry_date = timezone.now().date() + timedelta(days=30)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.drug_name} - {self.patient.user.get_full_name()}"