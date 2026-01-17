from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HostelViewSet, RoomViewSet, HostelAllocationViewSet

router = DefaultRouter()
router.register(r'hostels', HostelViewSet, basename='hostel')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'hostel-allocations', HostelAllocationViewSet, basename='hostel-allocation')

urlpatterns = [
    path('', include(router.urls)),
]
