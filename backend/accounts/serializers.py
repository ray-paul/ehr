from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from knox.models import AuthToken
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'user_type', 
                  'work_id', 'license_number', 'specialization', 'phone', 'address',
                  'date_of_birth', 'is_verified', 'profile_picture', 'date_joined')
        read_only_fields = ('is_verified', 'date_joined')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Invalid credentials")

class StaffRegisterSerializer(serializers.ModelSerializer):
    password_confirmation = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirmation', 
                  'first_name', 'last_name', 'user_type', 'work_id', 
                  'license_number', 'specialization', 'phone', 'address', 'date_of_birth')
        extra_kwargs = {
            'password': {'write_only': True},
            'work_id': {'required': True}
        }

    def validate(self, data):
        # Check password confirmation
        if data['password'] != data.pop('password_confirmation'):
            raise serializers.ValidationError({"password": "Passwords don't match."})
        
        # Validate password strength
        try:
            validate_password(data['password'])
        except Exception as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        # Validate user_type is staff
        user_type = data.get('user_type')
        staff_types = ['doctor', 'nurse', 'pharmacist', 'radiologist', 'labscientist', 'admin']
        
        if user_type not in staff_types:
            raise serializers.ValidationError({
                "user_type": f"Staff registration only allowed for: {', '.join(staff_types)}"
            })
        
        # Validate work_id for staff
        work_id = data.get('work_id')
        if not work_id:
            raise serializers.ValidationError({"work_id": "Work ID is required for staff members."})
        
        # Check if work_id is already taken
        if User.objects.filter(work_id=work_id).exists():
            raise serializers.ValidationError({"work_id": "This work ID is already registered."})
        
        return data

    def create(self, validated_data):
        # Create user with hashed password
        user = User.objects.create_user(**validated_data)
        return user

class PatientRegisterSerializer(serializers.ModelSerializer):
    password_confirmation = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirmation', 
                  'first_name', 'last_name', 'phone', 'address', 'date_of_birth')
        extra_kwargs = {'password': {'write_only': True}}

    def validate(self, data):
        # Check password confirmation
        if data['password'] != data.pop('password_confirmation'):
            raise serializers.ValidationError({"password": "Passwords don't match."})
        
        # Validate password strength
        try:
            validate_password(data['password'])
        except Exception as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        return data

    def create(self, validated_data):
        # Set user_type to patient automatically
        validated_data['user_type'] = 'patient'
        user = User.objects.create_user(**validated_data)
        return user