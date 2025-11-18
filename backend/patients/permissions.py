from rest_framework import permissions


class IsDoctorOrNurse(permissions.BasePermission):
    """Allow access only to users with user_type 'doctor' or 'nurse'."""

    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and getattr(user, 'user_type', None) in ('doctor', 'nurse'))


class IsOwnerOrProviderOrReadOnly(permissions.BasePermission):
    """Object-level permission:
    - Safe methods: doctors/nurses can read any; patients can read their own records.
    - Unsafe methods: only doctors/nurses (providers) can create/update/delete.
    """

    def has_permission(self, request, view):
        # Ensure authenticated for any access
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        # Read permissions
        if request.method in permissions.SAFE_METHODS:
            if getattr(user, 'user_type', None) in ('doctor', 'nurse'):
                return True
            # If object has `user` (Patient), check ownership; if ClinicalNote, check patient.user
            if hasattr(obj, 'user'):
                return obj.user == user
            if hasattr(obj, 'patient') and hasattr(obj.patient, 'user'):
                return obj.patient.user == user
            return False

        # Write permissions: only providers
        return getattr(user, 'user_type', None) in ('doctor', 'nurse')
