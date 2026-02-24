from rest_framework import serializers
from .models import Appointment, AppointmentMessage, AppointmentHistory
from patients.models import Patient
from accounts.models import User
from patients.serializers import PatientSerializer
from accounts.serializers import UserSerializer

class PatientBasicSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = ['id', 'user', 'date_of_birth', 'blood_group', 'emergency_contact']

class ProviderBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'user_type', 'specialization']

class AppointmentMessageSerializer(serializers.ModelSerializer):
    sender_details = ProviderBasicSerializer(source='sender', read_only=True)
    
    class Meta:
        model = AppointmentMessage
        fields = ['id', 'appointment', 'sender', 'sender_details', 'message', 'created_at']
        read_only_fields = ['sender', 'created_at']

class AppointmentHistorySerializer(serializers.ModelSerializer):
    user_details = ProviderBasicSerializer(source='user', read_only=True)
    
    class Meta:
        model = AppointmentHistory
        fields = ['id', 'appointment', 'user', 'user_details', 'action', 'old_value', 'new_value', 'created_at']
        read_only_fields = ['created_at']

class AppointmentSerializer(serializers.ModelSerializer):
    patient_details = PatientBasicSerializer(source='patient', read_only=True)
    provider_details = ProviderBasicSerializer(source='provider', read_only=True)
    created_by_details = ProviderBasicSerializer(source='created_by', read_only=True)
    cancelled_by_details = ProviderBasicSerializer(source='cancelled_by', read_only=True)
    messages = AppointmentMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'reminder_sent_at']

class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'patient', 'provider', 'title', 'description', 'reason',
            'patient_suggested_date', 'duration', 'location', 
            'is_virtual', 'meeting_link'
        ]
    
    def validate(self, data):
        # Validate that patient and provider are different
        if data.get('patient') and data.get('provider'):
            # You might want to add additional validation here
            pass
        return data
    
    def create(self, validated_data):
        validated_data['status'] = 'requested'
        return super().create(validated_data)

class AppointmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'title', 'description', 'reason', 'duration', 
            'location', 'is_virtual', 'meeting_link'
        ]