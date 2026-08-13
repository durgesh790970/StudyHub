#!/usr/bin/env python
"""
Test Registration Script
Tests if user data is saved to database when registering
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djproject.settings')
django.setup()

from django.contrib.auth.models import User
from accounts.models import UserProfile

def test_registration():
    """Test user registration"""
    
    print("\n" + "="*60)
    print("  🧪 Testing User Registration & Database Storage")
    print("="*60)
    
    # Test data
    email = "testuser@example.com"
    fullname = "Test Student"
    password = "TestPass123!@#"
    
    print(f"\n📝 Creating test user:")
    print(f"   Email: {email}")
    print(f"   Name: {fullname}")
    
    try:
        # Create user (same as signup_page does)
        auth_user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=fullname
        )
        print(f"   ✅ User created in auth_user table")
        
        # Create profile (same as signup_page does)
        profile = UserProfile.objects.create(auth_user=auth_user)
        print(f"   ✅ UserProfile created")
        
    except Exception as e:
        print(f"   ❌ Error creating user: {e}")
        return False
    
    # Verify data in database
    print(f"\n🔍 Verifying data in database:")
    
    try:
        # Check auth_user
        saved_user = User.objects.get(email=email)
        print(f"   ✅ auth_user table:")
        print(f"      - ID: {saved_user.id}")
        print(f"      - Username: {saved_user.username}")
        print(f"      - Email: {saved_user.email}")
        print(f"      - First Name: {saved_user.first_name}")
        print(f"      - Created: {saved_user.date_joined}")
        
        # Check UserProfile
        saved_profile = UserProfile.objects.get(auth_user=saved_user)
        print(f"   ✅ UserProfile table:")
        print(f"      - ID: {saved_profile.id}")
        print(f"      - auth_user_id: {saved_profile.auth_user_id}")
        print(f"      - Created: {saved_profile.created_at}")
        
    except Exception as e:
        print(f"   ❌ Error retrieving user: {e}")
        return False
    
    # Show all users
    print(f"\n📊 All users in database:")
    all_users = User.objects.all()
    print(f"   Total users: {all_users.count()}")
    for user in all_users:
        print(f"   - {user.email} ({user.first_name})")
    
    print("\n" + "="*60)
    print("  ✅ Registration & Database Storage Test PASSED!")
    print("="*60 + "\n")
    
    return True

if __name__ == "__main__":
    success = test_registration()
    sys.exit(0 if success else 1)
