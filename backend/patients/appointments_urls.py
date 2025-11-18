from django.urls import include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# register root so included at /api/appointments/ -> /api/appointments/
router.register(r'', views.AppointmentViewSet, basename='appointments')

# Expose the router urls directly so `include('patients.appointments_urls')`
# can be used in project urls at the desired path prefix.
urlpatterns = router.urls
