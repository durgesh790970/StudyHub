from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)


def send_welcome_email(email, name):
    """Send welcome email to new registered user"""
    subject = "🎉 Welcome to StudyPro Hub!"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'no-reply@studypro.local')

    html_body = f"""
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #0d6efd 0%, #0056ca 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">StudyPro Hub</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your Journey to Success Starts Here 🚀</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0d6efd; margin-top: 0;">Hello {name}! 👋</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
                Welcome to <strong>StudyPro Hub</strong>! Your account has been successfully created.
            </p>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
                You now have access to:
            </p>
            
            <ul style="color: #555; line-height: 2; font-size: 15px;">
                <li>✅ 1000+ Coding Problems</li>
                <li>✅ Aptitude & Reasoning Practice</li>
                <li>✅ Mock Interviews</li>
                <li>✅ Video Lessons & PDFs</li>
                <li>✅ Expert Mentorship</li>
                <li>✅ Community Forum</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://studyprohub.com/dashboard" style="background: #0d6efd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Start Your Journey 🎯
                </a>
            </div>
            
            <p style="color: #888; font-size: 14px; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                If you have any questions, reply to this email or visit our <a href="https://studyprohub.com/about" style="color: #0d6efd; text-decoration: none;">Help Center</a>.
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">© 2024 StudyPro Hub. All rights reserved.</p>
        </div>
    </div>
    """

    text_body = f"Welcome to StudyPro Hub, {name}! Your account is ready. Visit https://studyprohub.com/dashboard to start learning."

    try:
        msg = EmailMultiAlternatives(subject=subject, body=text_body, from_email=from_email, to=[email])
        msg.attach_alternative(html_body, "text/html")
        msg.send()
        logger.info(f"Welcome email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {e}")
        return False


def send_login_alert_email(email, name):
    """Send login alert email to user"""
    subject = "✅ New Login to Your StudyPro Hub Account"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'no-reply@studypro.local')

    html_body = f"""
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">StudyPro Hub</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Security Alert</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #28a745; margin-top: 0;">Hello {name}! 👋</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
                You just logged into your StudyPro Hub account.
            </p>
            
            <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #2e7d32; font-size: 15px;">
                    <strong>✓ Login Successful</strong><br>
                    Your account is secure and active.
                </p>
            </div>
            
            <p style="color: #555; line-height: 1.6; font-size: 15px;">
                If this wasn't you, please secure your account immediately by changing your password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://studyprohub.com/dashboard" style="background: #0d6efd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Go to Dashboard 📊
                </a>
            </div>
            
            <p style="color: #888; font-size: 14px; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                Questions? Contact us at support@studyprohub.com
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">© 2024 StudyPro Hub. All rights reserved.</p>
        </div>
    </div>
    """

    text_body = f"Hello {name}, you just logged into your StudyPro Hub account. If this wasn't you, please change your password immediately."

    try:
        msg = EmailMultiAlternatives(subject=subject, body=text_body, from_email=from_email, to=[email])
        msg.attach_alternative(html_body, "text/html")
        msg.send()
        logger.info(f"Login alert email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send login alert email to {email}: {e}")
        return False


def send_password_reset_email(email, name, reset_token):
    """Send password reset email to user"""
    subject = "🔐 Reset Your StudyPro Hub Password"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'no-reply@studypro.local')
    reset_link = f"https://studyprohub.com/reset/{reset_token}"

    html_body = f"""
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #0d6efd 0%, #0056ca 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">StudyPro Hub</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #0d6efd; margin-top: 0;">Hello {name}! 👋</h2>
            
            <p style="color: #555; line-height: 1.6; font-size: 16px;">
                We received a request to reset your password. Click the button below to create a new password.
            </p>
            
            <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #856404; font-size: 14px;">
                    ⚠️ This link expires in 24 hours. If you didn't request this, ignore this email.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background: #0d6efd; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                    Reset Password 🔐
                </a>
            </div>
            
            <p style="color: #888; font-size: 13px; margin-top: 20px; word-break: break-all;">
                Or copy this link: <br><a href="{reset_link}" style="color: #0d6efd;">{reset_link}</a>
            </p>
            
            <p style="color: #888; font-size: 14px; margin-top: 20px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
                Need help? Contact us at support@studyprohub.com
            </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p style="margin: 0;">© 2024 StudyPro Hub. All rights reserved.</p>
        </div>
    </div>
    """

    text_body = f"Hello {name}, click this link to reset your password: {reset_link}. This link expires in 24 hours."

    try:
        msg = EmailMultiAlternatives(subject=subject, body=text_body, from_email=from_email, to=[email])
        msg.attach_alternative(html_body, "text/html")
        msg.send()
        logger.info(f"Password reset email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        return False


def send_result_email(email, name, test_name, score, total, accuracy, time_taken, rank, feedback):
    """Send a professional HTML result email to the user.

    Returns True on success, False on failure.
    """
    subject = f"{test_name} Results · StudyPro"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', 'no-reply@studypro.local')

    context = {
        'name': name or 'Candidate',
        'test_name': test_name,
        'score': score,
        'total': total,
        'accuracy': accuracy,
        'time_taken': time_taken,
        'rank': rank,
        'feedback': feedback,
        'brand_url': 'https://studypro.example.com',
        'brand_name': 'StudyPro',
    }

    # Render HTML body from template
    html_body = render_to_string('emails/result_email.html', context)

    # Compose and send
    try:
        text_body = render_to_string('emails/result_email.txt', context)
    except Exception:
        text_body = f"{test_name} results for {name}: {score}/{total} ({accuracy}%)\n{feedback}"

    try:
        msg = EmailMultiAlternatives(subject=subject, body=text_body, from_email=from_email, to=[email])
        msg.attach_alternative(html_body, "text/html")
        msg.send()
        return True
    except Exception as e:
        logger.exception('Failed to send result email to %s: %s', email, e)
        return False
