# backend/patients/admin.py
from django.contrib import admin
from .models import Patient, ClinicalNote, Allergy, Medication, ChronicCondition, Insurance, PrimaryCarePhysician

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'date_of_birth', 'gender', 'phone', 'blood_type', 'created_at']
    list_filter = ['gender', 'blood_type', 'created_at']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Personal Information', {
            'fields': ('date_of_birth', 'gender', 'phone', 'address')
        }),
        ('Medical Information', {
            'fields': ('blood_type', 'emergency_contact'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(ClinicalNote)
class ClinicalNoteAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'provider', 'created_at']
    list_filter = ['created_at']
    search_fields = ['patient__user__first_name', 'patient__user__last_name', 'provider__username']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Allergy)
class AllergyAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'allergen', 'severity', 'created_at']
    list_filter = ['severity', 'created_at']
    search_fields = ['allergen', 'patient__user__first_name', 'patient__user__last_name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(ChronicCondition)
class ChronicConditionAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'condition', 'is_active', 'diagnosed_date']
    list_filter = ['is_active', 'diagnosed_date']
    search_fields = ['condition', 'patient__user__first_name', 'patient__user__last_name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'name', 'dosage', 'frequency', 'is_active', 'prescribed_date']
    list_filter = ['is_active', 'frequency', 'prescribed_date']
    search_fields = ['name', 'patient__user__first_name', 'patient__user__last_name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Insurance)
class InsuranceAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'provider', 'policy_number', 'expiry_date', 'is_primary']
    list_filter = ['is_primary', 'expiry_date']
    search_fields = ['provider', 'policy_number', 'patient__user__first_name', 'patient__user__last_name']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(PrimaryCarePhysician)
class PrimaryCarePhysicianAdmin(admin.ModelAdmin):
    list_display = ['id', 'patient', 'name', 'practice_name', 'phone', 'email']
    search_fields = ['name', 'practice_name', 'patient__user__first_name', 'patient__user__last_name']
    readonly_fields = ['created_at', 'updated_at']