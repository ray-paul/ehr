# backend/appointments_app/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AppointmentRequest, AppointmentMessage
from .serializers import AppointmentSerializer, AppointmentCreateSerializer, AppointmentMessageSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AppointmentSerializer  # Add this line
    queryset = AppointmentRequest.objects.all()  # ADD THIS LINE - FIXES THE ERROR
    
    def get_queryset(self):
        user = self.request.user
        # Patients see their appointments, providers see appointments assigned to them
        if hasattr(user, 'patient'):
            return AppointmentRequest.objects.filter(patient=user.patient)
        return AppointmentRequest.objects.filter(provider=user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def perform_create(self, serializer):
        # Auto-assign patient if user is a patient
        if hasattr(self.request.user, 'patient'):
            serializer.save(patient=self.request.user.patient)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def propose_time(self, request, pk=None):
        appointment = self.get_object()
        proposed_date = request.data.get('proposed_date')
        
        if not proposed_date:
            return Response({'error': 'Proposed date is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        appointment.provider_proposed_date = proposed_date
        appointment.status = 'proposed'
        appointment.save()
        
        # Create message
        AppointmentMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            message=f"Provider proposed new time: {proposed_date}"
        )
        
        return Response(AppointmentSerializer(appointment).data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        confirmed_date = request.data.get('confirmed_date')
        
        appointment.confirmed_date = confirmed_date or appointment.provider_proposed_date
        appointment.status = 'confirmed'
        appointment.save()
        
        AppointmentMessage.objects.create(
            appointment=appointment,
            sender=request.user,
            message=f"Appointment confirmed for: {appointment.confirmed_date}"
        )
        
        return Response(AppointmentSerializer(appointment).data)
    
    @action(detail=True, methods=['post'])
    def add_message(self, request, pk=None):
        appointment = self.get_object()
        serializer = AppointmentMessageSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(appointment=appointment, sender=request.user)
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AppointmentMessageViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = AppointmentMessage.objects.all()  # ADD THIS LINE
    
    def get_queryset(self):
        return AppointmentMessage.objects.filter(appointment__id=self.kwargs['appointment_id'])
    
    def perform_create(self, serializer):
        appointment = AppointmentRequest.objects.get(id=self.kwargs['appointment_id'])
        serializer.save(appointment=appointment, sender=self.request.user)