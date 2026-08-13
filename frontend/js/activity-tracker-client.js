/**
 * Activity Tracker - JavaScript Client for User Activity Tracking
 * Centralized module for tracking all user activities across the application
 */

class ActivityTrackerClient {
    constructor(baseUrl = '', userId = null) {
        this.baseUrl = baseUrl || '/api';
        this.userId = userId || this.getUserId();
    }

    /**
     * Get user ID from localStorage, sessionStorage, or DOM
     */
    getUserId() {
        // Try localStorage first
        let userId = localStorage.getItem('userId');
        if (userId) return userId;
        
        // Try sessionStorage
        userId = sessionStorage.getItem('userId');
        if (userId) return userId;
        
        // Try to get from DOM (data attribute)
        const userEl = document.getElementById('user-id');
        if (userEl) return userEl.dataset.userId;
        
        // Try to extract from URL or other places
        const urlParams = new URLSearchParams(window.location.search);
        userId = urlParams.get('userId');
        if (userId) return userId;
        
        return null;
    }

    /**
     * Make API request
     */
    async apiRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCsrfToken()
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error(`API error on ${endpoint}:`, error);
            return { ok: false, error: error.message };
        }
    }

    /**
     * Get CSRF token from cookies
     */
    getCsrfToken() {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue || '';
    }

    /**
     * Log any generic activity
     */
    async logActivity(activityType, title = '', description = '', data = {}) {
        if (!this.userId) {
            console.warn('No user ID available for activity logging');
            return { ok: false, error: 'No user ID' };
        }

        return await this.apiRequest('/activity/log/', 'POST', {
            userId: parseInt(this.userId),
            activityType: activityType,
            title: title,
            description: description,
            data: data
        });
    }

    /**
     * Log PDF purchase
     */
    async logPdfPurchase(pdfId, pdfTitle, company = '', amount = 0, transactionId = '') {
        return await this.logActivity(
            'pdf_purchase',
            `Purchased: ${pdfTitle}`,
            `Company: ${company}`,
            {
                pdfId: pdfId,
                pdfTitle: pdfTitle,
                company: company,
                amount: amount,
                transactionId: transactionId,
                timestamp: new Date().toISOString()
            }
        );
    }

    /**
     * Log video watch
     */
    async logVideoWatch(videoId, videoTitle, durationWatched = 0, totalDuration = 0) {
        return await this.logActivity(
            'video_watch',
            `Watched: ${videoTitle}`,
            `Duration: ${durationWatched}/${totalDuration}s`,
            {
                videoId: videoId,
                videoTitle: videoTitle,
                durationWatched: durationWatched,
                totalDuration: totalDuration,
                timestamp: new Date().toISOString()
            }
        );
    }

    /**
     * Log test submission
     */
    async logTestSubmission(testName, company = '', difficulty = '', score = 0, totalQuestions = 0, correctAnswers = 0, timeTaken = 0) {
        return await this.logActivity(
            'quiz_complete',
            `Completed: ${testName}`,
            `Score: ${correctAnswers}/${totalQuestions} (${score}%)`,
            {
                testName: testName,
                company: company,
                difficulty: difficulty,
                score: score,
                totalQuestions: totalQuestions,
                correctAnswers: correctAnswers,
                timeTaken: timeTaken,
                timestamp: new Date().toISOString()
            }
        );
    }

    /**
     * Log mock test attempt
     */
    async logMockAttempt(mockId, mockTitle, score = 0, totalQuestions = 0, correctAnswers = 0, duration = 0) {
        return await this.logActivity(
            'mock_complete',
            `Completed Mock: ${mockTitle}`,
            `Score: ${correctAnswers}/${totalQuestions}`,
            {
                mockId: mockId,
                mockTitle: mockTitle,
                score: score,
                totalQuestions: totalQuestions,
                correctAnswers: correctAnswers,
                duration: duration,
                timestamp: new Date().toISOString()
            }
        );
    }

    /**
     * Log quiz attempt
     */
    async logQuizAttempt(quizId, quizTitle, quizType = 'technical', score = 0, totalQuestions = 0) {
        return await this.logActivity(
            'quiz_complete',
            `Completed Quiz: ${quizTitle}`,
            `Type: ${quizType} - Score: ${score}/${totalQuestions}`,
            {
                quizId: quizId,
                quizTitle: quizTitle,
                quizType: quizType,
                score: score,
                totalQuestions: totalQuestions,
                timestamp: new Date().toISOString()
            }
        );
    }

    /**
     * Log interview attempt
     */
    async logInterviewAttempt(interviewId, interviewTitle, performance = 'pending', feedback = '') {
        return await this.logActivity(
            'interview_complete',
            `Interview: ${interviewTitle}`,
            `Performance: ${performance}`,
            {
                interviewId: interviewId,
                interviewTitle: interviewTitle,
                performance: performance,
                feedback: feedback,
                timestamp: new Date().toISOString()
            }
        );
    }

    /**
     * Log login
     */
    async logLogin() {
        return await this.logActivity(
            'login',
            'User Logged In',
            'User successfully logged in to the platform'
        );
    }

    /**
     * Log logout
     */
    async logLogout() {
        return await this.logActivity(
            'logout',
            'User Logged Out',
            'User logged out from the platform'
        );
    }

    /**
     * Log profile update
     */
    async logProfileUpdate(updateType = '', details = {}) {
        return await this.logActivity(
            'profile_update',
            `Updated Profile: ${updateType}`,
            `Changes: ${JSON.stringify(details)}`,
            details
        );
    }

    /**
     * Get user activity stats
     */
    async getStats() {
        if (!this.userId) {
            console.warn('No user ID available');
            return { ok: false };
        }
        return await this.apiRequest(`/activity/stats/?userId=${this.userId}`);
    }

    /**
     * Get activity history
     */
    async getHistory(limit = 50, offset = 0, activityType = null) {
        if (!this.userId) {
            console.warn('No user ID available');
            return { ok: false };
        }
        
        let endpoint = `/activity/history/?userId=${this.userId}&limit=${limit}&offset=${offset}`;
        if (activityType) {
            endpoint += `&activityType=${activityType}`;
        }
        
        return await this.apiRequest(endpoint);
    }

    /**
     * Get activity insights
     */
    async getInsights() {
        if (!this.userId) {
            console.warn('No user ID available');
            return { ok: false };
        }
        return await this.apiRequest(`/activity/insights/?userId=${this.userId}`);
    }

    /**
     * Get login streaks
     */
    async getStreaks() {
        if (!this.userId) {
            console.warn('No user ID available');
            return { ok: false };
        }
        return await this.apiRequest(`/activity/streaks/?userId=${this.userId}`);
    }

    /**
     * Get complete dashboard data
     */
    async getDashboard(limit = 20) {
        if (!this.userId) {
            console.warn('No user ID available');
            return { ok: false };
        }
        return await this.apiRequest(`/activity/dashboard/?userId=${this.userId}&limit=${limit}`);
    }

    /**
     * Get activities by type
     */
    async getActivitiesByType(type, limit = 20) {
        if (!this.userId) {
            console.warn('No user ID available');
            return { ok: false };
        }
        return await this.apiRequest(`/activity/by-type/?userId=${this.userId}&type=${type}&limit=${limit}`);
    }
}

// Initialize global instance
window.activityTracker = new ActivityTrackerClient();

// Auto-log login on page load (if user is authenticated)
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userId = window.activityTracker.getUserId();
    if (userId && sessionStorage.getItem('just_logged_in')) {
        window.activityTracker.logLogin();
        sessionStorage.removeItem('just_logged_in');
    }
});

// Log logout on page unload if needed
window.addEventListener('beforeunload', function(e) {
    // Optional: log logout on page leave
    // window.activityTracker.logLogout();
});

// Export for use in modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivityTrackerClient;
}
