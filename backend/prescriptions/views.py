# backend/prescriptions/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Medication, Prescription, PrescriptionDispense, PrescriptionRenewal
from .serializers import (
    MedicationSerializer, PrescriptionSerializer, PrescriptionCreateSerializer,
    PrescriptionDispenseSerializer, PrescriptionRenewalSerializer
)

class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all()
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'generic_name', 'manufacturer']

class PrescriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['medication__name', 'medication_name', 'patient__user__first_name', 'patient__user__last_name']
    ordering_fields = ['prescribed_date', 'created_at', 'status']
    
    # ADD THIS LINE - queryset attribute
    queryset = Prescription.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin']:
            return Prescription.objects.all()
        elif user.user_type == 'doctor':
            return Prescription.objects.filter(
                Q(prescribed_by=user) | Q(created_by=user)
            ).distinct()
        elif user.user_type == 'pharmacist':
            return Prescription.objects.filter(status='active')
        elif hasattr(user, 'patient'):
            return Prescription.objects.filter(patient=user.patient)
        
        return Prescription.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def dispense(self, request, pk=None):
        prescription = self.get_object()
        
        # Check permission
        if request.user.user_type != 'pharmacist':
            return Response(
                {'error': 'Only pharmacists can dispense medications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        quantity = request.data.get('quantity', prescription.quantity)
        notes = request.data.get('notes', '')
        
        dispense = PrescriptionDispense.objects.create(
            prescription=prescription,
            dispensed_by=request.user,
            quantity=quantity,
            notes=notes
        )
        
        # Update prescription status
        total_dispensed = sum(d.quantity for d in prescription.dispenses.all())
        if total_dispensed >= prescription.quantity:
            prescription.status = 'dispensed'
            prescription.dispensed_date = timezone.now()
        else:
            prescription.status = 'partial'
        prescription.save()
        
        serializer = PrescriptionDispenseSerializer(dispense)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def request_renewal(self, request, pk=None):
        prescription = self.get_object()
        
        renewal = PrescriptionRenewal.objects.create(
            prescription=prescription,
            requested_by=request.user,
            status='pending'
        )
        
        serializer = PrescriptionRenewalSerializer(renewal)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def approve_renewal(self, request, pk=None):
        renewal_id = request.data.get('renewal_id')
        try:
            renewal = PrescriptionRenewal.objects.get(id=renewal_id, prescription_id=pk)
            renewal.status = 'approved'
            renewal.approved_by = request.user
            renewal.approved_date = timezone.now()
            renewal.save()
            
            # Create new prescription or extend current one
            # For simplicity, we'll just update the end date
            prescription = renewal.prescription
            prescription.end_date = timezone.now().date() + timezone.timedelta(days=30)
            prescription.save()
            
            serializer = PrescriptionRenewalSerializer(renewal)
            return Response(serializer.data)
        except PrescriptionRenewal.DoesNotExist:
            return Response({'error': 'Renewal not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active prescriptions"""
        queryset = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def for_patient(self, request):
        """Get prescriptions for a specific patient"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(patient_id=patient_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)