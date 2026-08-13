#!/usr/bin/env python
"""
Quick Email Configuration Test Script
Run with: python quick_test_email.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'djproject.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings

def test_email_configuration():
    """Test email configuration and attempt to send a test email"""
    
    print("=" * 60)
    print("📧 StudyPro Hub Email Configuration Test")
    print("=" * 60)
    
    # Check configuration
    print("\n1️⃣ Checking Email Configuration:")
    print(f"   ✓ EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"   ✓ EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"   ✓ EMAIL_PORT: {settings.EMAIL_PORT}")
    print(f"   ✓ EMAIL_USE_TLS: {settings.EMAIL_USE_TLS}")
    print(f"   ✓ EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"   ✓ DEFAULT_FROM_EMAIL: {settings.DEFAULT_FROM_EMAIL}")
    print(f"   ✓ DEBUG Mode: {settings.DEBUG}")
    
    # Check if using console backend
    if settings.DEBUG:
        print("\n   ⚠️  DEBUG=True: Using Console Backend")
        print("      Emails will print to console, not actually send")
    else:
        print("\n   ✅ DEBUG=False: Using SMTP Backend")
        print("      Emails will be sent via Gmail SMTP")
    
    # Test sending
    print("\n2️⃣ Testing Email Send:")
    
    subject = "🎉 StudyPro Hub - Email Configuration Test"
    html_content = """
    <div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #0d6efd 0%, #0056ca 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0;">StudyPro Hub</h1>
            <p style="margin: 10px 0 0 0;">Email Configuration Test ✅</p>
        </div>
        
        <div style="background: white; padding: 30px; margin-top: 10px; border-radius: 10px;">
            <h2 style="color: #0d6efd;">Hello! 👋</h2>
            <p style="color: #555; line-height: 1.6;">
                This is a test email to verify that your email configuration is working correctly.
            </p>
            
            <div style="background: #e7f3ff; padding: 15px; border-left: 4px solid #0d6efd; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #004085;">
                    <strong>✅ If you received this email, your configuration is correct!</strong>
                </p>
            </div>
            
            <p style="color: #888; font-size: 14px; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                This email was sent using StudyPro Hub's Django email system.
            </p>
        </div>
    </div>
    """
    
    text_content = "StudyPro Hub Email Configuration Test\n\nIf you received this email, your configuration is working!"
    
    try:
        # Send the test email
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.EMAIL_HOST_USER,
            to=[settings.EMAIL_HOST_USER]  # Send to yourself
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        
        print("   ✅ Email sent successfully!")
        print(f"   📧 Sent from: {settings.EMAIL_HOST_USER}")
        print(f"   📧 Sent to: {settings.EMAIL_HOST_USER}")
        
        if settings.DEBUG:
            print("\n   💡 TIP: In DEBUG mode, the email content should appear above this message in the console")
        else:
            print("\n   💡 Check your Gmail inbox for the test email")
            
    except Exception as e:
        print(f"   ❌ Error sending email: {e}")
        print("\n   Troubleshooting tips:")
        print("   1. Check that .env file exists in project root")
        print("   2. Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are correct")
        print("   3. Make sure 2-Step Verification is enabled on Gmail")
        print("   4. Use Gmail App Password, not regular password")
        return False
    
    print("\n" + "=" * 60)
    print("✅ Email Configuration Test Complete!")
    print("=" * 60)
    return True


def test_welcome_email():
    """Test sending a welcome email"""
    print("\n\n3️⃣ Testing Welcome Email Function:")
    
    try:
        from accounts.email_utils import send_welcome_email
        
        test_email = settings.EMAIL_HOST_USER
        test_name = "Test User"
        
        print(f"   Sending welcome email to {test_email}...")
        result = send_welcome_email(test_email, test_name)
        
        if result:
            print("   ✅ Welcome email sent successfully!")
        else:
            print("   ❌ Failed to send welcome email (check logs)")
            
    except ImportError as e:
        print(f"   ⚠️  Could not import email functions: {e}")


def test_login_alert_email():
    """Test sending a login alert email"""
    print("\n4️⃣ Testing Login Alert Email Function:")
    
    try:
        from accounts.email_utils import send_login_alert_email
        
        test_email = settings.EMAIL_HOST_USER
        test_name = "Test User"
        
        print(f"   Sending login alert email to {test_email}...")
        result = send_login_alert_email(test_email, test_name)
        
        if result:
            print("   ✅ Login alert email sent successfully!")
        else:
            print("   ❌ Failed to send login alert email (check logs)")
            
    except ImportError as e:
        print(f"   ⚠️  Could not import email functions: {e}")


if __name__ == '__main__':
    print("\n")
    success = test_email_configuration()
    
    if success:
        test_welcome_email()
        test_login_alert_email()
    
    print("\n")
