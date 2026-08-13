"""
Enhanced Activity Tracker - Complete activity tracking system for real-time dashboard updates
Handles all user interactions: PDFs, Videos, Quizzes, Interviews, Tests, Mocks
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.db import transaction

from .models import UserActivity, TestResult, PurchasedItem
from .activity_utils import get_user_activity_stats, get_user_activity_history


def get_user_from_request(request):
    """Extract user from request (session, token, or userId parameter)."""
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
    
    # Try Bearer token from Authorization header
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        # TODO: Implement JWT token verification if needed
        pass
    
    return None


def get_json_data(request):
    """Parse JSON data from request body."""
    try:
        return json.loads(request.body.decode('utf-8'))
    except:
        return {}


# =============================================================================
# CORE TRACKING ENDPOINTS
# =============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def track_pdf_opened(request):
    """
    Track when a user opens/clicks a PDF.
    Increments 'PDFs Purchased' counter.
    
    POST /api/track/pdf-opened/
    Body: {
        "pdfId": 1,
        "pdfTitle": "Google DSA Problems",
        "company": "Google"
    }
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    pdf_id = data.get('pdfId', '')
    pdf_title = data.get('pdfTitle', 'PDF')
    company = data.get('company', 'Unknown')
    
    try:
        with transaction.atomic():
            # Log the activity
            activity = UserActivity.objects.create(
                user=user,
                activity_type='pdf_view',
                title=f'{pdf_title}',
                description=f'User opened PDF from {company}',
                data={
                    'pdfId': pdf_id,
                    'pdfTitle': pdf_title,
                    'company': company
                }
            )
            
            # Get updated stats
            stats = get_user_activity_stats(user)
            
            return JsonResponse({
                'ok': True,
                'message': 'PDF view tracked',
                'activity': activity.as_dict(),
                'stats': stats
            }, status=201)
    
    except Exception as e:
        print(f"Error tracking PDF: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def track_video_watched(request):
    """
    Track when a user watches a video.
    Increments 'Videos Watched' counter.
    
    POST /api/track/video-watched/
    Body: {
        "videoId": "dQw4w9WgXcQ",
        "videoTitle": "DSA Fundamentals",
        "duration": 1200
    }
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    video_id = data.get('videoId', '')
    video_title = data.get('videoTitle', 'Video')
    duration = data.get('duration', 0)
    
    try:
        with transaction.atomic():
            # Log the activity
            activity = UserActivity.objects.create(
                user=user,
                activity_type='video_watch',
                title=f'{video_title}',
                description=f'User watched video',
                data={
                    'videoId': video_id,
                    'videoTitle': video_title,
                    'duration': duration
                }
            )
            
            # Get updated stats
            stats = get_user_activity_stats(user)
            
            return JsonResponse({
                'ok': True,
                'message': 'Video watch tracked',
                'activity': activity.as_dict(),
                'stats': stats
            }, status=201)
    
    except Exception as e:
        print(f"Error tracking video: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def track_quiz_attempted(request):
    """
    Track when a user starts/attempts a quiz.
    Increments 'Quizzes Attempted' counter.
    
    POST /api/track/quiz-attempted/
    Body: {
        "quizId": 1,
        "quizTitle": "Google Aptitude Test",
        "quizType": "aptitude",
        "difficulty": "medium"
    }
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    quiz_id = data.get('quizId', '')
    quiz_title = data.get('quizTitle', 'Quiz')
    quiz_type = data.get('quizType', 'general')
    difficulty = data.get('difficulty', 'medium')
    
    try:
        with transaction.atomic():
            # Log the activity
            activity = UserActivity.objects.create(
                user=user,
                activity_type='quiz_attempt',
                title=f'{quiz_title}',
                description=f'User started {quiz_type} quiz',
                data={
                    'quizId': quiz_id,
                    'quizTitle': quiz_title,
                    'quizType': quiz_type,
                    'difficulty': difficulty
                }
            )
            
            # Get updated stats
            stats = get_user_activity_stats(user)
            
            return JsonResponse({
                'ok': True,
                'message': 'Quiz attempt tracked',
                'activity': activity.as_dict(),
                'stats': stats
            }, status=201)
    
    except Exception as e:
        print(f"Error tracking quiz: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def track_quiz_completed(request):
    """
    Track when a user completes a quiz.
    Increments 'Quizzes Attempted' counter (if not already tracked).
    
    POST /api/track/quiz-completed/
    Body: {
        "quizId": 1,
        "quizTitle": "Google Aptitude Test",
        "score": 85,
        "totalQuestions": 20,
        "correctAnswers": 17
    }
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    quiz_id = data.get('quizId', '')
    quiz_title = data.get('quizTitle', 'Quiz')
    score = data.get('score', 0)
    total_questions = data.get('totalQuestions', 0)
    correct_answers = data.get('correctAnswers', 0)
    
    try:
        with transaction.atomic():
            # Log the activity
            activity = UserActivity.objects.create(
                user=user,
                activity_type='quiz_complete',
                title=f'{quiz_title}',
                description=f'User completed quiz with score {score}%',
                data={
                    'quizId': quiz_id,
                    'quizTitle': quiz_title,
                    'score': score,
                    'totalQuestions': total_questions,
                    'correctAnswers': correct_answers
                }
            )
            
            # Get updated stats
            stats = get_user_activity_stats(user)
            
            return JsonResponse({
                'ok': True,
                'message': 'Quiz completion tracked',
                'activity': activity.as_dict(),
                'stats': stats
            }, status=201)
    
    except Exception as e:
        print(f"Error tracking quiz completion: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def track_interview_started(request):
    """
    Track when a user starts an interview.
    Increments 'Interviews Given' counter.
    
    POST /api/track/interview-started/
    Body: {
        "interviewId": 1,
        "interviewTitle": "Mock Interview - Google",
        "company": "Google",
        "duration": 1800
    }
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    interview_id = data.get('interviewId', '')
    interview_title = data.get('interviewTitle', 'Interview')
    company = data.get('company', 'Unknown')
    duration = data.get('duration', 0)
    
    try:
        with transaction.atomic():
            # Log the activity
            activity = UserActivity.objects.create(
                user=user,
                activity_type='interview_attempt',
                title=f'{interview_title}',
                description=f'User started mock interview for {company}',
                data={
                    'interviewId': interview_id,
                    'interviewTitle': interview_title,
                    'company': company,
                    'duration': duration
                }
            )
            
            # Get updated stats
            stats = get_user_activity_stats(user)
            
            return JsonResponse({
                'ok': True,
                'message': 'Interview start tracked',
                'activity': activity.as_dict(),
                'stats': stats
            }, status=201)
    
    except Exception as e:
        print(f"Error tracking interview: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def track_test_submitted(request):
    """
    Track when a user submits a test.
    Increments 'Tests Submitted' counter.
    
    POST /api/track/test-submitted/
    Body: {
        "testId": 1,
        "testName": "Google - Medium",
        "company": "google",
        "difficulty": "medium",
        "totalQuestions": 20,
        "correctAnswers": 16,
        "score": 80,
        "timeTaken": "15:30"
    }
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    test_id = data.get('testId', '')
    test_name = data.get('testName', 'Test')
    company = data.get('company', '')
    difficulty = data.get('difficulty', '')
    total_questions = data.get('totalQuestions', 0)
    correct_answers = data.get('correctAnswers', 0)
    score = data.get('score', 0)
    time_taken = data.get('timeTaken', '')
    
    try:
        with transaction.atomic():
            # Create TestResult record
            test_result = TestResult.objects.create(
                user=user,
                test_name=test_name,
                company=company,
                difficulty=difficulty,
                total_questions=total_questions,
                correct_answers=correct_answers,
                score=score,
                time_taken=time_taken
            )
            
            # Log the activity
            activity = UserActivity.objects.create(
                user=user,
                activity_type='test_submit',
                title=f'{test_name}',
                description=f'User submitted test with score {score}%',
                data={
                    'testId': test_id,
                    'testName': test_name,
                    'company': company,
                    'difficulty': difficulty,
                    'score': score,
                    'timeTaken': time_taken,
                    'testResultId': test_result.id
                }
            )
            
            # Get updated stats
            stats = get_user_activity_stats(user)
            
            return JsonResponse({
                'ok': True,
                'message': 'Test submission tracked',
                'activity': activity.as_dict(),
                'testResult': test_result.as_dict(),
                'stats': stats
            }, status=201)
    
    except Exception as e:
        print(f"Error tracking test submission: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def track_mock_attempted(request):
    """
    Track when a user attempts a mock test.
    Increments 'Mocks Attempted' counter.
    
    POST /api/track/mock-attempted/
    Body: {
        "mockId": 1,
        "mockTitle": "TCS Mock Test",
        "company": "tcs",
        "difficulty": "easy"
    }
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    mock_id = data.get('mockId', '')
    mock_title = data.get('mockTitle', 'Mock Test')
    company = data.get('company', 'Unknown')
    difficulty = data.get('difficulty', 'medium')
    
    try:
        with transaction.atomic():
            # Log the activity
            activity = UserActivity.objects.create(
                user=user,
                activity_type='mock_attempt',
                title=f'{mock_title}',
                description=f'User started mock test for {company}',
                data={
                    'mockId': mock_id,
                    'mockTitle': mock_title,
                    'company': company,
                    'difficulty': difficulty
                }
            )
            
            # Get updated stats
            stats = get_user_activity_stats(user)
            
            return JsonResponse({
                'ok': True,
                'message': 'Mock attempt tracked',
                'activity': activity.as_dict(),
                'stats': stats
            }, status=201)
    
    except Exception as e:
        print(f"Error tracking mock: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def track_mock_completed(request):
    """
    Track when a user completes a mock test.
    
    POST /api/track/mock-completed/
    Body: {
        "mockId": 1,
        "mockTitle": "TCS Mock Test",
        "score": 75,
        "totalQuestions": 30,
        "correctAnswers": 23
    }
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    data = get_json_data(request)
    mock_id = data.get('mockId', '')
    mock_title = data.get('mockTitle', 'Mock Test')
    score = data.get('score', 0)
    total_questions = data.get('totalQuestions', 0)
    correct_answers = data.get('correctAnswers', 0)
    
    try:
        with transaction.atomic():
            # Log the activity
            activity = UserActivity.objects.create(
                user=user,
                activity_type='mock_complete',
                title=f'{mock_title}',
                description=f'User completed mock test with score {score}%',
                data={
                    'mockId': mock_id,
                    'mockTitle': mock_title,
                    'score': score,
                    'totalQuestions': total_questions,
                    'correctAnswers': correct_answers
                }
            )
            
            # Get updated stats
            stats = get_user_activity_stats(user)
            
            return JsonResponse({
                'ok': True,
                'message': 'Mock completion tracked',
                'activity': activity.as_dict(),
                'stats': stats
            }, status=201)
    
    except Exception as e:
        print(f"Error tracking mock completion: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)


# =============================================================================
# STATS & HISTORY ENDPOINTS
# =============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def get_activity_stats(request):
    """
    Get current activity statistics for the user.
    
    GET /api/activity/get-stats/?userId=1
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
def get_activity_history_api(request):
    """
    Get activity history for the user.
    
    GET /api/activity/get-history/?limit=50&offset=0&activityType=pdf_view
    """
    user = get_user_from_request(request)
    if not user:
        return JsonResponse({'ok': False, 'error': 'Not authenticated'}, status=401)
    
    limit = int(request.GET.get('limit', 50))
    offset = int(request.GET.get('offset', 0))
    activity_type = request.GET.get('activityType', None)
    
    # Validate limit
    if limit > 500:
        limit = 500
    
    history = get_user_activity_history(user, limit=limit, activity_type=activity_type, offset=offset)
    
    return JsonResponse({
        'ok': True,
        'history': history
    })


@csrf_exempt
@require_http_methods(["POST"])
def reset_activity_stats(request):
    """
    Admin endpoint to reset activity statistics for a user.
    Should only be accessible by admin users.
    
    POST /api/activity/reset-stats/
    Body: {
        "userId": 1,
        "adminToken": "secret-token"
    }
    """
    # Only allow admin users
    if not request.user.is_authenticated or not request.user.is_staff:
        return JsonResponse({'ok': False, 'error': 'Admin access required'}, status=403)
    
    data = get_json_data(request)
    user_id = data.get('userId')
    
    if not user_id:
        return JsonResponse({'ok': False, 'error': 'userId is required'}, status=400)
    
    try:
        user = User.objects.get(id=user_id)
        # Delete all activities for this user
        deleted_count, _ = user.activities.all().delete()
        
        return JsonResponse({
            'ok': True,
            'message': f'Deleted {deleted_count} activity records for user {user.username}'
        })
    except User.DoesNotExist:
        return JsonResponse({'ok': False, 'error': 'User not found'}, status=404)
    except Exception as e:
        print(f"Error resetting activities: {e}")
        return JsonResponse({'ok': False, 'error': str(e)}, status=500)
