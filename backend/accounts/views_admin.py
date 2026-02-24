# backend/accounts/views_admin.py
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import User
from .serializers import UserSerializer, UserRoleSerializer, UserVerificationSerializer

class IsMasterAdminOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_manage_roles

class UserManagementView(generics.ListAPIView):
    """View all users (Master Admin and Admin only)"""
    permission_classes = [IsMasterAdminOrAdmin]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')

class UserDetailManagementView(generics.RetrieveAPIView):
    """View specific user details"""
    permission_classes = [IsMasterAdminOrAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all()

@api_view(['POST'])
@permission_classes([IsMasterAdminOrAdmin])
def update_user_role(request, user_id):
    """Update user role (Master Admin only for role changes)"""
    try:
        user = User.objects.get(id=user_id)
        
        # Only master admin can change roles to/from master_admin
        if not request.user.is_master_admin:
            if user.user_type == 'master_admin' or request.data.get('user_type') == 'master_admin':
                return Response(
                    {"error": "Only Master Admin can modify Master Admin roles"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        new_role = request.data.get('user_type')
        if new_role not in dict(User.USER_TYPE_CHOICES):
            return Response(
                {"error": "Invalid role selected"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_role = user.user_type
        user.user_type = new_role
        user.role_updated_by = request.user
        user.save()
        
        return Response({
            "message": f"User role updated from {old_role} to {new_role}",
            "user": UserSerializer(user).data
        })
        
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsMasterAdminOrAdmin])
def verify_user(request, user_id):
    """Verify a user account"""
    try:
        user = User.objects.get(id=user_id)
        
        if user.is_verified:
            return Response(
                {"error": "User is already verified"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.is_verified = True
        user.verified_at = timezone.now()
        user.verified_by = request.user
        user.save()
        
        return Response({
            "message": f"User {user.username} has been verified",
            "user": UserSerializer(user).data
        })
        
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsMasterAdminOrAdmin])
def deactivate_user(request, user_id):
    """Deactivate a user account"""
    try:
        user = User.objects.get(id=user_id)
        
        # Prevent deactivating master admin
        if user.is_master_admin:
            return Response(
                {"error": "Cannot deactivate Master Admin account"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user.is_active = False
        user.deactivated_at = timezone.now()
        user.deactivated_by = request.user
        user.save()
        
        return Response({
            "message": f"User {user.username} has been deactivated",
            "user": UserSerializer(user).data
        })
        
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
@permission_classes([IsMasterAdminOrAdmin])
def reactivate_user(request, user_id):
    """Reactivate a deactivated user account"""
    try:
        user = User.objects.get(id=user_id)
        
        user.is_active = True
        user.deactivated_at = None
        user.deactivated_by = None
        user.save()
        
        return Response({
            "message": f"User {user.username} has been reactivated",
            "user": UserSerializer(user).data
        })
        
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([IsMasterAdminOrAdmin])
def get_user_stats(request):
    """Get user statistics for dashboard"""
    stats = {
        'total_users': User.objects.count(),
        'verified_users': User.objects.filter(is_verified=True).count(),
        'pending_verification': User.objects.filter(is_verified=False, user_type__in=['doctor', 'nurse', 'pharmacist', 'radiologist', 'labscientist']).count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'deactivated_users': User.objects.filter(is_active=False).count(),
        'by_role': {}
    }
    
    for role, label in User.USER_TYPE_CHOICES:
        stats['by_role'][role] = User.objects.filter(user_type=role).count()
    
    return Response(stats)