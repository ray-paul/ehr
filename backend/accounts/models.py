# backend/accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('admin', 'Administrator'),
        ('patient', 'Patient'),
        ('pharmacist', 'Pharmacist'),
        ('radiologist', 'Radiologist'),
        ('labscientist', 'Lab Scientist'),
    )
    
    user_type = models.CharField(max_length=15, choices=USER_TYPE_CHOICES, default='patient')
    work_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    
    # Verification fields
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"
    
    @property
    def is_medical_staff(self):
        return self.user_type in ['doctor', 'nurse', 'pharmacist', 'radiologist', 'labscientist']
    
    @property
    def can_prescribe(self):
        return self.user_type in ['doctor']
    
    @property
    def can_access_all_patient_data(self):
        return self.user_type in ['doctor', 'admin']
    
    @property
    def can_upload_lab_results(self):
        return self.user_type in ['labscientist', 'doctor']
    
    @property
    def can_upload_radiology(self):
        return self.user_type in ['radiologist', 'doctor']