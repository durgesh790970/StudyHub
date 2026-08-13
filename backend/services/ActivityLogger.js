const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');

class ActivityLogger {
  static async log(userId, activityType, description, extra = {}) {
    const activity = await ActivityLog.create({
      userId,
      activityType,
      description,
      details: extra.details || {},
      resourceType: extra.resourceType,
      resourceId: extra.resourceId,
      resourceName: extra.resourceName,
      pdfPurchaseId: extra.pdfPurchaseId,
      quizResultId: extra.quizResultId,
      testResultId: extra.testResultId,
      interviewId: extra.interviewId,
      score: extra.score,
      status: extra.status || 'success',
      duration: extra.duration,
      result: extra.result,
      resultValue: extra.resultValue,
      timestamp: extra.timestamp || new Date(),
    });

    return activity.toObject ? activity.toObject() : activity;
  }

  static async logPDFPurchase(userId, purchase) {
    return this.log(userId, 'PDF_PURCHASED', `Purchased PDF "${purchase.pdfName}"`, {
      resourceType: 'PDF',
      resourceId: purchase._id,
      resourceName: purchase.pdfName,
      pdfPurchaseId: purchase._id,
      score: purchase.amount,
      resultValue: purchase.amount,
      details: {
        amount: purchase.amount,
        transactionId: purchase.transactionId,
        purchasedAt: purchase.purchasedAt,
      },
    });
  }

  static async logQuizCompletion(userId, quizResult) {
    return this.log(userId, 'QUIZ_COMPLETED', `Completed quiz "${quizResult.quizName}"`, {
      resourceType: 'Quiz',
      resourceId: quizResult._id,
      resourceName: quizResult.quizName,
      quizResultId: quizResult._id,
      score: quizResult.score,
      result: quizResult.result,
      resultValue: quizResult.percentage,
      details: {
        maxScore: quizResult.maxScore,
        submittedAt: quizResult.submittedAt,
      },
    });
  }

  static async logTestCompletion(userId, testResult) {
    return this.log(userId, 'TEST_COMPLETED', `Submitted test "${testResult.testName}"`, {
      resourceType: 'Test',
      resourceId: testResult._id,
      resourceName: testResult.testName,
      testResultId: testResult._id,
      score: testResult.score,
      result: testResult.result,
      resultValue: testResult.percentage,
      details: {
        maxScore: testResult.maxScore,
        submittedAt: testResult.submittedAt,
        testType: testResult.testType,
      },
    });
  }

  static async logInterviewCompletion(userId, interview) {
    return this.log(userId, 'INTERVIEW_COMPLETED', `Completed interview "${interview.title}"`, {
      resourceType: 'Interview',
      resourceId: interview._id,
      resourceName: interview.title,
      interviewId: interview._id,
      score: interview.score,
      result: interview.result,
      resultValue: interview.percentage,
      details: {
        completedAt: interview.completedAt,
        interviewType: interview.interviewType,
      },
    });
  }

  static async logVideoWatch(userId, payload) {
    return this.log(userId, 'VIDEO_WATCHED', `Watched video "${payload.videoName}"`, {
      resourceType: 'Video',
      resourceName: payload.videoName,
      details: {
        videoId: payload.videoId,
        duration: payload.duration || 0,
        watchedAt: payload.watchedAt || new Date(),
      },
      duration: payload.duration || 0,
    });
  }

  static async logLogin(userId, details = {}) {
    return this.log(userId, 'LOGIN', 'User logged in', {
      resourceType: 'User',
      details,
    });
  }

  static async getUserActivityLogs(userId, limit = 20, page = 1) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId }).sort({ timestamp: -1 }).skip(skip).limit(safeLimit).lean(),
      ActivityLog.countDocuments({ userId }),
    ]);

    return {
      logs,
      pagination: {
        currentPage: safePage,
        totalPages: Math.ceil(total / safeLimit) || 1,
        totalItems: total,
        itemsPerPage: safeLimit,
      },
    };
  }

  static async getRecentActivities(userId, limit = 10) {
    return ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(Math.min(Math.max(Number(limit) || 10, 1), 50))
      .lean();
  }

  static async getActivitySummary(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days || 30));

    return ActivityLog.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }
}

module.exports = ActivityLogger;
