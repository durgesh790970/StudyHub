/**
 * Real-Time Dashboard Activity Tracker
 * 
 * Enhanced tracking system for live dashboard updates
 * Tracks all user interactions and updates counters instantly
 */

class DashboardActivityTracker {
    constructor() {
        this.baseUrl = '/accounts/api/track';
        this.userId = this.getUserId();
        this.isOnline = navigator.onLine;
        
        // Check online/offline status
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
        
        if (this.userId) {
            this.initializeTracking();
        }
    }
    
    /**
     * Get user ID from multiple sources
     */
    getUserId() {
        // Try data attribute
        let userId = document.documentElement.getAttribute('data-user-id');
        if (userId) return userId;
        
        // Try from profile user ID in template context
        const profileUserIdEl = document.querySelector('[data-profile-user-id]');
        if (profileUserIdEl) return profileUserIdEl.getAttribute('data-profile-user-id');
        
        // Try localStorage
        userId = localStorage.getItem('userId');
        if (userId) return userId;
        
        // Try sessionStorage
        userId = sessionStorage.getItem('userId');
        if (userId) return userId;
        
        // Try from window object (set by Django template)
        if (window.currentUserId) return window.currentUserId;
        
        return null;
    }
    
    /**
     * Initialize all tracking event listeners
     */
    initializeTracking() {
        console.log('🔍 DashboardActivityTracker initialized for user:', this.userId);
        
        // Track PDF interactions
        this.setupPDFTracking();
        
        // Track Video interactions
        this.setupVideoTracking();
        
        // Track Quiz interactions  
        this.setupQuizTracking();
        
        // Track Interview interactions
        this.setupInterviewTracking();
        
        // Track Mock Test interactions
        this.setupMockTracking();
        
        // Track Test Submission
        this.setupTestSubmissionTracking();
        
        // Load and display current stats
        this.loadAndDisplayStats();
    }
    
    // ====================================================================
    // PDF TRACKING
    // ====================================================================
    
    setupPDFTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest(
                'a[href*=".pdf"],' +
                '.pdf-btn,' +
                '.pdf-download,' +
                '[data-action="open-pdf"],' +
                '.open-pdf-btn,' +
                'button[data-pdf-id]'
            );
            
            if (!target) return;
            
            const pdfData = {
                pdfId: target.getAttribute('data-pdf-id') || '',
                pdfTitle: target.getAttribute('data-pdf-title') || 
                         target.getAttribute('title') ||
                         target.textContent.trim() || 
                         'PDF Document',
                company: target.getAttribute('data-company') || 'Unknown'
            };
            
            this.trackPDFOpened(pdfData);
        }, true);
    }
    
    async trackPDFOpened(data) {
        return this.makeRequest('/pdf-opened/', data, '📄 PDF');
    }
    
    // ====================================================================
    // VIDEO TRACKING  
    // ====================================================================
    
    setupVideoTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest(
                '.video-play-btn,' +
                '.watch-video,' +
                'button[data-video-id],' +
                '[data-action="watch-video"],' +
                '.play-video-btn'
            );
            
            if (!target) return;
            
            const videoData = {
                videoId: target.getAttribute('data-video-id') || '',
                videoTitle: target.getAttribute('data-video-title') ||
                           target.getAttribute('title') ||
                           target.textContent.trim() ||
                           'Video',
                duration: target.getAttribute('data-duration') || 0
            };
            
            this.trackVideoWatched(videoData);
        }, true);
    }
    
    async trackVideoWatched(data) {
        return this.makeRequest('/video-watched/', data, '📹 Video');
    }
    
    // ====================================================================
    // QUIZ TRACKING
    // ====================================================================
    
    setupQuizTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest(
                '.quiz-btn,' +
                '.start-test,' +
                '.aptitude-start,' +
                '.technical-start,' +
                '.hr-start,' +
                'button[data-quiz-id],' +
                '[data-action="start-quiz"]'
            );
            
            if (!target) return;
            
            const quizData = {
                quizId: target.getAttribute('data-quiz-id') || '',
                quizTitle: target.getAttribute('data-quiz-title') ||
                          target.textContent.trim() ||
                          'Quiz',
                quizType: this.detectQuizType(target),
                difficulty: target.getAttribute('data-difficulty') || 'medium'
            };
            
            this.trackQuizAttempted(quizData);
        }, true);
    }
    
    detectQuizType(element) {
        const text = element.textContent.toLowerCase();
        const dataType = element.getAttribute('data-quiz-type');
        
        if (dataType) return dataType;
        if (text.includes('aptitude')) return 'aptitude';
        if (text.includes('technical')) return 'technical';
        if (text.includes('hr')) return 'hr';
        
        return 'general';
    }
    
    async trackQuizAttempted(data) {
        return this.makeRequest('/quiz-attempted/', data, '❓ Quiz');
    }
    
    async trackQuizCompleted(data) {
        return this.makeRequest('/quiz-completed/', data, '✅ Quiz Completed');
    }
    
    // ====================================================================
    // INTERVIEW TRACKING
    // ====================================================================
    
    setupInterviewTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest(
                '.interview-btn,' +
                '.start-interview,' +
                'button[data-interview-id],' +
                '[data-action="start-interview"]'
            );
            
            if (!target) return;
            
            const interviewData = {
                interviewId: target.getAttribute('data-interview-id') || '',
                interviewTitle: target.getAttribute('data-interview-title') ||
                               target.textContent.trim() ||
                               'Mock Interview',
                company: target.getAttribute('data-company') || 'Unknown',
                duration: target.getAttribute('data-duration') || 1800
            };
            
            this.trackInterviewStarted(interviewData);
        }, true);
    }
    
    async trackInterviewStarted(data) {
        return this.makeRequest('/interview-started/', data, '🎤 Interview');
    }
    
    // ====================================================================
    // MOCK TEST TRACKING
    // ====================================================================
    
    setupMockTracking() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest(
                '.mock-btn,' +
                '.start-mock,' +
                'button[data-mock-id],' +
                '[data-action="start-mock"]'
            );
            
            if (!target) return;
            
            const mockData = {
                mockId: target.getAttribute('data-mock-id') || '',
                mockTitle: target.getAttribute('data-mock-title') ||
                          target.textContent.trim() ||
                          'Mock Test',
                company: target.getAttribute('data-company') || 'Unknown',
                difficulty: target.getAttribute('data-difficulty') || 'medium'
            };
            
            this.trackMockAttempted(mockData);
        }, true);
    }
    
    async trackMockAttempted(data) {
        return this.makeRequest('/mock-attempted/', data, '🎯 Mock Test');
    }
    
    async trackMockCompleted(data) {
        return this.makeRequest('/mock-completed/', data, '🎯 Mock Test Completed');
    }
    
    // ====================================================================
    // TEST SUBMISSION TRACKING
    // ====================================================================
    
    setupTestSubmissionTracking() {
        // Listen for custom test submission event
        window.addEventListener('testSubmitted', (e) => {
            const data = e.detail || {};
            this.trackTestSubmitted(data);
        });
        
        // Also hook into form submissions with test data
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.getAttribute('data-test-form')) {
                const testData = {
                    testId: form.getAttribute('data-test-id') || '',
                    testName: form.getAttribute('data-test-name') || 'Test',
                    company: form.getAttribute('data-company') || '',
                    difficulty: form.getAttribute('data-difficulty') || '',
                    totalQuestions: parseInt(form.getAttribute('data-total-questions')) || 0,
                    correctAnswers: parseInt(form.getAttribute('data-correct-answers')) || 0,
                    score: parseInt(form.getAttribute('data-score')) || 0,
                    timeTaken: form.getAttribute('data-time-taken') || ''
                };
                
                this.trackTestSubmitted(testData);
            }
        }, true);
    }
    
    async trackTestSubmitted(data) {
        return this.makeRequest('/test-submitted/', data, '🏆 Test Submitted');
    }
    
    // ====================================================================
    // CORE API METHODS
    // ====================================================================
    
    /**
     * Make API request to track activity
     */
    async makeRequest(endpoint, data, label) {
        if (!this.userId) {
            console.warn('No user ID available for tracking');
            return;
        }
        
        try {
            const url = `${this.baseUrl}${endpoint}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                console.error(`❌ ${label} tracking failed:`, response.status);
                this.showToast(`Failed to track ${label}`, 'error');
                return null;
            }
            
            const result = await response.json();
            
            if (result.ok) {
                console.log(`✅ ${label} tracked:`, data);
                
                // Update dashboard if stats provided
                if (result.stats) {
                    this.updateDashboardStats(result.stats);
                }
                
                this.showToast(`${label} recorded! ✓`);
                return result;
            } else {
                console.error(`❌ ${label} error:`, result.error);
                this.showToast(`Error: ${result.error}`, 'error');
                return null;
            }
            
        } catch (error) {
            console.error(`❌ ${label} tracking error:`, error);
            this.showToast(`Network error: ${error.message}`, 'error');
            return null;
        }
    }
    
    /**
     * Get current activity stats
     */
    async getStats() {
        if (!this.userId) return null;
        
        try {
            const response = await fetch(`${this.baseUrl}/stats/?userId=${this.userId}`);
            if (!response.ok) return null;
            
            const result = await response.json();
            return result.ok ? result.stats : null;
        } catch (error) {
            console.error('Error fetching stats:', error);
            return null;
        }
    }
    
    /**
     * Load and display current stats on page load
     */
    async loadAndDisplayStats() {
        const stats = await this.getStats();
        if (stats) {
            this.updateDashboardStats(stats);
        }
    }
    
    /**
     * Update dashboard counter displays
     */
    updateDashboardStats(stats) {
        if (!stats) return;
        
        const updates = [
            { stat: 'pdfs_purchased', selector: '[data-stat-pdfs], #stat-pdfs-count' },
            { stat: 'videos_watched', selector: '[data-stat-videos], #stat-videos-count' },
            { stat: 'quizzes_attempted', selector: '[data-stat-quizzes], #stat-quizzes-count' },
            { stat: 'interviews_given', selector: '[data-stat-interviews], #stat-interviews-count' },
            { stat: 'tests_submitted', selector: '[data-stat-tests], #stat-tests-count' },
            { stat: 'mock_tests_attempted', selector: '[data-stat-mocks], #stat-mocks-count' },
        ];
        
        updates.forEach(({ stat, selector }) => {
            const elements = document.querySelectorAll(selector);
            const value = stats[stat] || 0;
            
            elements.forEach(el => {
                const oldValue = parseInt(el.textContent) || 0;
                el.textContent = value;
                
                // Animate if value changed
                if (value > oldValue) {
                    el.classList.add('stat-updated');
                    setTimeout(() => el.classList.remove('stat-updated'), 600);
                }
            });
        });
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        // Check if a toast container already exists
        let container = document.getElementById('activity-toast-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'activity-toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 350px;
            `;
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `;
        
        if (type === 'success') {
            toast.style.backgroundColor = '#4caf50';
            toast.style.color = 'white';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#f44336';
            toast.style.color = 'white';
        } else {
            toast.style.backgroundColor = '#2196f3';
            toast.style.color = 'white';
        }
        
        toast.textContent = message;
        container.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboardActivityTracker = new DashboardActivityTracker();
    });
} else {
    window.dashboardActivityTracker = new DashboardActivityTracker();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardActivityTracker;
}
