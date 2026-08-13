const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // Activity Type
    activityType: {
      type: String,
      enum: [
        'PDF_PURCHASED',
        'PDF_DOWNLOADED',
        'QUIZ_STARTED',
        'QUIZ_COMPLETED',
        'TEST_STARTED',
        'TEST_COMPLETED',
        'VIDEO_WATCHED',
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_COMPLETED',
        'LOGIN',
        'LOGOUT',
        'PROFILE_UPDATED',
        'PASSWORD_CHANGED',
        'PAYMENT_MADE',
        'PAYMENT_FAILED',
        'CERTIFICATE_EARNED',
        'ACHIEVEMENT_UNLOCKED',
        'ACCOUNT_CREATED',
        'EMAIL_VERIFIED',
      ],
      required: true,
      index: true,
    },

    // Activity Description
    description: {
      type: String,
      required: true,
    },

    // Activity Details (can vary based on type)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Related Resource
    resourceType: {
      type: String,
      enum: ['PDF', 'Quiz', 'Test', 'Interview', 'User', 'Video', 'Course', 'Other'],
    },

    resourceId: mongoose.Schema.Types.ObjectId,
    resourceName: String,

    // Reference IDs for specific resources
    pdfPurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
    },

    quizResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizResult',
    },

    testResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestResult',
    },

    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
    },

    // Score/Status Information
    score: Number,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending', 'in_progress'],
      default: 'success',
    },

    // Duration (for activities that have duration)
    duration: Number, // in seconds

    // Result/Outcome
    result: String, // pass/fail, completed/incomplete, etc.
    resultValue: Number, // percentage, score, etc.

    // Device & Network Info
    ipAddress: String,
    userAgent: String,
    deviceInfo: {
      os: String,
      browser: String,
      device: String,
    },

    // Location (if available)
    location: {
      country: String,
      city: String,
      latitude: Number,
      longitude: Number,
    },

    // Session Information
    sessionId: String,

    // Metadata
    tags: [String],
    isImportant: {
      type: Boolean,
      default: false,
    },

    // For flagging suspicious activities
    isSuspicious: {
      type: Boolean,
      default: false,
    },
    suspiciousReason: String,

    // Timestamps
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're using custom timestamp field
    toJSON: { virtuals: true },
  }
);

// Create index for time-series data (recent activities)
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ activityType: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// TTL index: automatically delete activity logs after 1 year
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
