const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // Test Details
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MockTest',
      required: [true, 'Test ID is required'],
    },

    testName: {
      type: String,
      required: [true, 'Test name is required'],
      index: true,
    },

    testType: {
      type: String,
      enum: ['Mock Test', 'Full Test', 'Topic Test', 'Mini Test', 'Final Test'],
      default: 'Mock Test',
    },

    testCategory: {
      type: String,
      enum: ['Technical', 'HR', 'Aptitude', 'Coding', 'Communication', 'General', 'Other'],
      default: 'General',
    },

    companyName: String,
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      default: 'Medium',
    },

    // Test Configuration
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    questionsAttempted: {
      type: Number,
      default: 0,
    },

    // Scoring Details
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: 0,
    },

    maxScore: {
      type: Number,
      required: [true, 'Max score is required'],
      min: 0,
    },

    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Result Status
    result: {
      type: String,
      enum: ['pass', 'fail', 'pending', 'incomplete'],
      default: 'pending',
      index: true,
    },

    passPercentage: {
      type: Number,
      default: 40,
    },

    // Answer Details
    sectionResults: [
      {
        sectionName: String,
        totalQuestions: Number,
        questionsAttempted: Number,
        correctAnswers: Number,
        wrongAnswers: Number,
        skipped: Number,
        sectionScore: Number,
        sectionMaxScore: Number,
        sectionPercentage: Number,
        timeTaken: Number, // in seconds
      },
    ],

    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        questionNumber: Number,
        questionText: String,
        section: String,
        selectedAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        marksObtained: Number,
        timeSpent: Number, // in seconds
        explanation: String,
      },
    ],

    // Timing Analysis
    timeTaken: {
      type: Number, // in seconds
      default: 0,
    },

    totalTime: {
      type: Number, // in seconds
      default: 0,
    },

    averageTimePerQuestion: Number, // in seconds

    // Performance Analytics
    correctAnswers: {
      type: Number,
      default: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
    },

    skippedAnswers: {
      type: Number,
      default: 0,
    },

    // Attempt Information
    attemptNumber: {
      type: Number,
      default: 1,
    },

    previousAttempts: [
      {
        attemptNumber: Number,
        score: Number,
        percentage: Number,
        result: String,
        attemptedAt: Date,
      },
    ],

    bestScore: {
      type: Number,
      default: 0,
    },

    improvementPercentage: Number,

    // Comparative Analytics
    comparisonWithHighest: {
      highestScore: Number,
      scoreGap: Number,
      percentageGap: Number,
      rank: Number,
      totalParticipants: Number,
    },

    // Negative Marking
    negativeMarks: {
      type: Number,
      default: 0,
    },

    // Analysis
    strongAreas: [String],
    weakAreas: [String],
    recommendations: [String],

    // Validation & Security
    isCompleted: {
      type: Boolean,
      default: false,
    },

    isValidated: {
      type: Boolean,
      default: false,
    },

    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Submission Details
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Review
    review: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,

    // Metadata
    deviceInfo: String,
    ipAddress: String,

    // Timestamps
    startedAt: Date,
    completedAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
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
testResultSchema.pre('save', function (next) {
  if (this.maxScore > 0) {
    this.percentage = (this.score / this.maxScore) * 100;
  }

  if (this.totalTime > 0) {
    this.averageTimePerQuestion = Math.round(this.timeTaken / this.questionsAttempted || 0);
  }

  // Determine result
  if (this.isCompleted) {
    this.result = this.percentage >= this.passPercentage ? 'pass' : 'fail';
  }

  next();
});

// Index for optimization
testResultSchema.index({ userId: 1, submittedAt: -1 });
testResultSchema.index({ testId: 1, submittedAt: -1 });
testResultSchema.index({ result: 1, submittedAt: -1 });
testResultSchema.index({ percentage: -1 });

module.exports = mongoose.model('TestResult', testResultSchema);
