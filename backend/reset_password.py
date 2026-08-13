#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djproject.settings')
django.setup()

from django.contrib.auth.models import User

print("=" * 60)
print("PASSWORD RESET")
print("=" * 60)

# Reset password for the user trying to login
email = "durgeshpatel20031234@gmail.com"
new_password = "Durgesh@1234"

try:
    user = User.objects.get(email=email)
    user.set_password(new_password)
    user.save()
    print(f"\n✓ Password reset successfully!")
    print(f"  Email: {email}")
    print(f"  Password: {new_password}")
    
    # Test authentication
    from django.contrib.auth import authenticate
    test_user = authenticate(username=email, password=new_password)
    if test_user:
        print(f"\n✓ LOGIN VERIFIED - User can now login successfully!")
    else:
        print(f"\n✗ Login verification failed")
        
except User.DoesNotExist:
    print(f"\n✗ User not found: {email}")
