#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djproject.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

print("=" * 60)
print("DEBUG: Authentication System")
print("=" * 60)

# List all users
print("\n1. All users in database:")
users = User.objects.all()
if not users.exists():
    print("   No users found!")
else:
    for user in users:
        print(f"   - Username: {user.username}")
        print(f"     Email: {user.email}")

# Check authentication backend
print("\n2. Configured Authentication Backends:")
from django.conf import settings
for backend in settings.AUTHENTICATION_BACKENDS:
    print(f"   - {backend}")

# Create a test user for verification
print("\n3. Creating test user...")
test_user, created = User.objects.get_or_create(
    username="testuser@example.com",
    email="testuser@example.com"
)
if created:
    test_user.set_password("TestPassword123")
    test_user.save()
    print("   ✓ Test user created")
else:
    print("   ✓ Test user already exists")

# Try authentication with test user
print(f"\n4. Testing authentication with test user:")
print(f"   Email: testuser@example.com")
print(f"   Password: TestPassword123")

result = authenticate(username="testuser@example.com", password="TestPassword123")
if result:
    print(f"   ✓ AUTH SUCCESS: {result}")
else:
    print(f"   ✗ AUTH FAILED - Returned None")

# Also test with username
result2 = authenticate(username="testuser@example.com", password="TestPassword123")
print(f"   Result: {result2}")
