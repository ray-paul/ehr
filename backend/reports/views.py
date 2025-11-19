# backend/reports/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS, BasePermission
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Count, Avg, Q
from datetime import datetime, timedelta
import csv
import json

from .models import Report, ReportAttachment
from .serializers import ReportSerializer, ReportAttachmentSerializer
from patients.permissions import IsOwnerOrProviderOrReadOnly, IsDoctorOrNurse


class IsResearcherOrAdmin(BasePermission):
    """Custom permission for researchers and admins only."""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            getattr(request.user, 'user_type', None) in ['researcher', 'admin']
        )


class IsPatientOwner(BasePermission):
    """Permission to ensure patients can only access their own data."""
    
    def has_object_permission(self, request, view, obj):
        # For Report objects
        if hasattr(obj, 'patient'):
            return obj.patient.user == request.user
        # For ReportAttachment objects (via report)
        elif hasattr(obj, 'report'):
            return obj.report.patient.user == request.user
        return False


class ReportViewSet(viewsets.ModelViewSet):
    """CRUD for reports with analytics and research endpoints.

    - Patients can ONLY view their own reports
    - Providers can view all reports
    - Unsafe methods (create/update/delete): only providers (doctors/nurses) may perform these.
    - Analytics endpoints: researchers and admins only.
    """
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Report.objects.all().select_related('patient', 'created_by').prefetch_related('attachments').order_by('-created_at')
        patient_id = self.request.query_params.get('patient')
        user = self.request.user
        
        if not user.is_authenticated:
            return qs.none()
        
        # Providers (doctors, nurses, admins) can view all reports or filter by patient
        if getattr(user, 'user_type', None) in ('doctor', 'nurse', 'admin'):
            if patient_id:
                return qs.filter(patient_id=patient_id)
            return qs
        
        # Patients can ONLY view their own reports
        elif getattr(user, 'user_type', None) == 'patient':
            # Patients cannot filter by other patients - they only see their own
            return qs.filter(patient__user=user)
        
        # Other user types get nothing
        return qs.none()

    def get_permissions(self):
        # For analytics endpoints - researchers and admins only
        if self.action in ['anonymized', 'export_anonymized', 'statistics']:
            return [IsResearcherOrAdmin()]
        
        # For object-level permissions on safe methods
        if self.request.method in SAFE_METHODS:
            if getattr(self.request.user, 'user_type', None) == 'patient':
                return [IsAuthenticated(), IsPatientOwner()]
            else:
                return [IsAuthenticated()]
        
        # For unsafe methods - only providers
        return [IsDoctorOrNurse()]

    def get_object(self):
        """Override to ensure patients can only access their own reports."""
        obj = super().get_object()
        
        # Additional security check for patients
        user = self.request.user
        if getattr(user, 'user_type', None) == 'patient':
            if obj.patient.user != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have permission to access this report.")
        
        return obj

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def anonymized(self, request):
        """Get anonymized report data for research purposes."""
        # Only researchers and admins can access this
        if not IsResearcherOrAdmin().has_permission(request, self):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        reports = Report.objects.all().select_related('patient')
        
        anonymized_data = []
        for report in reports:
            # Anonymize patient data while maintaining consistency
            patient_hash = self._hash_patient_id(report.patient_id)
            age = self._calculate_age(report.patient.date_of_birth) if report.patient.date_of_birth else None
            
            anonymized_data.append({
                'report_id': report.id,
                'patient_hash': f"PAT_{patient_hash:04d}",
                'age_group': self._get_age_group(age),
                'gender': report.patient.gender if report.patient.gender else 'Unknown',
                'report_type': report.title,
                'attachment_count': report.attachments.count(),
                'created_year': report.created_at.year,
                'created_month': report.created_at.month,
                'content_length': len(report.content) if report.content else 0,
                'has_attachments': report.attachments.exists(),
                'attachment_types': list(report.attachments.values_list('attachment_type', flat=True).distinct()),
            })
        
        return Response(anonymized_data)

    @action(detail=False, methods=['get'])
    def export_anonymized(self, request):
        """Export anonymized report data as CSV for research."""
        # Only researchers and admins can access this
        if not IsResearcherOrAdmin().has_permission(request, self):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        reports = Report.objects.all().select_related('patient')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="anonymized_reports_{datetime.now().date()}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Report ID', 'Patient Hash', 'Age Group', 'Gender', 'Report Type',
            'Attachment Count', 'Created Year', 'Created Month', 'Content Length',
            'Has Attachments', 'Attachment Types'
        ])
        
        for report in reports:
            patient_hash = self._hash_patient_id(report.patient_id)
            age = self._calculate_age(report.patient.date_of_birth) if report.patient.date_of_birth else None
            attachment_types = ', '.join(report.attachments.values_list('attachment_type', flat=True).distinct())
            
            writer.writerow([
                report.id,
                f"PAT_{patient_hash:04d}",
                self._get_age_group(age),
                report.patient.gender or 'Unknown',
                report.title,
                report.attachments.count(),
                report.created_at.year,
                report.created_at.month,
                len(report.content) if report.content else 0,
                'Yes' if report.attachments.exists() else 'No',
                attachment_types
            ])
        
        return response

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get report statistics for dashboard and analytics."""
        # Only researchers and admins can access this
        if not IsResearcherOrAdmin().has_permission(request, self):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_reports = Report.objects.count()
        total_patients = Report.objects.values('patient').distinct().count()
        
        # Date-based statistics
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_reports = Report.objects.filter(created_at__gte=thirty_days_ago).count()
        
        # Attachment statistics
        reports_with_attachments = Report.objects.filter(attachments__isnull=False).distinct().count()
        avg_attachments = Report.objects.annotate(
            attachment_count=Count('attachments')
        ).aggregate(avg=Avg('attachment_count'))['avg'] or 0
        
        # Report type distribution
        report_types = Report.objects.values('title').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Monthly report count for the last 6 months
        monthly_stats = []
        for i in range(6):
            month = datetime.now().replace(day=1) - timedelta(days=30*i)
            month_start = month.replace(day=1)
            next_month = month_start.replace(month=month_start.month+1) if month_start.month < 12 else month_start.replace(year=month_start.year+1, month=1)
            month_end = next_month - timedelta(days=1)
            
            month_count = Report.objects.filter(
                created_at__gte=month_start,
                created_at__lte=month_end
            ).count()
            
            monthly_stats.append({
                'month': month_start.strftime('%Y-%m'),
                'count': month_count
            })
        
        return Response({
            'total_reports': total_reports,
            'total_patients': total_patients,
            'recent_reports_30d': recent_reports,
            'reports_with_attachments': reports_with_attachments,
            'avg_attachments_per_report': round(avg_attachments, 1),
            'attachment_rate': round((reports_with_attachments / total_reports * 100) if total_reports > 0 else 0, 1),
            'top_report_types': list(report_types),
            'monthly_trends': monthly_stats[::-1],  # Reverse to show oldest first
        })

    @action(detail=False, methods=['get'], url_path='analytics/patient/(?P<patient_id>[^/.]+)')
    def patient_analytics(self, request, patient_id=None):
        """Get analytics for a specific patient's reports."""
        user = request.user
        
        # Patients can only access their own analytics
        if getattr(user, 'user_type', None) == 'patient':
            # Check if patient is trying to access their own data
            from patients.models import Patient
            try:
                patient = Patient.objects.get(user=user)
                if str(patient.id) != str(patient_id):
                    return Response(
                        {'error': 'You can only access your own analytics'}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Patient.DoesNotExist:
                return Response(
                    {'error': 'Patient profile not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Providers and admins can access any patient's analytics
        elif getattr(user, 'user_type', None) not in ('doctor', 'nurse', 'admin'):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            patient_reports = Report.objects.filter(patient_id=patient_id)
            
            if not patient_reports.exists():
                return Response(
                    {'error': 'No reports found for this patient'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            total_reports = patient_reports.count()
            reports_with_attachments = patient_reports.filter(attachments__isnull=False).distinct().count()
            
            # Attachment type distribution
            attachment_stats = ReportAttachment.objects.filter(
                report__patient_id=patient_id
            ).values('attachment_type').annotate(
                count=Count('id')
            ).order_by('-count')
            
            # Monthly activity
            monthly_activity = patient_reports.extra({
                'month': "strftime('%%Y-%%m', created_at)"
            }).values('month').annotate(
                count=Count('id')
            ).order_by('month')
            
            return Response({
                'patient_id': patient_id,
                'total_reports': total_reports,
                'reports_with_attachments': reports_with_attachments,
                'attachment_rate': round((reports_with_attachments / total_reports * 100) if total_reports > 0 else 0, 1),
                'attachment_type_distribution': list(attachment_stats),
                'monthly_activity': list(monthly_activity),
                'first_report_date': patient_reports.earliest('created_at').created_at.date().isoformat(),
                'last_report_date': patient_reports.latest('created_at').created_at.date().isoformat(),
            })
            
        except Report.DoesNotExist:
            return Response(
                {'error': 'Patient not found or no reports available'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search reports with various filters."""
        user = request.user
        query = request.query_params.get('search', '')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        attachment_type = request.query_params.get('attachment_type')
        
        qs = self.get_queryset()
        
        # Patients cannot search other patients' data - their queryset is already filtered to only their reports
        if getattr(user, 'user_type', None) == 'patient':
            # Remove any patient filter attempts by patients
            if 'patient' in request.query_params:
                return Response(
                    {'error': 'You can only search your own reports'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Text search
        if query:
            qs = qs.filter(
                Q(title__icontains=query) |
                Q(content__icontains=query)
            )
        
        # Date range filter
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        
        # Attachment type filter
        if attachment_type:
            qs = qs.filter(attachments__attachment_type=attachment_type).distinct()
        
        # Order by relevance or date
        if query:
            qs = qs.order_by('-created_at')
        else:
            qs = qs.order_by('-created_at')
        
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def _hash_patient_id(self, patient_id):
        """Create a consistent hash for patient ID for anonymization."""
        return abs(hash(str(patient_id))) % 10000

    def _calculate_age(self, dob):
        """Calculate age from date of birth."""
        today = datetime.now().date()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    def _get_age_group(self, age):
        """Convert age to age group for anonymization."""
        if age is None:
            return 'Unknown'
        elif age < 18:
            return '0-17'
        elif age < 30:
            return '18-29'
        elif age < 45:
            return '30-44'
        elif age < 60:
            return '45-59'
        else:
            return '60+'


class ReportAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = ReportAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ReportAttachment.objects.all().select_related('report', 'report__patient', 'uploaded_by').order_by('-uploaded_at')
        report_id = self.request.query_params.get('report')
        user = self.request.user
        
        if not user.is_authenticated:
            return qs.none()
        
        # Filter by report if specified
        if report_id:
            qs = qs.filter(report_id=report_id)
        
        # Providers can view all attachments
        if getattr(user, 'user_type', None) in ('doctor', 'nurse', 'admin'):
            return qs
        
        # Patients can ONLY view attachments for their own reports
        elif getattr(user, 'user_type', None) == 'patient':
            return qs.filter(report__patient__user=user)
        
        # Other user types get nothing
        return qs.none()

    def get_permissions(self):
        # For object-level permissions on safe methods
        if self.request.method in SAFE_METHODS:
            if getattr(self.request.user, 'user_type', None) == 'patient':
                return [IsAuthenticated(), IsPatientOwner()]
            else:
                return [IsAuthenticated()]
        
        # For unsafe methods - only providers
        return [IsDoctorOrNurse()]

    def get_object(self):
        """Override to ensure patients can only access their own attachments."""
        obj = super().get_object()
        
        # Additional security check for patients
        user = self.request.user
        if getattr(user, 'user_type', None) == 'patient':
            if obj.report.patient.user != user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have permission to access this attachment.")
        
        return obj

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)