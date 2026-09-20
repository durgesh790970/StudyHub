"""
Activity API Endpoints - RESTful API for activity tracking and retrieval
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required

from .models import UserActivity
from .activity_utils import (
    log_activity,
    get_user_activity_stats,
    get_user_activity_history,
    get_activity_summary_by_date,
    get_most_active_hours,
    get_streaks,
    get_benchmark_activity,
    get_activity_insights,
    delete_user_activity,
    clear_user_activities,
    get_activity_by_id,
    get_recent_activities
)


def get_user_from_request(request):
    """Extract user from request (session or URL parameter)."""
    # Try session first
    if request.user.is_authenticated:
        return request.user
    
    # Try query parameter or form data
    user_id = request.GET.get('userId') or request.POST.get('userId')
    if user_id:
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    return None


def get_json_data(request):
    """Parse JSON data from request body."""
    try:
        return json.loads(request.body.decode('utf-8'))
    except:
        return {}


# =============================================================================
# CORE ACTIVITY ENDPOINTS
# =============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def activity_log(request):
    """
    Log a new activity.
    
    POST /api/activity/log/
    
    Required fields:
        - activity_type: One of the ACTIVITY_TYPES
        - title: Activity title (optional)
        - description: Activity description (optional)
        - data: Extra data dictionary (optional)
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    activity_type = data.get('activityType') or data.get('activity_type')
    
    if not activity_type:
        return JsonResponse({'ok': False, 'error': 'activity_type is required'}, status=400)
    
    activity = log_activity(
        user=user,
        activity_type=activity_type,
        title=data.get('title', ''),
        description=data.get('description', ''),
        data=data.get('data', {})
    )
    
    if activity:
        return JsonResponse({
            'ok': True,
            'message': 'Activity logged successfully',
            'activity': activity.as_dict()
        }, status=201)
    else:
        return JsonResponse({'ok': False, 'error': 'Failed to log activity'}, status=500)


@csrf_exempt
@require_http_methods(["GET"])
def activity_stats(request):
    """
    Get activity statistics for current user.
    
    GET /api/activity/stats/?userId=1
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    stats = get_user_activity_stats(user)
    
    return JsonResponse({
        'ok': True,
        'stats': stats
    })


@csrf_exempt
@require_http_methods(["GET"])
def activity_history(request):
    """
    Get paginated activity history.
    
    GET /api/activity/history/?limit=50&offset=0&activityType=pdf_purchase
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    limit = int(request.GET.get('limit', 50))
    offset = int(request.GET.get('offset', 0))
    activity_type = request.GET.get('activityType')
    
    # Validate limit
    if limit > 500:
        limit = 500
    
    history = get_user_activity_history(user, limit=limit, activity_type=activity_type, offset=offset)
    
    return JsonResponse({
        'ok': True,
        **history
    })


@csrf_exempt
@require_http_methods(["GET"])
def activity_insights(request):
    """
    Get comprehensive activity insights.
    
    GET /api/activity/insights/?userId=1
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    insights = get_activity_insights(user)
    
    return JsonResponse({
        'ok': True,
        'insights': insights
    })


# =============================================================================
# ANALYTICS ENDPOINTS
# =============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def activity_summary(request):
    """
    Get activity summary by date.
    
    GET /api/activity/summary/?days=7
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    days = int(request.GET.get('days', 7))
    summary = get_activity_summary_by_date(user, days=days)
    
    return JsonResponse({
        'ok': True,
        'summary': summary
    })


@csrf_exempt
@require_http_methods(["GET"])
def activity_most_active_hours(request):
    """
    Get peak activity hours.
    
    GET /api/activity/most-active-hours/?days=7
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    days = int(request.GET.get('days', 7))
    hours = get_most_active_hours(user, days=days)
    
    return JsonResponse({
        'ok': True,
        'hours': hours
    })


@csrf_exempt
@require_http_methods(["GET"])
def activity_streaks(request):
    """
    Get login streaks.
    
    GET /api/activity/streaks/?userId=1
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    streaks = get_streaks(user)
    
    return JsonResponse({
        'ok': True,
        'streaks': streaks
    })


@csrf_exempt
@require_http_methods(["GET"])
def activity_benchmark(request):
    """
    Get user benchmark/comparison data.
    
    GET /api/activity/benchmark/?userId=1
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    benchmark = get_benchmark_activity(user)
    
    return JsonResponse({
        'ok': True,
        'benchmark': benchmark
    })


# =============================================================================
# ACTIVITY TYPE FILTERS
# =============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def activity_by_type(request):
    """
    Get activities filtered by type.
    
    GET /api/activity/by-type/?type=pdf_purchase&limit=20
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    activity_type = request.GET.get('type')
    if not activity_type:
        return JsonResponse({'ok': False, 'error': 'type parameter is required'}, status=400)
    
    limit = int(request.GET.get('limit', 20))
    activities = user.activities.filter(activity_type=activity_type)[:limit]
    
    return JsonResponse({
        'ok': True,
        'type': activity_type,
        'count': activities.count(),
        'activities': [act.as_dict() for act in activities]
    })


@csrf_exempt
@require_http_methods(["GET"])
def activity_pdfs_purchased(request):
    """Get all PDF purchase activities."""
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    activities = user.activities.filter(activity_type='pdf_purchase').order_by('-created_at')
    
    return JsonResponse({
        'ok': True,
        'count': activities.count(),
        'activities': [act.as_dict() for act in activities]
    })


@csrf_exempt
@require_http_methods(["GET"])
def activity_tests_submitted(request):
    """Get all test submission activities."""
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    activities = user.activities.filter(
        activity_type__in=['quiz_complete', 'mock_complete']
    ).order_by('-created_at')
    
    return JsonResponse({
        'ok': True,
        'count': activities.count(),
        'activities': [act.as_dict() for act in activities]
    })


@csrf_exempt
@require_http_methods(["GET"])
def activity_videos_watched(request):
    """Get all video watch activities."""
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    activities = user.activities.filter(activity_type='video_watch').order_by('-created_at')
    
    return JsonResponse({
        'ok': True,
        'count': activities.count(),
        'activities': [act.as_dict() for act in activities]
    })


@csrf_exempt
@require_http_methods(["GET"])
def activity_interviews_given(request):
    """Get all interview activities."""
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    activities = user.activities.filter(
        activity_type__in=['interview_attempt', 'interview_complete']
    ).order_by('-created_at')
    
    return JsonResponse({
        'ok': True,
        'count': activities.count(),
        'activities': [act.as_dict() for act in activities]
    })


# =============================================================================
# DASHBOARD & COMPLETE PROFILE ENDPOINTS
# =============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def activity_dashboard(request):
    """
    Get complete dashboard data (all stats, history, insights).
    
    GET /api/activity/dashboard/?limit=20
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    limit = int(request.GET.get('limit', 20))
    
    stats = get_user_activity_stats(user)
    history = get_user_activity_history(user, limit=limit)
    insights = get_activity_insights(user)
    streaks = get_streaks(user)
    
    return JsonResponse({
        'ok': True,
        'stats': stats,
        'history': history,
        'insights': insights,
        'streaks': streaks
    })


@csrf_exempt
@require_http_methods(["GET"])
def user_profile_complete(request):
    """
    Get complete user profile with all activity data.
    
    GET /api/user/profile/complete/?userId=1
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    from .models import PurchasedItem, AttemptedMock, TestResult
    
    profile_data = {
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'joined': user.date_joined.isoformat(),
        },
        'stats': get_user_activity_stats(user),
        'streaks': get_streaks(user),
        'insights': get_activity_insights(user),
        'purchases': [p.as_dict() for p in user.purchased_items.all()[:20]],
        'attempts': [a.as_dict() for a in user.attempted_mocks.all()[:20]],
        'test_results': [t.as_dict() for t in user.test_results_db.all()[:20]],
        'activity_history': get_user_activity_history(user, limit=50)
    }
    
    return JsonResponse({
        'ok': True,
        'profile': profile_data
    })


# =============================================================================
# ADMIN ENDPOINTS (Delete/Clear)
# =============================================================================

@csrf_exempt
@require_http_methods(["DELETE", "POST"])
def activity_delete(request):
    """
    Delete a specific activity (admin only).
    
    POST/DELETE /api/activity/delete/
    
    Body: {"activityId": 123}
    """
    user = get_user_from_request(request)
    if not user or not user.is_staff:
        return JsonResponse({'ok': False, 'error': 'Admin access required'}, status=403)
    
    data = get_json_data(request)
    activity_id = data.get('activityId')
    
    if not activity_id:
        return JsonResponse({'ok': False, 'error': 'activityId is required'}, status=400)
    
    if delete_user_activity(activity_id):
        return JsonResponse({'ok': True, 'message': 'Activity deleted'})
    else:
        return JsonResponse({'ok': False, 'error': 'Activity not found'}, status=404)


@csrf_exempt
@require_http_methods(["DELETE", "POST"])
def activity_clear_all(request):
    """
    Clear all activities for a user (admin only).
    
    POST/DELETE /api/activity/clear-all/
    
    Body: {"userId": 1, "activityType": "pdf_purchase"}
    """
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'ok': False, 'error': 'Admin access required'}, status=403)
    
    data = get_json_data(request)
    user_id = data.get('userId')
    activity_type = data.get('activityType')
    
    if not user_id:
        return JsonResponse({'ok': False, 'error': 'userId is required'}, status=400)
    
    try:
        user = User.objects.get(id=user_id)
        count = clear_user_activities(user, activity_type=activity_type)
        return JsonResponse({
            'ok': True,
            'message': f'Deleted {count} activities',
            'count': count
        })
    except User.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'User not found'}, status=404)


# =============================================================================
# CONVENIENCE SHORTCUT ENDPOINTS
# =============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def log_pdf_purchase(request):
    """Shortcut for logging PDF purchase."""
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    
    activity = log_activity(
        user=user,
        activity_type='pdf_purchase',
        title=f"Purchased: {data.get('pdfTitle', 'PDF')}",
        description=f"Company: {data.get('company', 'N/A')}",
        data=data
    )
    
    return JsonResponse({
        'ok': True if activity else False,
        'activity': activity.as_dict() if activity else None
    }, status=201 if activity else 500)


@csrf_exempt
@require_http_methods(["POST"])
def log_video_watch(request):
    """Shortcut for logging video watch."""
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    
    activity = log_activity(
        user=user,
        activity_type='video_watch',
        title=f"Watched: {data.get('videoTitle', 'Video')}",
        description=f"Duration watched: {data.get('duration', 'N/A')}",
        data=data
    )
    
    return JsonResponse({
        'ok': True if activity else False,
        'activity': activity.as_dict() if activity else None
    }, status=201 if activity else 500)


@csrf_exempt
@require_http_methods(["POST"])
def log_quiz_attempt(request):
    """Shortcut for logging quiz attempt."""
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    
    activity = log_activity(
        user=user,
        activity_type='quiz_complete',
        title=f"Completed: {data.get('quizTitle', 'Quiz')}",
        description=f"Score: {data.get('score', 'N/A')}%",
        data=data
    )
    
    return JsonResponse({
        'ok': True if activity else False,
        'activity': activity.as_dict() if activity else None
    }, status=201 if activity else 500)


@csrf_exempt
@require_http_methods(["POST"])
def log_mock_attempt(request):
    """Shortcut for logging mock test attempt."""
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    
    activity = log_activity(
        user=user,
        activity_type='mock_complete',
        title=f"Completed Mock: {data.get('mockTitle', 'Mock')}",
        description=f"Score: {data.get('score', 'N/A')}/{data.get('totalQuestions', 'N/A')}",
        data=data
    )
    
    return JsonResponse({
        'ok': True if activity else False,
        'activity': activity.as_dict() if activity else None
    }, status=201 if activity else 500)


@csrf_exempt
@require_http_methods(["POST"])
def log_interview(request):
    """Shortcut for logging interview attempt."""
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    
    activity = log_activity(
        user=user,
        activity_type='interview_complete',
        title=f"Interview: {data.get('interviewTitle', 'Interview')}",
        description=f"Performance: {data.get('performance', 'N/A')}",
        data=data
    )
    
    return JsonResponse({
        'ok': True if activity else False,
        'activity': activity.as_dict() if activity else None
    }, status=201 if activity else 500)
