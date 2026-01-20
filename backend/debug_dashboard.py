import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.views import dashboard_stats
from django.test import RequestFactory
from apps.users.models import User

print("Testing dashboard view...")
try:
    user = User.objects.first()
    print(f"User: {user}")
    
    factory = RequestFactory()
    request = factory.get('/api/dashboard/')
    request.user = user
    
    print("Calling dashboard_stats...")
    result = dashboard_stats(request)
    print(f"Status: {result.status_code}")
    print(f"Data: {result.data}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
