const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validatePurchase,
  validateQuizSubmission,
  validateTestSubmission,
  validateInterviewSubmission,
  validateVideoWatch,
  validateProfileUpdate,
  checkDuplicateTransaction,
} = require('../middleware/validation');
const authController = require('../controllers/authController');
const purchaseController = require('../controllers/purchaseController');
const quizController = require('../controllers/quizController');
const testController = require('../controllers/testController');
const interviewController = require('../controllers/interviewController');
const profileController = require('../controllers/profileController');

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
  });
});

router.post('/auth/register', validateRegister, authController.register);
router.post('/auth/login', validateLogin, authController.login);
router.get('/auth/me', protect, authController.getMe);

router.get('/user/profile', protect, profileController.getMyProfile);
router.put('/user/profile', protect, validateProfileUpdate, profileController.updateMyProfile);
router.get('/user/dashboard', protect, profileController.getMyDashboard);
router.get('/user/activities', protect, profileController.getMyActivities);
router.get('/user/activity-summary', protect, profileController.getMyActivitySummary);
router.post('/video/watch', protect, validateVideoWatch, profileController.logMyVideoWatch);

router.post('/purchase', protect, validatePurchase, checkDuplicateTransaction, purchaseController.createPurchase);
router.get('/purchase', protect, purchaseController.getMyPurchases);
router.get('/purchase/:purchaseId', protect, purchaseController.getPurchaseDetails);
router.get('/purchase/statistics/me', protect, purchaseController.getMyPurchaseStatistics);

router.post('/quiz/submit', protect, validateQuizSubmission, quizController.submitQuiz);
router.get('/quiz/results', protect, quizController.getMyQuizResults);
router.get('/quiz/result/:resultId', protect, quizController.getQuizResultDetails);
router.get('/quiz/statistics/me', protect, quizController.getMyQuizStatistics);

router.post('/test/submit', protect, validateTestSubmission, testController.submitTest);
router.get('/test/results', protect, testController.getMyTestResults);
router.get('/test/result/:resultId', protect, testController.getTestResultDetails);
router.get('/test/statistics/me', protect, testController.getMyTestStatistics);

router.post('/interview/submit', protect, validateInterviewSubmission, interviewController.submitInterview);
router.get('/interview/results', protect, interviewController.getMyInterviews);
router.get('/interview/result/:resultId', protect, interviewController.getInterviewDetails);
router.get('/interview/statistics/me', protect, interviewController.getMyInterviewStatistics);
router.put('/interview/:interviewId', protect, authorize('admin', 'instructor'), interviewController.updateInterviewFeedback);

// Public endpoint for sending interview feedback (no auth required)
router.post('/send-feedback', interviewController.sendFeedback);

module.exports = router;
