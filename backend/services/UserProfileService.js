const User = require('../models/User');
const Purchase = require('../models/Purchase');
const QuizResult = require('../models/QuizResult');
const TestResult = require('../models/TestResult');
const Interview = require('../models/Interview');
const ActivityLog = require('../models/ActivityLog');
const { emitToUser } = require('../socket/socketHandler');

const averageOrZero = (items, field) => {
  if (!items.length) {
    return 0;
  }
  const total = items.reduce((sum, item) => sum + Number(item[field] || 0), 0);
  return Number((total / items.length).toFixed(2));
};

class UserProfileService {
  static async syncUserStats(userId) {
    const [
      purchases,
      quizzes,
      tests,
      interviews,
      videoLogs,
      mockTests,
    ] = await Promise.all([
      Purchase.find({ userId, paymentStatus: 'completed' }).lean(),
      QuizResult.find({ userId }).lean(),
      TestResult.find({ userId }).lean(),
      Interview.find({ userId }).lean(),
      ActivityLog.find({ userId, activityType: 'VIDEO_WATCHED' }).lean(),
      TestResult.find({ userId, testType: 'Mock Test' }).lean(),
    ]);

    const stats = {
      totalPDFsPurchased: purchases.length,
      totalMockTestsAttempted: mockTests.length,
      totalQuizzesAttempted: quizzes.length,
      totalTestsSubmitted: tests.length,
      totalVideosWatched: videoLogs.length,
      totalInterviewsGiven: interviews.length,
      averageQuizScore: averageOrZero(quizzes, 'percentage'),
      averageTestScore: averageOrZero(tests, 'percentage'),
      totalSpentAmount: Number(
        purchases.reduce((sum, purchase) => sum + Number(purchase.amount || 0), 0).toFixed(2)
      ),
    };

    await User.findByIdAndUpdate(
      userId,
      {
        $set: { stats },
      },
      { new: true, runValidators: true }
    );

    return stats;
  }

  static async getUserProfile(userId) {
    const [user, stats, purchases, quizzes, tests, interviews, activities] = await Promise.all([
      User.findById(userId).select('-password').lean(),
      this.syncUserStats(userId),
      Purchase.find({ userId, paymentStatus: 'completed' }).sort({ purchasedAt: -1 }).lean(),
      QuizResult.find({ userId }).sort({ submittedAt: -1 }).lean(),
      TestResult.find({ userId }).sort({ submittedAt: -1 }).lean(),
      Interview.find({ userId }).sort({ completedAt: -1 }).lean(),
      ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(50).lean(),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      user,
      stats,
      purchases,
      quizzes,
      tests,
      interviews,
      activities,
    };
  }

  static async getUserDashboard(userId) {
    const profile = await this.getUserProfile(userId);
    return {
      user: profile.user,
      stats: profile.stats,
      recent: {
        purchases: profile.purchases.slice(0, 5),
        quizzes: profile.quizzes.slice(0, 5),
        tests: profile.tests.slice(0, 5),
        interviews: profile.interviews.slice(0, 5),
        activities: profile.activities.slice(0, 10),
      },
    };
  }

  static async emitRealtimeProfileUpdate(userId, event, payload = {}) {
    const dashboard = await this.getUserDashboard(userId);
    emitToUser(userId, 'profile:refresh', {
      event,
      dashboard,
      payload,
      timestamp: new Date().toISOString(),
    });
    return dashboard;
  }
}

module.exports = UserProfileService;
