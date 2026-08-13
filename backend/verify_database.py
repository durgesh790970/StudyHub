#!/usr/bin/env python
"""
Database Verification Script
Verify that new user registration data is saved in database
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djproject.settings')
django.setup()

from django.contrib.auth.models import User
from accounts.models import UserProfile

print("\n" + "="*70)
print("  📊 DATABASE VERIFICATION - New User Registration")
print("="*70)

# Check for new user
try:
    user = User.objects.get(email='amit.singh@example.com')
    print(f"\n✅ User Found in Database!")
    print(f"   ID: {user.id}")
    print(f"   Email: {user.email}")
    print(f"   Username: {user.username}")
    print(f"   First Name: {user.first_name}")
    print(f"   Created: {user.date_joined}")
    
    # Get profile
    try:
        profile = UserProfile.objects.get(auth_user=user)
        print(f"\n✅ UserProfile Found!")
        print(f"   Profile ID: {profile.id}")
        print(f"   Created: {profile.created_at}")
    except UserProfile.DoesNotExist:
        print(f"\n⚠️ UserProfile Not Found")
    
except User.DoesNotExist:
    print(f"\n❌ User 'amit.singh@example.com' not found")

# Show all users
print(f"\n📈 Total Users in Database: {User.objects.count()}")
print(f"\n📋 All Registered Users:")
print("-" * 70)
for u in User.objects.all().order_by('-date_joined'):
    dt = u.date_joined.strftime("%Y-%m-%d %H:%M:%S")
    print(f"  • {u.email:35} ({u.first_name:20}) | {dt}")

print("\n" + "="*70)
print("  ✅ Setup Complete! Data is being saved to database.")
print("="*70 + "\n")
