# backend/patients/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet)
router.register(r'clinical-notes', views.ClinicalNoteViewSet)
router.register(r'allergies', views.AllergyViewSet)
router.register(r'chronic-conditions', views.ChronicConditionViewSet)
router.register(r'medications', views.MedicationViewSet)
router.register(r'insurance', views.InsuranceViewSet)
router.register(r'primary-physicians', views.PrimaryCarePhysicianViewSet)

urlpatterns = [
    path('', include(router.urls)),
]