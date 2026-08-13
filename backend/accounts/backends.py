"""
Custom authentication backends for email-based login.
"""
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailOrUsernameBackend(ModelBackend):
    """
    Authenticates using either email or username.
    Allows users to log in with their email address or username.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        # Handle None cases
        if not username or not password:
            return None
        
        user = None
        
        try:
            # Try to authenticate using email first
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            try:
                # Fall back to username if email lookup fails
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                # Return None if user not found
                return None
        
        # Check password
        if user is not None and user.check_password(password):
            if self.user_can_authenticate(user):
                return user
        
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
