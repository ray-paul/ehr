from django.db import models
from django.conf import settings
from patients.models import Patient

class LabTestType(models.Model):
    """Master list of lab test types"""
    CATEGORY_CHOICES = (
        ('blood', 'Blood Test'),
        ('urine', 'Urinalysis'),
        ('imaging', 'Imaging'),
        ('pathology', 'Pathology'),
        ('microbiology', 'Microbiology'),
        ('genetic', 'Genetic Testing'),
    )
    
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    unit = models.CharField(max_length=50, help_text="e.g., mg/dL, cells/μL", blank=True)
    reference_range_min = models.FloatField(null=True, blank=True)
    reference_range_max = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

class LabOrder(models.Model):
    STATUS_CHOICES = (
        ('ordered', 'Ordered'),
        ('collected', 'Sample Collected'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    PRIORITY_CHOICES = (
        ('routine', 'Routine'),
        ('urgent', 'Urgent'),
        ('stat', 'STAT'),
    )
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='lab_orders')
    ordered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lab_orders_ordered')
    test_type = models.ForeignKey(LabTestType, on_delete=models.PROTECT)
    
    order_date = models.DateTimeField(auto_now_add=True)
    collection_date = models.DateTimeField(null=True, blank=True)
    collection_site = models.CharField(max_length=200, blank=True)
    collected_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='samples_collected')
    
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='routine')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ordered')
    clinical_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-order_date']
    
    def __str__(self):
        return f"{self.test_type.name} - {self.patient.user.get_full_name()}"

class LabResult(models.Model):
    lab_order = models.ForeignKey(LabOrder, on_delete=models.CASCADE, related_name='results')
    parameter = models.CharField(max_length=200)
    value = models.CharField(max_length=100)
    unit = models.CharField(max_length=50, blank=True)
    reference_range = models.CharField(max_length=100, blank=True)
    is_abnormal = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['parameter']
    
    def __str__(self):
        return f"{self.parameter}: {self.value} {self.unit}"

class LabAttachment(models.Model):
    lab_order = models.ForeignKey(LabOrder, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='lab_results/')
    filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.filename