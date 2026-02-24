# backend/patients/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import (
    Patient, ClinicalNote, Allergy, ChronicCondition, 
    Medication, Insurance, PrimaryCarePhysician
)
from .serializers import (
    PatientSerializer, PatientCreateSerializer, ClinicalNoteSerializer,
    AllergySerializer, ChronicConditionSerializer, MedicationSerializer,
    InsuranceSerializer, PrimaryCarePhysicianSerializer
)

class IsProviderOrAdmin(permissions.BasePermission):
    """Custom permission to allow providers and admins to edit"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.user_type in ['doctor', 'admin', 'master_admin']

class PatientViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone']
    ordering_fields = ['user__first_name', 'user__last_name', 'created_at']
    
    queryset = Patient.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            return Patient.objects.all()
        elif user.user_type in ['nurse', 'pharmacist', 'radiologist', 'labscientist']:
            return Patient.objects.all()
        elif hasattr(user, 'patient'):
            return Patient.objects.filter(user=user)
        
        return Patient.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PatientCreateSerializer
        return PatientSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['get'])
    def clinical_notes(self, request, pk=None):
        patient = self.get_object()
        notes = patient.clinicalnote_set.all()
        serializer = ClinicalNoteSerializer(notes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def allergies(self, request, pk=None):
        patient = self.get_object()
        allergies = patient.allergies.all()
        serializer = AllergySerializer(allergies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def chronic_conditions(self, request, pk=None):
        patient = self.get_object()
        conditions = patient.chronic_conditions.all()
        serializer = ChronicConditionSerializer(conditions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def medications(self, request, pk=None):
        patient = self.get_object()
        medications = patient.medications.filter(is_active=True)
        serializer = MedicationSerializer(medications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def insurance(self, request, pk=None):
        patient = self.get_object()
        if hasattr(patient, 'insurance'):
            serializer = InsuranceSerializer(patient.insurance)
            return Response(serializer.data)
        return Response({'detail': 'No insurance information found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def primary_physician(self, request, pk=None):
        patient = self.get_object()
        if hasattr(patient, 'primary_care_physician'):
            serializer = PrimaryCarePhysicianSerializer(patient.primary_care_physician)
            return Response(serializer.data)
        return Response({'detail': 'No primary care physician found'}, status=status.HTTP_404_NOT_FOUND)


class ClinicalNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ClinicalNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ClinicalNote.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            if patient_id:
                return ClinicalNote.objects.filter(patient_id=patient_id)
            return ClinicalNote.objects.all()
        elif hasattr(user, 'patient'):
            return ClinicalNote.objects.filter(patient=user.patient)
        
        return ClinicalNote.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)


class AllergyViewSet(viewsets.ModelViewSet):
    serializer_class = AllergySerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Allergy.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            if patient_id:
                return Allergy.objects.filter(patient_id=patient_id)
            return Allergy.objects.all()
        elif hasattr(user, 'patient'):
            return Allergy.objects.filter(patient=user.patient)
        
        return Allergy.objects.none()


class ChronicConditionViewSet(viewsets.ModelViewSet):
    serializer_class = ChronicConditionSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ChronicCondition.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            if patient_id:
                return ChronicCondition.objects.filter(patient_id=patient_id)
            return ChronicCondition.objects.all()
        elif hasattr(user, 'patient'):
            return ChronicCondition.objects.filter(patient=user.patient)
        
        return ChronicCondition.objects.none()


class MedicationViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Medication.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            if patient_id:
                return Medication.objects.filter(patient_id=patient_id)
            return Medication.objects.all()
        elif user.user_type == 'pharmacist':
            return Medication.objects.all()
        elif hasattr(user, 'patient'):
            return Medication.objects.filter(patient=user.patient)
        
        return Medication.objects.none()
    
    @action(detail=True, methods=['post'])
    def dispense(self, request, pk=None):
        medication = self.get_object()
        if request.user.user_type != 'pharmacist':
            return Response(
                {'error': 'Only pharmacists can dispense medications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        medication.is_active = False
        medication.save()
        return Response({'status': 'medication dispensed'})


class InsuranceViewSet(viewsets.ModelViewSet):
    serializer_class = InsuranceSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Insurance.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            return Insurance.objects.all()
        elif hasattr(user, 'patient'):
            return Insurance.objects.filter(patient=user.patient)
        
        return Insurance.objects.none()


class PrimaryCarePhysicianViewSet(viewsets.ModelViewSet):
    serializer_class = PrimaryCarePhysicianSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = PrimaryCarePhysician.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            return PrimaryCarePhysician.objects.all()
        elif hasattr(user, 'patient'):
            return PrimaryCarePhysician.objects.filter(patient=user.patient)
        
        return PrimaryCarePhysician.objects.none()