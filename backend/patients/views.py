# backend/patients/views.py
from rest_framework import viewsets, permissions, generics
from .models import Patient, ClinicalNote
from .serializers import PatientSerializer, ClinicalNoteSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # For now, all authenticated users can see all patients
        # We'll add role-based filtering later
        return Patient.objects.all()

class ClinicalNoteViewSet(viewsets.ModelViewSet):
    queryset = ClinicalNote.objects.all()
    serializer_class = ClinicalNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ClinicalNote.objects.all()

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)

class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
