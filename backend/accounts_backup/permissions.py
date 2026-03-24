# backend/accounts/permissions.py
from rest_framework import permissions

class IsMedicalStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_medical_staff

class CanPrescribe(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_prescribe

class CanAccessAllPatientData(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_access_all_patient_data

class CanUploadLabResults(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_upload_lab_results

class CanUploadRadiology(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_upload_radiology

class IsOwnerOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.can_access_all_patient_data:
            return True
        return obj.patient.user == request.user