from django.core.management.base import BaseCommand
from apps.users.models import User

class Command(BaseCommand):
    help = 'Create a test user'

    def handle(self, *args, **options):
        email = 'admin@school.com'
        password = 'Admin@123'
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'User {email} already exists'))
            return
        user = User.objects.create_user(
            username='admin',
            email=email,
            password=password,
            role='ADMIN'
        )
        self.stdout.write(self.style.SUCCESS(f'Successfully created user {email}'))
