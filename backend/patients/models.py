# backend/patients/models.py
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator

class Patient(models.Model):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    
    BLOOD_TYPE_CHOICES = (
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    )
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=15, validators=[RegexValidator(r'^\+?1?\d{9,15}$')])
    address = models.TextField(blank=True)
    emergency_contact = models.TextField(blank=True, help_text="Name, relationship, phone number")
    blood_type = models.CharField(max_length=3, choices=BLOOD_TYPE_CHOICES, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}"

    @property
    def age(self):
        from datetime import date
        if self.date_of_birth:
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None


class ClinicalNote(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subjective = models.TextField(help_text="Patient's symptoms and history")
    objective = models.TextField(help_text="Objective findings, vitals, etc.")
    assessment = models.TextField(help_text="Assessment and diagnosis")
    plan = models.TextField(help_text="Treatment plan")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Note for {self.patient} by {self.provider} on {self.created_at.date()}"


class Allergy(models.Model):
    SEVERITY_CHOICES = (
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
        ('life_threatening', 'Life Threatening'),
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='allergies')
    allergen = models.CharField(max_length=200)
    reaction = models.TextField(help_text="Description of reaction")
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='mild')
    diagnosed_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['allergen']
        verbose_name_plural = 'Allergies'

    def __str__(self):
        return f"{self.allergen} - {self.patient.full_name}"


class ChronicCondition(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='chronic_conditions')
    condition = models.CharField(max_length=200)
    diagnosed_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['condition']

    def __str__(self):
        return f"{self.condition} - {self.patient.full_name}"


class Medication(models.Model):
    FREQUENCY_CHOICES = (
        ('once', 'Once'),
        ('daily', 'Once Daily'),
        ('bid', 'Twice Daily'),
        ('tid', 'Three Times Daily'),
        ('qid', 'Four Times Daily'),
        ('q4h', 'Every 4 Hours'),
        ('q6h', 'Every 6 Hours'),
        ('q8h', 'Every 8 Hours'),
        ('q12h', 'Every 12 Hours'),
        ('prn', 'As Needed'),
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medications')
    name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100, help_text="e.g., 500mg, 10ml")
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    route = models.CharField(max_length=50, default='oral', help_text="e.g., oral, topical, IV")
    prescribed_date = models.DateField()
    prescribed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-prescribed_date']

    def __str__(self):
        return f"{self.name} - {self.patient.full_name}"


class Insurance(models.Model):
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='insurance')
    provider = models.CharField(max_length=200)
    policy_number = models.CharField(max_length=100)
    group_number = models.CharField(max_length=100, blank=True)
    holder_name = models.CharField(max_length=200, help_text="Name of policy holder")
    holder_relationship = models.CharField(max_length=50, help_text="Relationship to patient")
    expiry_date = models.DateField()
    is_primary = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider} - {self.patient.full_name}"


class PrimaryCarePhysician(models.Model):
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='primary_care_physician')
    name = models.CharField(max_length=200)
    practice_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.patient.full_name}"