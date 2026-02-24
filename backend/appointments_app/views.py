# backend/appointments_app/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Appointment, AppointmentMessage, AppointmentHistory
from .serializers import (
    AppointmentSerializer, AppointmentCreateSerializer, 
    AppointmentUpdateSerializer, AppointmentMessageSerializer
)

class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Base queryset
        queryset = Appointment.objects.all()
        
        # Filter by user role
        if hasattr(user, 'patient'):
            # Patient: see their own appointments
            queryset = queryset.filter(patient=user.patient)
        else:
            # Staff: see appointments where they are provider or created by them
            queryset = queryset.filter(
                Q(provider=user) | Q(created_by=user)
            )
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(patient_suggested_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(patient_suggested_date__lte=end_date)
        
        return queryset.select_related('patient', 'patient__user', 'provider')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentUpdateSerializer
        return AppointmentSerializer
    
    def perform_create(self, serializer):
        appointment = serializer.save(created_by=self.request.user)
        # Create history entry
        AppointmentHistory.objects.create(
            appointment=appointment,
            user=self.request.user,
            action='created',
            new_value=f"Appointment created with status {appointment.status}"
        )
    
    @action(detail=True, methods=['post'])
    def propose_time(self, request, pk=None):
        appointment = self.get_object()
        proposed_date = request.data.get('proposed_date')
        message = request.data.get('message', '')
        
        if not proposed_date:
            return Response(
                {'error': 'Proposed date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store old status for history
        old_status = appointment.status
        
        # Update appointment
        appointment.provider_proposed_date = proposed_date
        appointment.status = 'proposed'
        appointment.save()
        
        # Add message if provided
        if message:
            AppointmentMessage.objects.create(
                appointment=appointment,
                sender=request.user,
                message=message
            )
        
        # Create history entry
        AppointmentHistory.objects.create(
            appointment=appointment,
            user=request.user,
            action='status_changed',
            old_value=old_status,
            new_value='proposed'
        )
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        confirmed_date = request.data.get('confirmed_date')
        
        old_status = appointment.status
        
        appointment.confirmed_date = confirmed_date or appointment.provider_proposed_date or appointment.patient_suggested_date
        appointment.status = 'confirmed'
        appointment.save()
        
        # Create history entry
        AppointmentHistory.objects.create(
            appointment=appointment,
            user=request.user,
            action='status_changed',
            old_value=old_status,
            new_value='confirmed'
        )
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        reason = request.data.get('reason', '')
        
        old_status = appointment.status
        
        appointment.status = 'cancelled'
        appointment.cancellation_reason = reason
        appointment.cancelled_by = request.user
        appointment.save()
        
        # Add cancellation message
        AppointmentMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            message=f"Appointment cancelled. Reason: {reason}"
        )
        
        # Create history entry
        AppointmentHistory.objects.create(
            appointment=appointment,
            user=request.user,
            action='cancelled',
            old_value=old_status,
            new_value='cancelled'
        )
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        
        old_status = appointment.status
        appointment.status = 'completed'
        appointment.save()
        
        # Create history entry
        AppointmentHistory.objects.create(
            appointment=appointment,
            user=request.user,
            action='completed',
            old_value=old_status,
            new_value='completed'
        )
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        appointment = self.get_object()
        serializer = AppointmentMessageSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(appointment=appointment, sender=request.user)
            
            # Refresh appointment to include new message
            appointment_serializer = self.get_serializer(appointment)
            return Response(appointment_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming appointments"""
        user = request.user
        queryset = self.get_queryset().filter(
            status__in=['confirmed', 'proposed'],
            patient_suggested_date__gte=timezone.now()
        )[:10]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get appointment history"""
        user = request.user
        queryset = self.get_queryset().filter(
            status__in=['completed', 'cancelled', 'no_show']
        )[:20]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class AppointmentMessageViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AppointmentMessage.objects.filter(
            appointment_id=self.kwargs['appointment_id']
        ).select_related('sender')
    
    def perform_create(self, serializer):
        appointment = Appointment.objects.get(id=self.kwargs['appointment_id'])
        serializer.save(appointment=appointment, sender=self.request.user)