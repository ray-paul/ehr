# backend/appointments_app/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Appointment, AppointmentMessage, AppointmentFeedback
from patients.models import Patient
from django.contrib.auth import get_user_model

User = get_user_model()

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
    
    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}".strip() or obj.patient.user.username
    
    def get_provider_name(self, obj):
        return f"{obj.provider.first_name} {obj.provider.last_name}".strip() or obj.provider.username
    
    def validate_patient_suggested_date(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("Appointment date cannot be in the past")
        return value
    
    def validate_provider_proposed_date(self, value):
        if value and value < timezone.now():
            raise serializers.ValidationError("Proposed date cannot be in the past")
        return value


class AppointmentCreateSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(write_only=True, required=False)
    provider_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Appointment
        fields = ['title', 'patient_suggested_date', 'reason', 'appointment_type', 
                  'estimated_duration', 'patient_id', 'provider_id']
    
    def validate_patient_suggested_date(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("Appointment date cannot be in the past")
        return value
    
    def create(self, validated_data):
        patient_id = validated_data.pop('patient_id', None)
        provider_id = validated_data.pop('provider_id', None)
        
        if patient_id:
            validated_data['patient'] = Patient.objects.get(id=patient_id)
        if provider_id:
            validated_data['provider'] = User.objects.get(id=provider_id)
        
        return super().create(validated_data)


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['title', 'patient_suggested_date', 'provider_proposed_date', 
                  'confirmed_date', 'status', 'reason', 'appointment_type', 
                  'estimated_duration', 'cancellation_reason']
    
    def validate_patient_suggested_date(self, value):
        if value and value < timezone.now():
            raise serializers.ValidationError("Appointment date cannot be in the past")
        return value
    
    def validate_provider_proposed_date(self, value):
        if value and value < timezone.now():
            raise serializers.ValidationError("Proposed date cannot be in the past")
        return value


class AppointmentMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AppointmentMessage
        fields = ['id', 'appointment', 'sender', 'sender_name', 'message', 
                  'attachment', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'created_at']
    
    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username


class AppointmentFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentFeedback
        fields = ['id', 'appointment', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'appointment', 'created_at']
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value