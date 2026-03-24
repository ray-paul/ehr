# backend/authentication/management/commands/fix_superuser.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix superuser user_type'

    def handle(self, *args, **options):
        # Find all superusers
        superusers = User.objects.filter(is_superuser=True)
        
        if not superusers.exists():
            # Create a new superuser
            self.stdout.write("No superuser found. Creating one...")
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='Admin123!'
            )
            admin.user_type = 'master_admin'
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"Created admin with user_type: {admin.user_type}"))
        else:
            # Update existing superusers
            for user in superusers:
                old_type = user.user_type
                user.user_type = 'master_admin'
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Updated {user.username}: {old_type} -> {user.user_type}"))