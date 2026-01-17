from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.students.urls')),
    path('api/', include('apps.attendance.urls')),
    path('api/', include('apps.staff.urls')),
    path('api/', include('apps.exams.urls')),
    path('api/', include('apps.curriculum.urls')),
    path('api/', include('apps.library.urls')),
    path('api/', include('apps.inventory.urls')),
    path('api/', include('apps.transport.urls')),
    path('api/', include('apps.hostel.urls')),
    path('api/', include('apps.messaging.urls')),
    path('api/', include('apps.behavior.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
