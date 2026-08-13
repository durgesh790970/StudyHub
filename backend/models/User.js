const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Personal Information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: 2,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
      index: true,
    },
    phone: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    profilePic: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },

    // User Statistics (Real-time tracking)
    stats: {
      totalPDFsPurchased: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalMockTestsAttempted: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalQuizzesAttempted: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalTestsSubmitted: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalVideosWatched: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalInterviewsGiven: {
        type: Number,
        default: 0,
        min: 0,
      },
      averageQuizScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      averageTestScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      totalSpentAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationTokenExpire: Date,

    // Password Reset
    passwordResetToken: String,
    passwordResetExpire: Date,

    // Account Metadata
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date, // Account lock for too many failed attempts

    // User Role
    role: {
      type: String,
      enum: ['user', 'admin', 'instructor'],
      default: 'user',
    },

    // Preferences
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      darkMode: {
        type: Boolean,
        default: false,
      },
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Increment login attempts
userSchema.methods.incLoginAttempts = async function () {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  // Increment attempts
  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account if too many attempts
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Update user statistics
userSchema.methods.updateStat = async function (statName, increment = 1) {
  const updateObj = {
    $inc: { [`stats.${statName}`]: increment },
    updatedAt: new Date(),
  };

  return mongoose.model('User').findByIdAndUpdate(this._id, updateObj, {
    new: true,
    runValidators: true,
  });
};

// Get public user data (without sensitive info)
userSchema.methods.toPublicJSON = function () {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.passwordResetToken;
  delete userObj.passwordResetExpire;
  delete userObj.emailVerificationToken;
  delete userObj.emailVerificationTokenExpire;
  delete userObj.loginAttempts;
  delete userObj.lockUntil;
  return userObj;
};

// Index for optimization
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
