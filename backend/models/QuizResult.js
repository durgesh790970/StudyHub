const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // Quiz Details
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
    },

    quizName: {
      type: String,
      required: [true, 'Quiz name is required'],
      index: true,
    },

    quizCategory: {
      type: String,
      enum: ['Technical', 'HR', 'Aptitude', 'General Knowledge', 'Coding', 'Other'],
      default: 'General Knowledge',
    },

    // Quiz Configuration
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },

    questionsAnswered: {
      type: Number,
      default: 0,
    },

    // Scoring
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
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        questionText: String,
        selectedAnswer: String,
        correctAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number, // in seconds
      },
    ],

    // Timing
    timeTaken: {
      type: Number, // in seconds
      default: 0,
    },

    totalTime: {
      type: Number, // in seconds
      default: 0,
    },

    // Performance Metrics
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

    // Difficulty Level
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Expert'],
      default: 'Medium',
    },

    // Attempt Information
    attemptNumber: {
      type: Number,
      default: 1,
    },

    bestScore: {
      type: Number,
      default: 0,
    },

    // Review & Feedback
    review: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: Date,

    // Status
    isCompleted: {
      type: Boolean,
      default: false,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Tags
    tags: [String],

    // Additional Data
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
quizResultSchema.pre('save', function (next) {
  if (this.maxScore > 0) {
    this.percentage = (this.score / this.maxScore) * 100;
  }

  // Determine result based on percentage and pass percentage
  if (this.isCompleted) {
    this.result = this.percentage >= this.passPercentage ? 'pass' : 'fail';
  }

  next();
});

// Index for common queries
quizResultSchema.index({ userId: 1, submittedAt: -1 });
quizResultSchema.index({ quizId: 1, submittedAt: -1 });
quizResultSchema.index({ result: 1, submittedAt: -1 });

module.exports = mongoose.model('QuizResult', quizResultSchema);
