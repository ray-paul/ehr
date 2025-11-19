from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, ReportAttachmentViewSet

router = DefaultRouter()
router.register(r'', ReportViewSet, basename='reports')
router.register(r'attachments', ReportAttachmentViewSet, basename='report-attachments')

urlpatterns = router.urls
