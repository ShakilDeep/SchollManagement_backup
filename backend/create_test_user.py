import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

email = 'admin@school.com'
password = 'Admin@123'

if User.objects.filter(email=email).exists():
    user = User.objects.get(email=email)
    print(f'User {email} already exists with username: {user.username}')
else:
    username = 'admin'
    if User.objects.filter(username=username).exists():
        username = 'admin2'
        if User.objects.filter(username=username).exists():
            username = f'admin{User.objects.count() + 1}'
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role='ADMIN',
        is_staff=True,
        is_superuser=True
    )
    print(f'Successfully created user {email} with username: {username}')
