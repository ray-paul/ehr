# backend/patients/models.py
from django.db import models
from django.contrib.auth.models import User

class Patient(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

class ClinicalNote(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    provider = models.ForeignKey(User, on_delete=models.CASCADE)
    subjective = models.TextField(help_text="Patient's symptoms and history")
    objective = models.TextField(help_text="Objective findings, vitals, etc.")
    assessment = models.TextField(help_text="Assessment and diagnosis")
    plan = models.TextField(help_text="Treatment plan")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Note for {self.patient} by {self.provider} on {self.created_at.date()}"
    
class Allergy(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    allergen = models.CharField(max_length=100)
    reaction = models.TextField()
    severity = models.CharField(max_length=20, choices=(
        ('mild', 'Mild'),
        ('moderate', 'Moderate'), 
        ('severe', 'Severe'),
    ))
    created_at = models.DateTimeField(auto_now_add=True)

class Medication(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50)
    frequency = models.CharField(max_length=50)
    prescribed_date = models.DateField()
    active = models.BooleanField(default=True)  