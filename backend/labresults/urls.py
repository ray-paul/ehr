from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'test-types', views.LabTestTypeViewSet)
router.register(r'orders', views.LabOrderViewSet)
router.register(r'orders/(?P<lab_order_id>\d+)/attachments', views.LabAttachmentViewSet, basename='lab-attachments')

urlpatterns = [
    path('', include(router.urls)),
]