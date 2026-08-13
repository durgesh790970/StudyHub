const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema(
  {
    // User Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },

    // Purchase Details
    pdfName: {
      type: String,
      required: [true, 'PDF name is required'],
      trim: true,
    },

    pdfUrl: {
      type: String,
      default: null,
    },

    pdfCategory: {
      type: String,
      enum: [
        'Technical',
        'HR',
        'Aptitude',
        'Interview-Questions',
        'Company-Papers',
        'Study-Material',
        'Notes',
        'Other',
      ],
      default: 'Other',
    },

    // Transaction Details
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },

    currency: {
      type: String,
      default: 'INR',
    },

    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Razorpay', 'Other'],
      default: 'Razorpay',
    },

    // Payment Status
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // Refund Information
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,

    // Additional Details
    notes: String,
    invoiceNumber: String,
    gstAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },

    // Download Information
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: Date,
    expiryDate: Date, // If PDF access is limited

    // Status and Tracking
    isActive: {
      type: Boolean,
      default: true,
    },

    // Timestamps
    purchasedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
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

// Virtual for final amount (after tax and discount)
purchaseSchema.virtual('finalAmount').get(function () {
  return this.amount + this.gstAmount - this.discountAmount;
});

// Pre-save validation to prevent duplicate transactions
purchaseSchema.pre('save', async function (next) {
  if (!this.isNew) {
    return next();
  }

  // Check for duplicate transaction within 5 minutes
  const existingTransaction = await mongoose
    .model('Purchase')
    .findOne({
      transactionId: this.transactionId,
      userId: this.userId,
      createdAt: {
        $gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    });

  if (existingTransaction) {
    throw new Error('Duplicate transaction detected. Please wait before making another purchase.');
  }

  next();
});

// Index for common queries
purchaseSchema.index({ userId: 1, purchasedAt: -1 });
purchaseSchema.index({ paymentStatus: 1, purchasedAt: -1 });
purchaseSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
