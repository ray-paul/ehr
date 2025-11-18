from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, SAFE_METHODS
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer
from patients.permissions import IsOwnerOrProviderOrReadOnly, IsDoctorOrNurse


class ReportViewSet(viewsets.ModelViewSet):
    """CRUD for reports.

    - Safe methods: providers can read any; others can read (object-level) their own.
    - Unsafe methods (create/update/delete): only providers (doctors/nurses) may perform these.
    """
    queryset = Report.objects.all().order_by('-created_at')
    serializer_class = ReportSerializer

    def get_permissions(self):
        # For safe methods, allow read-only behavior with object-level checks
        if self.request.method in SAFE_METHODS:
            return [IsOwnerOrProviderOrReadOnly()]
        # For unsafe methods, require provider role
        return [IsDoctorOrNurse()]

    def perform_create(self, serializer):
        # Set the creator automatically
        serializer.save(created_by=self.request.user)

