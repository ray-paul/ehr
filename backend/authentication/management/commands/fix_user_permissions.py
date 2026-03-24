# backend/authentication/management/commands/fix_permissions.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission

User = get_user_model()

class Command(BaseCommand):
    help = 'Fix user permissions for all users'

    def handle(self, *args, **options):
        # Fix master admin
        master_admins = User.objects.filter(user_type='master_admin')
        if master_admins.exists():
            for admin in master_admins:
                admin.is_superuser = True
                admin.is_staff = True
                admin.is_verified = True
                # Grant all permissions
                admin.user_permissions.set(Permission.objects.all())
                admin.save()
                self.stdout.write(self.style.SUCCESS(f"Fixed master admin: {admin.username}"))
                self.stdout.write(f"  - user_type: {admin.user_type}")
                self.stdout.write(f"  - is_superuser: {admin.is_superuser}")
                self.stdout.write(f"  - is_staff: {admin.is_staff}")
                self.stdout.write(f"  - is_verified: {admin.is_verified}")
                self.stdout.write(f"  - permissions: {admin.user_permissions.count()}")
        else:
            # Create master admin if doesn't exist
            self.stdout.write("No master admin found. Creating one...")
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@example.com',
                password='Admin123!',
                first_name='Admin',
                last_name='User'
            )
            admin.user_type = 'master_admin'
            admin.is_verified = True
            admin.user_permissions.set(Permission.objects.all())
            admin.save()
            self.stdout.write(self.style.SUCCESS(f"Created master admin: {admin.username}"))

        # Fix any superusers that aren't master admin
        superusers = User.objects.filter(is_superuser=True).exclude(user_type='master_admin')
        for user in superusers:
            user.user_type = 'admin'
            user.is_verified = True
            user.save()
            self.stdout.write(f"Fixed superuser: {user.username} -> admin")

        # Fix staff users
        staff_users = User.objects.filter(is_staff=True, is_superuser=False)
        for user in staff_users:
            if not user.is_verified:
                user.is_verified = True
                user.save()
                self.stdout.write(f"Verified staff: {user.username}")

        # List all users
        self.stdout.write("\n=== All Users ===")
        for user in User.objects.all():
            self.stdout.write(f"{user.username}: type={user.user_type}, super={user.is_superuser}, staff={user.is_staff}, verified={user.is_verified}, perms={user.user_permissions.count()}")

        self.stdout.write(self.style.SUCCESS("\n✅ All permissions fixed!"))