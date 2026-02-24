# backend/labresults/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import LabTestType, LabOrder, LabResult, LabAttachment
from .serializers import (
    LabTestTypeSerializer, LabOrderSerializer, LabOrderCreateSerializer,
    LabResultSerializer, LabResultCreateSerializer, LabAttachmentSerializer
)

class LabTestTypeViewSet(viewsets.ModelViewSet):
    queryset = LabTestType.objects.filter(is_active=True)
    serializer_class = LabTestTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'category', 'description']

class LabOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['patient__user__first_name', 'patient__user__last_name', 'test_type__name']
    ordering_fields = ['order_date', 'status', 'priority']
    
    # ADD THIS LINE - queryset attribute
    queryset = LabOrder.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin']:
            return LabOrder.objects.all()
        elif user.user_type == 'doctor':
            return LabOrder.objects.filter(ordered_by=user)
        elif user.user_type == 'labscientist':
            return LabOrder.objects.all()  # Lab scientists can see all
        elif hasattr(user, 'patient'):
            return LabOrder.objects.filter(patient=user.patient)
        
        return LabOrder.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return LabOrderCreateSerializer
        return LabOrderSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def add_results(self, request, pk=None):
        lab_order = self.get_object()
        
        # Check permission
        if request.user.user_type not in ['labscientist', 'doctor', 'admin', 'master_admin']:
            return Response(
                {'error': 'Only lab scientists and doctors can add results'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = LabResultCreateSerializer(data=request.data, many=True)
        if serializer.is_valid():
            for result_data in serializer.validated_data:
                LabResult.objects.create(lab_order=lab_order, **result_data)
            
            lab_order.status = 'completed'
            lab_order.save()
            
            return Response({'status': 'results added'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        lab_order = self.get_object()
        new_status = request.data.get('status')
        collection_date = request.data.get('collection_date')
        
        if new_status not in ['collected', 'processing', 'completed', 'cancelled']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        lab_order.status = new_status
        if new_status == 'collected' and collection_date:
            lab_order.collection_date = collection_date
            lab_order.collected_by = request.user
        
        lab_order.save()
        
        serializer = self.get_serializer(lab_order)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending lab orders"""
        queryset = self.get_queryset().filter(status='ordered')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def for_patient(self, request):
        """Get lab orders for a specific patient"""
        patient_id = request.query_params.get('patient_id')
        if not patient_id:
            return Response({'error': 'patient_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset().filter(patient_id=patient_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class LabAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = LabAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = LabAttachment.objects.all()  # ADD THIS LINE
    
    def get_queryset(self):
        return LabAttachment.objects.filter(lab_order_id=self.kwargs['lab_order_id'])
    
    def perform_create(self, serializer):
        lab_order = LabOrder.objects.get(id=self.kwargs['lab_order_id'])
        serializer.save(
            lab_order=lab_order,
            uploaded_by=self.request.user
        )