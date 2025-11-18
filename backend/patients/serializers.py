# backend/patients/serializers.py
from rest_framework import serializers
from .models import Patient, ClinicalNote
from .models import Appointment

class PatientSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class ClinicalNoteSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)

    class Meta:
        model = ClinicalNote
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')