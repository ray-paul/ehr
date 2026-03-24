# backend/authentication/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'user_type', 'phone', 'address', 'date_of_birth', 'gender', 
                  'is_verified', 'is_superuser', 'is_staff')
        read_only_fields = ('is_verified', 'is_superuser', 'is_staff')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        
        # Set default user_type for superusers if not set
        if user.is_superuser and not user.user_type:
            user.user_type = 'master_admin'
            user.save()
        
        data['user'] = user
        return data

class RegisterPatientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 
                  'phone', 'address', 'date_of_birth', 'gender')
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.user_type = 'patient'
        user.save()
        return user

class RegisterStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 
                  'user_type', 'phone', 'address')
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user