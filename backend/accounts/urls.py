# backend/accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.LoginAPI.as_view()),
    path('register/', views.RegisterAPI.as_view()),
    path('user/', views.UserAPI.as_view()),
]