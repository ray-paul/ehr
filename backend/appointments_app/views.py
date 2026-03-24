# backend/appointments_app/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from django.db.models import Q
from .models import Appointment, AppointmentMessage, AppointmentFeedback
from .serializers import (
    AppointmentSerializer, AppointmentCreateSerializer, 
    AppointmentUpdateSerializer, AppointmentMessageSerializer,
    AppointmentFeedbackSerializer
)
from notifications.models import Notification  # Add this import


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
        
        # Send notification to patient
        Notification.objects.create(
            user=appointment.patient.user,
            title="New Appointment Time Proposed",
            message=f"Dr. {appointment.provider.last_name} has proposed a new time for your appointment: {proposed_date}",
            type="appointment",
            priority="medium",
            related_url=f"/appointments/{appointment.id}"
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
        
        # Send notification to patient
        Notification.objects.create(
            user=appointment.patient.user,
            title="Appointment Confirmed",
            message=f"Your appointment with Dr. {appointment.provider.last_name} has been confirmed for {appointment.confirmed_date}",
            type="appointment",
            priority="medium",
            related_url=f"/appointments/{appointment.id}"
        )
        
        # Send notification to provider
        Notification.objects.create(
            user=appointment.provider,
            title="Appointment Confirmed",
            message=f"Appointment with {appointment.patient.user.get_full_name()} confirmed for {appointment.confirmed_date}",
            type="appointment",
            priority="medium",
            related_url=f"/appointments/{appointment.id}"
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
        
        # Send notification to patient
        Notification.objects.create(
            user=appointment.patient.user,
            title="Appointment Cancelled",
            message=f"Your appointment with Dr. {appointment.provider.last_name} has been cancelled. Reason: {reason}",
            type="appointment",
            priority="high",
            related_url=f"/appointments/{appointment.id}"
        )
        
        # Send notification to provider
        Notification.objects.create(
            user=appointment.provider,
            title="Appointment Cancelled",
            message=f"Appointment with {appointment.patient.user.get_full_name()} has been cancelled. Reason: {reason}",
            type="appointment",
            priority="high",
            related_url=f"/appointments/{appointment.id}"
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
        
        # Send notification to patient
        Notification.objects.create(
            user=appointment.patient.user,
            title="Appointment Completed",
            message=f"Your appointment with Dr. {appointment.provider.last_name} has been marked as completed",
            type="appointment",
            priority="low",
            related_url=f"/appointments/{appointment.id}"
        )
        
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
        
        # Send notification to patient
        Notification.objects.create(
            user=appointment.patient.user,
            title="Appointment Rescheduled",
            message=f"Your appointment with Dr. {appointment.provider.last_name} has been rescheduled to {new_date}",
            type="appointment",
            priority="medium",
            related_url=f"/appointments/{new_appointment.id}"
        )
        
        # Send notification to provider
        Notification.objects.create(
            user=appointment.provider,
            title="Appointment Rescheduled",
            message=f"Appointment with {appointment.patient.user.get_full_name()} has been rescheduled to {new_date}",
            type="appointment",
            priority="medium",
            related_url=f"/appointments/{new_appointment.id}"
        )
        
        serializer = AppointmentSerializer(new_appointment, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        appointment = self.get_object()
        serializer = AppointmentMessageSerializer(data=request.data)
        
        if serializer.is_valid():
            message = serializer.save(
                appointment=appointment,
                sender=request.user
            )
            
            # Send notification to the other party
            if hasattr(request.user, 'patient'):
                # Patient sent message, notify provider
                Notification.objects.create(
                    user=appointment.provider,
                    title="New Message",
                    message=f"You have a new message from {request.user.get_full_name()} regarding your appointment",
                    type="message",
                    priority="medium",
                    related_url=f"/appointments/{appointment.id}"
                )
            else:
                # Provider sent message, notify patient
                Notification.objects.create(
                    user=appointment.patient.user,
                    title="New Message",
                    message=f"You have a new message from Dr. {request.user.last_name} regarding your appointment",
                    type="message",
                    priority="medium",
                    related_url=f"/appointments/{appointment.id}"
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
            
            # Send notification to provider about feedback
            Notification.objects.create(
                user=appointment.provider,
                title="New Feedback Received",
                message=f"Patient {appointment.patient.user.get_full_name()} has submitted feedback for your appointment",
                type="appointment",
                priority="low",
                related_url=f"/appointments/{appointment.id}"
            )
            
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
    
    def get_queryset(self):
        # Get appointment_id from URL kwargs
        appointment_id = self.kwargs.get('appointment_id')
        if appointment_id:
            return AppointmentMessage.objects.filter(
                appointment_id=appointment_id
            ).order_by('created_at')
        return AppointmentMessage.objects.none()
    
    def get_object(self):
        # Override to ensure we're getting the message from the correct appointment
        appointment_id = self.kwargs.get('appointment_id')
        message_id = self.kwargs.get('pk')
        
        if appointment_id and message_id:
            return AppointmentMessage.objects.get(
                id=message_id,
                appointment_id=appointment_id
            )
        return super().get_object()
    
    def perform_create(self, serializer):
        appointment_id = self.kwargs.get('appointment_id')
        appointment = Appointment.objects.get(id=appointment_id)
        
        # Check permission based on user type
        user = self.request.user
        
        # Patient can only message their own appointments
        if hasattr(user, 'patient'):
            if appointment.patient != user.patient:
                raise PermissionDenied("You can only send messages for your own appointments")
        
        # Doctor can only message their own appointments
        elif user.user_type == 'doctor':
            if appointment.provider != user:
                raise PermissionDenied("You can only send messages for your own appointments")
        
        # Staff can message any appointment (nurses, admin, etc.)
        # No additional checks needed
        
        serializer.save(
            appointment=appointment,
            sender=self.request.user
        )
    
    def list(self, request, *args, **kwargs):
        """List all messages for an appointment"""
        appointment_id = self.kwargs.get('appointment_id')
        
        # Check if user has permission to view these messages
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            user = request.user
            
            if hasattr(user, 'patient'):
                if appointment.patient != user.patient:
                    return Response(
                        {'error': 'You can only view messages for your own appointments'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif user.user_type == 'doctor':
                if appointment.provider != user:
                    return Response(
                        {'error': 'You can only view messages for your own appointments'},
                        status=status.HTTP_403_FORBIDDEN
                    )
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Appointment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Create a new message for an appointment"""
        appointment_id = self.kwargs.get('appointment_id')
        
        # Check if appointment exists
        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Appointment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return super().create(request, *args, **kwargs)


class AppointmentFeedbackViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get appointment_id from URL kwargs
        appointment_id = self.kwargs.get('appointment_id')
        if appointment_id:
            return AppointmentFeedback.objects.filter(appointment_id=appointment_id)
        return AppointmentFeedback.objects.none()
    
    def get_object(self):
        # Override to ensure we're getting the feedback from the correct appointment
        appointment_id = self.kwargs.get('appointment_id')
        if appointment_id:
            return AppointmentFeedback.objects.get(appointment_id=appointment_id)
        return super().get_object()
    
    def perform_create(self, serializer):
        appointment_id = self.kwargs.get('appointment_id')
        appointment = Appointment.objects.get(id=appointment_id)
        
        # Only the patient can provide feedback
        user = self.request.user
        if not hasattr(user, 'patient') or appointment.patient != user.patient:
            raise PermissionDenied("Only the patient can provide feedback")
        
        # Check if feedback already exists
        if AppointmentFeedback.objects.filter(appointment=appointment).exists():
            raise PermissionDenied("Feedback already submitted for this appointment")
        
        serializer.save(appointment=appointment)
    
    def list(self, request, *args, **kwargs):
        """List feedback for an appointment"""
        appointment_id = self.kwargs.get('appointment_id')
        
        # Check permission
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            user = request.user
            
            if hasattr(user, 'patient') and appointment.patient != user.patient:
                return Response(
                    {'error': 'You can only view feedback for your own appointments'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Appointment not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return super().list(request, *args, **kwargs)