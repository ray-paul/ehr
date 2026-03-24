# backend/accounts/urls_admin.py
from django.urls import path
from . import views_admin

urlpatterns = [
    # User management
    path('users/', views_admin.UserManagementView.as_view(), name='user-list'),
    path('users/<int:user_id>/', views_admin.UserDetailManagementView.as_view(), name='user-detail'),
    path('users/<int:user_id>/update-role/', views_admin.update_user_role, name='update-role'),
    path('users/<int:user_id>/verify/', views_admin.verify_user, name='verify-user'),
    path('users/<int:user_id>/deactivate/', views_admin.deactivate_user, name='deactivate-user'),
    path('users/<int:user_id>/reactivate/', views_admin.reactivate_user, name='reactivate-user'),
    
    # Statistics
    path('user-stats/', views_admin.get_user_stats, name='user-stats'),
]