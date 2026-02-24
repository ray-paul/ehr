# backend/accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('master_admin', 'Master Admin'),  # New super role
        ('admin', 'Administrator'),
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('pharmacist', 'Pharmacist'),
        ('radiologist', 'Radiologist'),
        ('labscientist', 'Lab Scientist'),
        ('patient', 'Patient'),
    )
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='patient')
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
    verified_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_users')
    
    # Role management
    role_updated_at = models.DateTimeField(auto_now=True)
    role_updated_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='role_updates')
    
    # Account status
    is_active = models.BooleanField(default=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)
    deactivated_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='deactivated_users')
    
    def __str__(self):
        return f"{self.username} ({self.user_type})"
    
    @property
    def is_master_admin(self):
        return self.user_type == 'master_admin'
    
    @property
    def can_manage_roles(self):
        return self.user_type in ['master_admin', 'admin']
    
    @property
    def can_verify_users(self):
        return self.user_type in ['master_admin', 'admin']
    
    @property
    def can_deactivate_users(self):
        return self.user_type in ['master_admin', 'admin']
    
    @property
    def can_view_all_users(self):
        return self.user_type in ['master_admin', 'admin']
    
    def save(self, *args, **kwargs):
        # Auto-verify master admin
        if self.user_type == 'master_admin':
            self.is_verified = True
        super().save(*args, **kwargs)

class UserRole(models.Model):
    """Model for user roles/permissions"""
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts_user_role'
        
    def __str__(self):
        return self.name