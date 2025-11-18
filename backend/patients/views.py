# backend/patients/views.py
from rest_framework import viewsets, permissions, generics
from rest_framework.exceptions import PermissionDenied
from .models import Patient, ClinicalNote
from .serializers import PatientSerializer, ClinicalNoteSerializer
from .permissions import IsDoctorOrNurse, IsOwnerOrProviderOrReadOnly

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrProviderOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'user_type', None)
        if role in ('doctor', 'nurse'):
            return Patient.objects.all()
        if role == 'patient':
            # Patient can only see their own record
            return Patient.objects.filter(user=user)
        # Default: no records
        return Patient.objects.none()

    def perform_create(self, serializer):
        # Only providers can create patient records
        if getattr(self.request.user, 'user_type', None) not in ('doctor', 'nurse'):
            raise PermissionDenied('Only providers can create patients')
        serializer.save()

class ClinicalNoteViewSet(viewsets.ModelViewSet):
    queryset = ClinicalNote.objects.all()
    serializer_class = ClinicalNoteSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrProviderOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, 'user_type', None)
        if role in ('doctor', 'nurse'):
            return ClinicalNote.objects.all()
        if role == 'patient':
            # Patients can only see clinical notes for themselves
            return ClinicalNote.objects.filter(patient__user=user)
        return ClinicalNote.objects.none()

    def perform_create(self, serializer):
        # Only providers may create notes
        if getattr(self.request.user, 'user_type', None) not in ('doctor', 'nurse'):
            raise PermissionDenied('Only providers may create clinical notes')
        serializer.save(provider=self.request.user)

class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
