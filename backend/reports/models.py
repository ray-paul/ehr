from django.db import models
from django.conf import settings


class Report(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    # Associate report with a Patient (nullable to ease migrations)
    patient = models.ForeignKey('patients.Patient', on_delete=models.CASCADE, null=True, blank=True, related_name='reports')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
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
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_attachment_type_display()} - {self.file.name}"
