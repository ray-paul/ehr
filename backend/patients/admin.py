# backend/patients/admin.py
from django.contrib import admin
from .models import Patient, ClinicalNote, Allergy, Medication, Appointment

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'date_of_birth', 'gender', 'phone', 'created_at']
    list_filter = ['gender', 'created_at']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone']

@admin.register(ClinicalNote)
class ClinicalNoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'provider', 'created_at']
    list_filter = ['created_at']
    search_fields = ['patient__user__first_name', 'patient__user__last_name']

@admin.register(Allergy)
class AllergyAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'allergen', 'severity', 'created_at']
    list_filter = ['severity', 'created_at']

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'name', 'dosage', 'active', 'prescribed_date']
    list_filter = ['active', 'prescribed_date']

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'patient', 'scheduled', 'created_by']
    list_filter = ['scheduled', 'created_at']