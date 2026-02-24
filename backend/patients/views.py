# backend/patients/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Patient, ClinicalNote, Allergy, Medication, Appointment
from .serializers import (
    PatientSerializer, PatientCreateSerializer, ClinicalNoteSerializer,
    AllergySerializer, MedicationSerializer, AppointmentSerializer
)
import logging
import traceback

logger = logging.getLogger(__name__)

class IsProviderOrAdmin(permissions.BasePermission):
    """Custom permission to allow providers and admins to edit"""
    def has_permission(self, request, view):
        print(f"🔐 IsProviderOrAdmin.has_permission - User: {request.user}, Auth: {request.user.is_authenticated}")
        
        if not request.user.is_authenticated:
            print("❌ User not authenticated")
            return False
            
        # Allow all authenticated users to view
        if request.method in permissions.SAFE_METHODS:
            print(f"✅ Safe method ({request.method}) - allowing")
            return True
        
        # For write operations, check user type
        allowed = request.user.user_type in ['doctor', 'admin', 'master_admin']
        print(f"✏️ Write method ({request.method}) - allowed: {allowed}, user_type: {request.user.user_type}")
        return allowed

class PatientViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone']
    ordering_fields = ['user__first_name', 'user__last_name', 'created_at']
    
    queryset = Patient.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        print(f"📋 PatientViewSet.get_queryset - User: {user.username}, Type: {user.user_type}, Active: {user.is_active}")
        
        # Master admin, admin, and doctors can see all patients
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            print("✅ Master admin/admin/doctor - full access")
            return Patient.objects.all()
        elif user.user_type in ['nurse', 'pharmacist', 'radiologist', 'labscientist']:
            print("✅ Staff user - full access")
            return Patient.objects.all()
        elif hasattr(user, 'patient'):
            print("👤 Patient user - own records only")
            return Patient.objects.filter(user=user)
        
        print("❌ No access - returning empty queryset")
        return Patient.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            print("📝 Using PatientCreateSerializer for create action")
            return PatientCreateSerializer
        print("📄 Using PatientSerializer for non-create action")
        return PatientSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"🔨 PatientViewSet.create - User: {request.user.username}")
        print(f"Request data: {request.data}")
        print(f"Auth header: {request.headers.get('Authorization', 'No token')}")
        print(f"User type: {request.user.user_type}")
        print(f"Is active: {request.user.is_active}")
        print(f"Is verified: {request.user.is_verified}")
        
        try:
            # Check if user has permission to create
            if request.user.user_type not in ['doctor', 'admin', 'master_admin']:
                print(f"❌ User type {request.user.user_type} not allowed to create patients")
                return Response(
                    {'detail': 'You do not have permission to create patients.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            print(f"✅ Serializer validation passed: {serializer.validated_data}")
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            print(f"✅ Patient created successfully: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print(f"❌ Error in create: {str(e)}")
            traceback.print_exc()
            raise
    
    def perform_create(self, serializer):
        print(f"💾 PatientViewSet.perform_create - Saving patient")
        serializer.save()
        print("✅ Patient saved successfully")
    
    @action(detail=True, methods=['get'])
    def clinical_notes(self, request, pk=None):
        patient = self.get_object()
        notes = patient.clinicalnote_set.all()
        serializer = ClinicalNoteSerializer(notes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def allergies(self, request, pk=None):
        patient = self.get_object()
        allergies = patient.allergy_set.all()
        serializer = AllergySerializer(allergies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def medications(self, request, pk=None):
        patient = self.get_object()
        medications = patient.medication_set.filter(active=True)
        serializer = MedicationSerializer(medications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def appointments(self, request, pk=None):
        patient = self.get_object()
        appointments = patient.appointments.all()
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

class ClinicalNoteViewSet(viewsets.ModelViewSet):
    serializer_class = ClinicalNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = ClinicalNote.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
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
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            return Allergy.objects.all()
        elif hasattr(user, 'patient'):
            return Allergy.objects.filter(patient=user.patient)
        
        return Allergy.objects.none()

class MedicationViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Medication.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
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
        
        medication.active = False
        medication.save()
        return Response({'status': 'medication dispensed'})

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'notes', 'patient__user__first_name', 'patient__user__last_name']
    ordering_fields = ['scheduled', 'created_at']
    queryset = Appointment.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin']:
            return Appointment.objects.all()
        elif user.user_type == 'doctor':
            return Appointment.objects.filter(
                Q(created_by=user) | Q(patient__appointments__isnull=False)
            ).distinct()
        elif hasattr(user, 'patient'):
            return Appointment.objects.filter(patient=user.patient)
        
        return Appointment.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        from django.utils import timezone
        queryset = self.get_queryset().filter(
            scheduled__gte=timezone.now()
        ).order_by('scheduled')[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        from django.utils import timezone
        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            scheduled__date=today
        ).order_by('scheduled')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)