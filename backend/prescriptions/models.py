# backend/prescriptions/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
from patients.models import Patient

class Medication(models.Model):
    """Master list of medications"""
    name = models.CharField(max_length=200)
    generic_name = models.CharField(max_length=200, blank=True)
    manufacturer = models.CharField(max_length=200, blank=True)
    strength = models.CharField(max_length=100, help_text="e.g., 500mg, 10mg/ml")
    form = models.CharField(max_length=100, help_text="e.g., tablet, capsule, liquid")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} {self.strength}"

class Prescription(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('dispensed', 'Dispensed'),
        ('partial', 'Partially Dispensed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
        ('completed', 'Completed'),
    )
    
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
        ('weekly', 'Once Weekly'),
    )
    
    ROUTE_CHOICES = (
        ('oral', 'Oral'),
        ('iv', 'Intravenous'),
        ('im', 'Intramuscular'),
        ('sc', 'Subcutaneous'),
        ('topical', 'Topical'),
        ('inhalation', 'Inhalation'),
        ('sublingual', 'Sublingual'),
        ('rectal', 'Rectal'),
    )
    
    # Core fields
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions_new')
    prescribed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prescriptions_written')
    
    # Medication info
    medication = models.ForeignKey(Medication, on_delete=models.PROTECT, null=True, blank=True)
    medication_name = models.CharField(max_length=200, help_text="Custom medication name if not in master list")
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    route = models.CharField(max_length=20, choices=ROUTE_CHOICES, default='oral')
    duration = models.CharField(max_length=100, help_text="e.g., 7 days, 2 weeks", blank=True)
    quantity = models.IntegerField(help_text="Total quantity to dispense")
    refills = models.IntegerField(default=0)
    instructions = models.TextField(help_text="Special instructions for the patient")
    
    # Dates
    prescribed_date = models.DateTimeField(default=timezone.now)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    dispensed_date = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_controlled = models.BooleanField(default=False, help_text="Controlled substance")
    
    # Audit - CHANGED related_name to be unique
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='prescriptions_created_new')
    
    class Meta:
        ordering = ['-prescribed_date']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['prescribed_by', 'status']),
        ]
    
    def __str__(self):
        med_name = self.medication.name if self.medication else self.medication_name
        return f"{med_name} - {self.patient.user.get_full_name()}"
    
    def dispense(self, dispensed_by, quantity=None):
        """Mark prescription as dispensed"""
        self.status = 'dispensed' if not quantity else 'partial'
        self.dispensed_date = timezone.now()
        self.save()
        
        # Create dispense record
        PrescriptionDispense.objects.create(
            prescription=self,
            dispensed_by=dispensed_by,
            quantity=quantity or self.quantity
        )

class PrescriptionDispense(models.Model):
    """Record of each dispense event"""
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='dispenses')
    dispensed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    dispensed_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-dispensed_date']
    
    def __str__(self):
        return f"Dispensed {self.quantity} of {self.prescription}"

class PrescriptionRenewal(models.Model):
    """Track prescription renewals"""
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='renewals')
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='renewal_requests')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='renewal_approvals')
    requested_date = models.DateTimeField(auto_now_add=True)
    approved_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=(
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
    ), default='pending')
    notes = models.TextField(blank=True)