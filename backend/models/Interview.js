const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // Interview Details
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
    },

    title: {
      type: String,
      required: [true, 'Interview title is required'],
    },

    interviewType: {
      type: String,
      enum: ['Technical', 'HR', 'Coding', 'Mock', 'Live', 'Group Discussion', 'Other'],
      default: 'Mock',
      index: true,
    },

    companyName: String,
    position: String,

    // Interview Rounds
    round: {
      type: Number,
      default: 1,
    },

    // Scoring
    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxScore: {
      type: Number,
      default: 100,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    result: {
      type: String,
      enum: ['pass', 'fail', 'pending', 'need_improvement', 'excellent'],
      default: 'pending',
      index: true,
    },

    // Performance Metrics
    communicationSkill: {
      type: Number,
      min: 1,
      max: 10,
    },
    technicalKnowledge: {
      type: Number,
      min: 1,
      max: 10,
    },
    problemSolvingAbility: {
      type: Number,
      min: 1,
      max: 10,
    },
    confidenceLevel: {
      type: Number,
      min: 1,
      max: 10,
    },

    // Questions & Answers
    questionsAsked: [
      {
        questionNumber: Number,
        question: String,
        category: String,
        difficulty: {
          type: String,
          enum: ['Easy', 'Medium', 'Hard'],
        },
        candidateResponse: String,
        feedback: String,
        rating: {
          type: Number,
          min: 1,
          max: 10,
        },
      },
    ],

    // Feedback
    overallFeedback: String,
    strengths: [String],
    areasForImprovement: [String],
    recommendations: [String],

    // Duration
    duration: {
      type: Number, // in minutes
      default: 0,
    },

    // Interview Status
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'rescheduled', 'cancelled', 'no_show'],
      default: 'completed',
      index: true,
    },

    // Interview Metadata
    interviewerName: String,
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    meetingLink: String,
    recordingUrl: String,

    // Attempt Information
    attemptNumber: {
      type: Number,
      default: 1,
    },

    // Email Notification
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,

    // Additional Details
    notes: String,
    tags: [String],

    // Validation
    isValidated: {
      type: Boolean,
      default: false,
    },

    // Timestamps
    scheduledAt: Date,
    startedAt: Date,
    completedAt: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Calculate percentage before saving
interviewSchema.pre('save', function (next) {
  if (this.maxScore > 0) {
    this.percentage = (this.score / this.maxScore) * 100;
  }

  // Determine result based on overall score
  if (this.isValidated) {
    if (this.percentage >= 80) this.result = 'excellent';
    else if (this.percentage >= 60) this.result = 'pass';
    else if (this.percentage >= 40) this.result = 'need_improvement';
    else this.result = 'fail';
  }

  next();
});

// Index for optimization
interviewSchema.index({ userId: 1, completedAt: -1 });
interviewSchema.index({ interviewType: 1, completedAt: -1 });
interviewSchema.index({ result: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
