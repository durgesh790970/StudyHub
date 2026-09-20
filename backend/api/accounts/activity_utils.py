"""
Activity Utilities - Core functions for tracking, retrieving, and analyzing user activities
"""
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models import UserActivity
from django.db.models import Count, Q


def log_activity(user, activity_type, title='', description='', data=None):
    """
    Core function to log user activities.
    
    Args:
        user: Django User object
        activity_type: One of the ACTIVITY_TYPES choices in UserActivity model
        title: Short activity title (optional)
        description: Detailed description (optional)
        data: Dictionary with extra data like score, amount, etc. (optional)
    
    Returns:
        UserActivity instance or None
    
    Example:
        ```python
        log_activity(
            user=request.user,
            activity_type='pdf_purchase',
            title='Google PDFs - ABC Package',
            description='User purchased PDF package from Google',
            data={'amount': 199, 'company': 'Google', 'pdf_id': 5}
        )
        ```
    """
    if not user or not isinstance(user, User):
        return None
    
    try:
        activity = UserActivity.objects.create(
            user=user,
            activity_type=activity_type,
            title=title or f'{activity_type.replace("_", " ").title()}',
            description=description,
            data=data or {}
        )
        return activity
    except Exception as e:
        print(f"Error logging activity: {e}")
        return None


def get_user_activity_stats(user):
    """
    Get activity statistics for a user.
    
    Returns:
        Dictionary with counts for each activity type
    """
    if not user or not isinstance(user, User):
        return {}
    
    stats = {
        'total_activities': user.activities.count(),
        'pdfs_purchased': user.activities.filter(activity_type='pdf_purchase').count(),
        'tests_submitted': user.activities.filter(activity_type__in=['quiz_complete', 'mock_complete']).count(),
        'mock_tests_attempted': user.activities.filter(activity_type__in=['mock_attempt', 'mock_complete']).count(),
        'videos_watched': user.activities.filter(activity_type='video_watch').count(),
        'quizzes_attempted': user.activities.filter(activity_type__in=['quiz_attempt', 'quiz_complete']).count(),
        'interviews_given': user.activities.filter(activity_type__in=['interview_attempt', 'interview_complete']).count(),
        'profile_updates': user.activities.filter(activity_type='profile_update').count(),
        'logins': user.activities.filter(activity_type='login').count(),
        'last_activity': user.activities.first().created_at if user.activities.exists() else None,
    }
    return stats


def get_user_activity_history(user, limit=50, activity_type=None, offset=0):
    """
    Get paginated activity history for a user.
    
    Args:
        user: Django User object
        limit: Number of activities to return (default 50)
        activity_type: Filter by specific activity type (optional)
        offset: Pagination offset (default 0)
    
    Returns:
        List of activity dictionaries
    """
    if not user or not isinstance(user, User):
        return []
    
    queryset = user.activities.all()
    
    if activity_type:
        queryset = queryset.filter(activity_type=activity_type)
    
    total = queryset.count()
    activities = queryset[offset:offset+limit]
    
    return {
        'total': total,
        'offset': offset,
        'limit': limit,
        'activities': [act.as_dict() for act in activities]
    }


def get_activity_summary_by_date(user, days=7):
    """
    Get activity summary grouped by date for the last N days.
    
    Returns:
        List of daily activity counts
    """
    if not user or not isinstance(user, User):
        return []
    
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=days)
    
    summary = []
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        count = user.activities.filter(
            created_at__date=current_date
        ).count()
        summary.append({
            'date': current_date.isoformat(),
            'count': count
        })
    
    return summary


def get_most_active_hours(user, days=7):
    """
    Analyze which hours of the day user is most active.
    
    Returns:
        Dictionary with hour-based activity counts (0-23)
    """
    if not user or not isinstance(user, User):
        return {}
    
    start_date = timezone.now() - timedelta(days=days)
    activities = user.activities.filter(created_at__gte=start_date)
    
    hours = {i: 0 for i in range(24)}
    
    for activity in activities:
        hour = activity.created_at.hour
        hours[hour] += 1
    
    return hours


def get_streaks(user):
    """
    Calculate login streaks for a user.
    
    Returns:
        Dictionary with current_streak and longest_streak
    """
    if not user or not isinstance(user, User):
        return {'current_streak': 0, 'longest_streak': 0, 'last_login': None}
    
    login_activities = user.activities.filter(activity_type='login').order_by('-created_at')
    
    if not login_activities.exists():
        return {'current_streak': 0, 'longest_streak': 0, 'last_login': None}
    
    last_login = login_activities.first().created_at.date()
    
    # Calculate current streak
    current_streak = 1
    previous_date = last_login
    
    for login in login_activities[1:]:
        login_date = login.created_at.date()
        if previous_date - login_date == timedelta(days=1):
            current_streak += 1
            previous_date = login_date
        else:
            break
    
    # Calculate longest streak
    longest_streak = 1
    temp_streak = 1
    previous_date = None
    
    for login in login_activities.reverse():
        login_date = login.created_at.date()
        if previous_date is None:
            previous_date = login_date
        elif previous_date - login_date == timedelta(days=1):
            temp_streak += 1
        else:
            if temp_streak > longest_streak:
                longest_streak = temp_streak
            temp_streak = 1
        previous_date = login_date
    
    if temp_streak > longest_streak:
        longest_streak = temp_streak
    
    return {
        'current_streak': current_streak,
        'longest_streak': longest_streak,
        'last_login': last_login.isoformat()
    }


def get_benchmark_activity(user):
    """
    Compare user's activity against all users.
    
    Returns:
        Dictionary with percentile rankings
    """
    if not user or not isinstance(user, User):
        return {}
    
    user_activity_count = user.activities.count()
    total_users = User.objects.count()
    
    users_with_more_activities = User.objects.annotate(
        activity_count=Count('activities')
    ).filter(activity_count__gt=user_activity_count).count()
    
    percentile = ((total_users - users_with_more_activities) / total_users * 100) if total_users > 0 else 0
    
    avg_activities = User.objects.annotate(
        activity_count=Count('activities')
    ).aggregate(avg=models.Avg('activity_count'))['avg'] or 0
    
    return {
        'percentile': round(percentile, 2),
        'user_activities': user_activity_count,
        'average_activities': round(avg_activities, 2),
        'ranking': users_with_more_activities + 1,
        'total_users': total_users
    }


def get_activity_insights(user):
    """
    Get comprehensive activity insights for a user.
    
    Returns:
        Dictionary with multiple analytics
    """
    if not user or not isinstance(user, User):
        return {}
    
    stats = get_user_activity_stats(user)
    streaks = get_streaks(user)
    summary = get_activity_summary_by_date(user, days=7)
    most_active = get_most_active_hours(user, days=7)
    benchmark = get_benchmark_activity(user)
    
    # Determine most active day
    most_active_day = max(summary, key=lambda x: x['count'])['date'] if summary else None
    
    # Determine peak hour
    peak_hour = max(enumerate(most_active.values()), key=lambda x: x[1])[0] if most_active else 0
    
    return {
        'stats': stats,
        'streaks': streaks,
        'daily_summary': summary,
        'hourly_distribution': most_active,
        'benchmark': benchmark,
        'most_active_day': most_active_day,
        'peak_hour': f"{peak_hour:02d}:00 - {peak_hour+1:02d}:00",
        'total_engagement_score': round(stats['total_activities'] * 1.5, 2)
    }


def delete_user_activity(activity_id, user=None):
    """
    Delete a specific activity (admin only function).
    
    Args:
        activity_id: ID of activity to delete
        user: Optional user to verify ownership
    
    Returns:
        Boolean indicating success
    """
    try:
        activity = UserActivity.objects.get(id=activity_id)
        if user and activity.user != user:
            return False
        activity.delete()
        return True
    except UserActivity.DoesNotExist:
        return False


def clear_user_activities(user, activity_type=None):
    """
    Clear all activities for a user (admin only).
    
    Args:
        user: Django User object
        activity_type: Optional specific activity type to clear
    
    Returns:
        Number of activities deleted
    """
    if not user:
        return 0
    
    queryset = user.activities.all()
    if activity_type:
        queryset = queryset.filter(activity_type=activity_type)
    
    count = queryset.count()
    queryset.delete()
    return count


def get_activity_by_id(activity_id):
    """
    Get a specific activity by ID.
    
    Returns:
        Activity dictionary or None
    """
    try:
        activity = UserActivity.objects.get(id=activity_id)
        return activity.as_dict()
    except UserActivity.DoesNotExist:
        return None


def get_recent_activities(limit=10):
    """
    Get recent activities from all users (admin view).
    
    Returns:
        List of activity dictionaries
    """
    activities = UserActivity.objects.all().order_by('-created_at')[:limit]
    return [act.as_dict() for act in activities]


# Import at bottom to avoid circular imports
from django.db import models
