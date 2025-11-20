from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('login/', views.LoginAPI.as_view(), name='login'),
    path('register/staff/', views.StaffRegisterAPI.as_view(), name='register-staff'),
    path('register/patient/', views.PatientRegisterAPI.as_view(), name='register-patient'),
    
    # User management endpoints
    path('user/', views.UserAPI.as_view(), name='user'),
    path('user/<int:pk>/', views.UserDetailAPI.as_view(), name='user-detail'),
    
    # Admin endpoints
    path('verify-staff/<int:user_id>/', views.verify_staff, name='verify-staff'),
]     