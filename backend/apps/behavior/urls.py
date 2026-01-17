from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BehaviorRecordViewSet

router = DefaultRouter()
router.register(r'behavior-records', BehaviorRecordViewSet, basename='behavior-record')

urlpatterns = [
    path('', include(router.urls)),
]
