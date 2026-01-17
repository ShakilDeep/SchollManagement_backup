from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, CurriculumViewSet

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'curriculum', CurriculumViewSet, basename='curriculum')

urlpatterns = [
    path('', include(router.urls)),
]
