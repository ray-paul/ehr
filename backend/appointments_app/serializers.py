# backend/appointments/serializers.py
from rest_framework import serializers
from .models import Appointment_app, AppointmentMessage

class AppointmentMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    
    class Meta:
        model = AppointmentMessage
        fields = '__all__'
        read_only_fields = ('created_at',)

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    messages = AppointmentMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Appointment_app
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment_app
        fields = ('title', 'description', 'patient_suggested_date', 'provider')