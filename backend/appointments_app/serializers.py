# backend/appointments_app/serializers.py
from rest_framework import serializers
from .models import Appointment, AppointmentMessage, AppointmentFeedback
from patients.serializers import PatientSerializer
from accounts.serializers import UserSerializer

class AppointmentMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_type = serializers.CharField(source='sender.user_type', read_only=True)
    
    class Meta:
        model = AppointmentMessage
        fields = '__all__'
        read_only_fields = ('created_at', 'is_read', 'read_at')

class AppointmentFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentFeedback
        fields = '__all__'
        read_only_fields = ('submitted_at',)

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.user.get_full_name', read_only=True)
    patient_details = PatientSerializer(source='patient', read_only=True)
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    provider_details = UserSerializer(source='provider', read_only=True)
    messages = AppointmentMessageSerializer(many=True, read_only=True)
    feedback = AppointmentFeedbackSerializer(read_only=True)
    can_cancel = serializers.SerializerMethodField()
    can_reschedule = serializers.SerializerMethodField()
    can_propose = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'reminder_sent', 'reminder_sent_at')
    
    def get_can_cancel(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.status in ['requested', 'proposed', 'confirmed'] and (
                request.user == obj.provider or 
                request.user == obj.patient.user or
                request.user.user_type in ['admin', 'master_admin']
            )
        return False
    
    def get_can_reschedule(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.status == 'confirmed' and (
                request.user == obj.provider or 
                request.user == obj.patient.user
            )
        return False
    
    def get_can_propose(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.status == 'requested' and request.user == obj.provider
        return False

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('title', 'appointment_type', 'description', 'reason', 
                  'patient_suggested_date', 'estimated_duration', 'provider', 'patient')
    
    def validate_patient_suggested_date(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("Appointment date cannot be in the past")
        return value

class AppointmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ('title', 'appointment_type', 'description', 'reason', 'estimated_duration')