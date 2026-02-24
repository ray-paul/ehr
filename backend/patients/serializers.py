# backend/patients/serializers.py
from rest_framework import serializers
from .models import (
    Patient, ClinicalNote, Allergy, ChronicCondition, 
    Medication, Insurance, PrimaryCarePhysician
)
from django.contrib.auth import get_user_model

User = get_user_model()

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'user_type')

class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class ChronicConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronicCondition
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class MedicationSerializer(serializers.ModelSerializer):
    prescribed_by_name = serializers.CharField(source='prescribed_by.get_full_name', read_only=True)
    
    class Meta:
        model = Medication
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class InsuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insurance
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class PrimaryCarePhysicianSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrimaryCarePhysician
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class PatientSerializer(serializers.ModelSerializer):
    user_details = UserBasicSerializer(source='user', read_only=True)
    full_name = serializers.CharField(source='full_name', read_only=True)
    age = serializers.IntegerField(source='age', read_only=True)
    allergies = AllergySerializer(many=True, read_only=True)
    chronic_conditions = ChronicConditionSerializer(many=True, read_only=True)
    medications = MedicationSerializer(many=True, read_only=True)
    insurance = InsuranceSerializer(read_only=True)
    primary_care_physician = PrimaryCarePhysicianSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class PatientCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Patient
        fields = ('username', 'password', 'email', 'first_name', 'last_name',
                 'date_of_birth', 'gender', 'phone', 'address', 'emergency_contact', 'blood_type')
    
    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        
        # Extract user data if provided
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        email = validated_data.pop('email', None)
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        
        # Check if we're creating a new user
        if username and password:
            # Create user with provided credentials
            new_user = User.objects.create_user(
                username=username,
                password=password,
                email=email or '',
                first_name=first_name or '',
                last_name=last_name or ''
            )
            new_user.user_type = 'patient'
            new_user.is_active = True
            new_user.save()
        else:
            # For master_admin creating patients without user credentials
            import random
            import string
            
            random_username = email or f"patient_{random.randint(10000, 99999)}"
            random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
            
            new_user = User.objects.create_user(
                username=random_username,
                password=random_password,
                email=email or '',
                first_name=first_name or validated_data.get('first_name', ''),
                last_name=last_name or validated_data.get('last_name', '')
            )
            new_user.user_type = 'patient'
            new_user.is_active = True
            new_user.save()
        
        # Create patient with new user
        patient = Patient.objects.create(user=new_user, **validated_data)
        return patient

class ClinicalNoteSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.get_full_name', read_only=True)
    provider_type = serializers.CharField(source='provider.user_type', read_only=True)
    
    class Meta:
        model = ClinicalNote
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'provider')