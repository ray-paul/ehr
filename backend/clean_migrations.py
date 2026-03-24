# clean_migrations.py
import os
import shutil

apps = ['authentication', 'patients', 'appointments_app', 'reports', 'prescriptions', 'labresults']

print("Cleaning migration folders...")

for app in apps:
    migrations_path = os.path.join(app, 'migrations')
    if os.path.exists(migrations_path):
        shutil.rmtree(migrations_path)
        print(f"Deleted {migrations_path}")
    
    # Create fresh migrations folder
    os.makedirs(migrations_path, exist_ok=True)
    
    # Create __init__.py
    init_file = os.path.join(migrations_path, '__init__.py')
    with open(init_file, 'w') as f:
        pass
    print(f"Created {init_file}")

# Delete database
if os.path.exists('db.sqlite3'):
    os.remove('db.sqlite3')
    print("Deleted db.sqlite3")

print("\n✅ Cleanup complete!")
print("\nNow run:")
print("python manage.py makemigrations")
print("python manage.py migrate")
print("python manage.py createsuperuser")