# backend/appointments_app/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Appointment, AppointmentMessage, AppointmentFeedback
from .serializers import (
    AppointmentSerializer, AppointmentCreateSerializer, 
    AppointmentUpdateSerializer, AppointmentMessageSerializer,
    AppointmentFeedbackSerializer
)

class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'reason', 'patient__user__first_name', 'patient__user__last_name']
    ordering_fields = ['patient_suggested_date', 'created_at', 'status']
    queryset = Appointment.objects.all()
    
    def get_queryset(self):
        user = self.request.user
        queryset = Appointment.objects.all()
        
        # Role-based filtering
        if hasattr(user, 'patient'):
            # Patient: only their appointments
            queryset = queryset.filter(patient=user.patient)
        elif user.user_type == 'doctor':
            # Doctor: appointments where they are provider
            queryset = queryset.filter(provider=user)
        elif user.user_type in ['admin', 'master_admin']:
            # Admins: all appointments
            pass
        else:
            # Other staff: appointments they're involved with
            queryset = queryset.filter(
                Q(provider=user) | 
                Q(created_by=user) |
                Q(messages__sender=user)
            ).distinct()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            queryset = queryset.filter(
                Q(patient_suggested_date__date__range=[start_date, end_date]) |
                Q(provider_proposed_date__date__range=[start_date, end_date]) |
                Q(confirmed_date__date__range=[start_date, end_date])
            )
        
        return queryset.select_related('patient', 'patient__user', 'provider')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentUpdateSerializer
        return AppointmentSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        # Auto-assign patient if user is a patient
        if hasattr(self.request.user, 'patient'):
            serializer.save(
                patient=self.request.user.patient,
                created_by=self.request.user
            )
        else:
            serializer.save(created_by=self.request.user)
    
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
        
        # Check permission
        if request.user != appointment.provider:
            return Response(
                {'error': 'Only the provider can propose a new time'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        appointment.provider_proposed_date = proposed_date
        appointment.status = 'proposed'
        appointment.save()
        
        # Create message
        AppointmentMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            message=message or f"Provider proposed new time: {proposed_date}"
        )
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        confirmed_date = request.data.get('confirmed_date')
        message = request.data.get('message', '')
        
        # Check permission
        if hasattr(request.user, 'patient'):
            if appointment.patient != request.user.patient:
                return Response(
                    {'error': 'You can only confirm your own appointments'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        if confirmed_date:
            appointment.confirmed_date = confirmed_date
        elif appointment.provider_proposed_date:
            appointment.confirmed_date = appointment.provider_proposed_date
        else:
            appointment.confirmed_date = appointment.patient_suggested_date
        
        appointment.status = 'confirmed'
        appointment.save()
        
        AppointmentMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            message=message or f"Appointment confirmed for {appointment.confirmed_date}"
        )
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        # Check permission
        if hasattr(request.user, 'patient'):
            if appointment.patient != request.user.patient:
                return Response(
                    {'error': 'You can only cancel your own appointments'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        appointment.status = 'cancelled'
        appointment.cancellation_reason = reason
        appointment.save()
        
        AppointmentMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            message=f"Appointment cancelled. Reason: {reason}"
        )
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        
        if request.user != appointment.provider:
            return Response(
                {'error': 'Only the provider can mark appointments as complete'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        appointment.status = 'completed'
        appointment.actual_end_time = timezone.now()
        appointment.save()
        
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        appointment = self.get_object()
        new_date = request.data.get('new_date')
        reason = request.data.get('reason', '')
        
        if not new_date:
            return Response(
                {'error': 'New date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check permission
        if hasattr(request.user, 'patient'):
            if appointment.patient != request.user.patient:
                return Response(
                    {'error': 'You can only reschedule your own appointments'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        new_appointment = appointment.reschedule(new_date, request.user)
        
        AppointmentMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            message=f"Appointment rescheduled to {new_date}. Reason: {reason}"
        )
        
        serializer = AppointmentSerializer(new_appointment, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        appointment = self.get_object()
        serializer = AppointmentMessageSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(
                appointment=appointment,
                sender=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        appointment = self.get_object()
        messages = appointment.messages.all()
        
        # Mark messages as read
        if hasattr(request.user, 'patient'):
            unread = messages.filter(is_read=False).exclude(sender=request.user)
        else:
            unread = messages.filter(is_read=False)
        
        for msg in unread:
            msg.mark_as_read()
        
        serializer = AppointmentMessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        appointment = self.get_object()
        
        # Check if user is the patient
        if not hasattr(request.user, 'patient') or appointment.patient != request.user.patient:
            return Response(
                {'error': 'Only the patient can provide feedback'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if feedback already exists
        if hasattr(appointment, 'feedback'):
            return Response(
                {'error': 'Feedback already submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = AppointmentFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(appointment=appointment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming appointments"""
        queryset = self.get_queryset()
        upcoming = queryset.filter(
            status__in=['confirmed'],
            confirmed_date__gte=timezone.now()
        ).order_by('confirmed_date')[:10]
        
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's appointments"""
        queryset = self.get_queryset()
        today = timezone.now().date()
        today_appts = queryset.filter(
            Q(confirmed_date__date=today) |
            Q(patient_suggested_date__date=today) |
            Q(provider_proposed_date__date=today)
        ).filter(status__in=['confirmed', 'requested', 'proposed'])
        
        serializer = self.get_serializer(today_appts, many=True)
        return Response(serializer.data)


class AppointmentMessageViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = AppointmentMessage.objects.all()
    
    def get_queryset(self):
        return AppointmentMessage.objects.filter(
            appointment_id=self.kwargs['appointment_id']
        ).order_by('created_at')
    
    def perform_create(self, serializer):
        appointment = Appointment.objects.get(id=self.kwargs['appointment_id'])
        serializer.save(
            appointment=appointment,
            sender=self.request.user
        )