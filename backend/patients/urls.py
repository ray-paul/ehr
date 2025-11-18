# backend/patients/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet)
router.register(r'clinical-notes', views.ClinicalNoteViewSet)

urlpatterns = [
    path('', include(router.urls)),
     path('patients/<int:pk>/', views.PatientDetailView.as_view(), name='patient-detail'),
]