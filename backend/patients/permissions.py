# backend/patients/permissions.py
from rest_framework import permissions

class IsProviderOrAdmin(permissions.BasePermission):
    """Allow access to doctors, nurses, admins, and master_admins"""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        allowed_types = ('doctor', 'nurse', 'admin', 'master_admin')
        return bool(user and user.is_authenticated and getattr(user, 'user_type', None) in allowed_types)


class IsDoctorOrNurse(permissions.BasePermission):
    """Allow access only to users with user_type 'doctor' or 'nurse'."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        allowed_types = ('doctor', 'nurse')
        return bool(user and user.is_authenticated and getattr(user, 'user_type', None) in allowed_types)


class IsOwnerOrProviderOrReadOnly(permissions.BasePermission):
    """Object-level permission:
    - Safe methods: providers/admins can read any; patients can read their own records.
    - Unsafe methods: only providers/admins can create/update/delete.
    """

    def has_permission(self, request, view):
        # Ensure authenticated for any access
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Allowed provider types
        provider_types = ('doctor', 'nurse', 'admin', 'master_admin')
        
        # Read permissions
        if request.method in permissions.SAFE_METHODS:
            # Providers and admins can read any object
            if getattr(user, 'user_type', None) in provider_types:
                return True
            
            # If object has `user` (Patient), check ownership
            if hasattr(obj, 'user'):
                return obj.user == user
            
            # If object has `patient` (ClinicalNote, etc.), check patient.user
            if hasattr(obj, 'patient') and hasattr(obj.patient, 'user'):
                return obj.patient.user == user
            
            return False

        # Write permissions: only providers and admins
        return getattr(user, 'user_type', None) in provider_types


class IsProviderOnly(permissions.BasePermission):
    """Allow access only to providers (doctors, nurses) but not admins"""
    
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        allowed_types = ('doctor', 'nurse')
        return bool(user and user.is_authenticated and getattr(user, 'user_type', None) in allowed_types)


class IsAdminOnly(permissions.BasePermission):
    """Allow access only to admins and master_admins"""
    
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        allowed_types = ('admin', 'master_admin')
        return bool(user and user.is_authenticated and getattr(user, 'user_type', None) in allowed_types)


class IsMasterAdminOnly(permissions.BasePermission):
    """Allow access only to master_admin"""
    
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and getattr(user, 'user_type', None) == 'master_admin')