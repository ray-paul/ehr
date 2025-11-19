from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, SAFE_METHODS
from rest_framework.response import Response
from .models import Report
from .serializers import ReportSerializer
from .models import ReportAttachment
from .serializers import ReportAttachmentSerializer
from patients.permissions import IsOwnerOrProviderOrReadOnly, IsDoctorOrNurse


class ReportViewSet(viewsets.ModelViewSet):
    """CRUD for reports.

    - Safe methods: providers can read any; others can read (object-level) their own.
    - Unsafe methods (create/update/delete): only providers (doctors/nurses) may perform these.
    """
    serializer_class = ReportSerializer

    def get_queryset(self):
        qs = Report.objects.all().order_by('-created_at')
        patient_id = self.request.query_params.get('patient')
        user = getattr(self.request, 'user', None)
        # Providers can optionally filter by patient or view all
        if getattr(user, 'user_type', None) in ('doctor', 'nurse'):
            if patient_id:
                return qs.filter(patient_id=patient_id)
            return qs
        # Non-providers (patients) only see reports for their patient record
        if user and user.is_authenticated:
            return qs.filter(patient__user=user)
        return qs.none()

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsOwnerOrProviderOrReadOnly()]
        return [IsDoctorOrNurse()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ReportAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = ReportAttachmentSerializer

    def get_queryset(self):
        qs = ReportAttachment.objects.all().order_by('-uploaded_at')
        report_id = self.request.query_params.get('report')
        if report_id:
            return qs.filter(report_id=report_id)
        return qs

    def get_permissions(self):
        from rest_framework.permissions import SAFE_METHODS
        if self.request.method in SAFE_METHODS:
            return [IsOwnerOrProviderOrReadOnly()]
        return [IsDoctorOrNurse()]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

