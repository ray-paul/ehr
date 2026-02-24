# backend/patients/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet)
router.register(r'clinical-notes', views.ClinicalNoteViewSet)
router.register(r'allergies', views.AllergyViewSet)
router.register(r'medications', views.MedicationViewSet)
router.register(r'appointments', views.AppointmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]