# backend/authentication/management/commands/fix_users.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix user types for existing users'

    def handle(self, *args, **options):
        # Fix superusers
        for user in User.objects.filter(is_superuser=True):
            if not user.user_type or user.user_type == 'patient':
                user.user_type = 'master_admin'
                user.save()
                self.stdout.write(f"Fixed: {user.username} -> {user.user_type}")
        
        # Fix staff users
        for user in User.objects.filter(is_staff=True, is_superuser=False):
            if not user.user_type or user.user_type == 'patient':
                user.user_type = 'admin'
                user.save()
                self.stdout.write(f"Fixed: {user.username} -> {user.user_type}")
        
        self.stdout.write(self.style.SUCCESS('Successfully fixed user types'))