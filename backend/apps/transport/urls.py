from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VehicleViewSet, TransportAllocationViewSet

router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
router.register(r'transport-allocations', TransportAllocationViewSet, basename='transport-allocation')

urlpatterns = [
    path('', include(router.urls)),
]
