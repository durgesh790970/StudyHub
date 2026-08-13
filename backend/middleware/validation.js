const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');

const isNonEmptyString = (value, min = 1) => typeof value === 'string' && value.trim().length >= min;
const isFiniteNumber = (value) => Number.isFinite(Number(value));
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const transactionPattern = /^[A-Za-z0-9_-]{6,64}$/;

const collectErrors = (checks) =>
  checks
    .filter((check) => !check.valid)
    .map((check) => ({
      field: check.field,
      message: check.message,
    }));

const validatePayload = (builder) => (req, res, next) => {
  const errors = builder(req);
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
  next();
};

const validateRegister = validatePayload((req) => {
  const hasStructuredName =
    isNonEmptyString(req.body.firstName, 2) && isNonEmptyString(req.body.lastName, 1);
  const hasFlatName = isNonEmptyString(req.body.name, 2);

  return collectErrors([
    {
      field: 'name',
      valid: hasStructuredName || hasFlatName,
      message: 'Provide name or firstName/lastName',
    },
    {
      field: 'email',
      valid: typeof req.body.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email),
      message: 'A valid email is required',
    },
    {
      field: 'password',
      valid: typeof req.body.password === 'string' && req.body.password.length >= 6,
      message: 'Password must be at least 6 characters long',
    },
  ]);
});

const validateLogin = validatePayload((req) =>
  collectErrors([
    {
      field: 'email',
      valid: typeof req.body.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email),
      message: 'A valid email is required',
    },
    {
      field: 'password',
      valid: typeof req.body.password === 'string' && req.body.password.length > 0,
      message: 'Password is required',
    },
  ]));

const validatePurchase = validatePayload((req) =>
  collectErrors([
    {
      field: 'pdfName',
      valid: isNonEmptyString(req.body.pdfName, 2),
      message: 'PDF name is required',
    },
    {
      field: 'amount',
      valid: isFiniteNumber(req.body.amount) && Number(req.body.amount) > 0,
      message: 'Amount must be a positive number',
    },
    {
      field: 'transactionId',
      valid: typeof req.body.transactionId === 'string' && transactionPattern.test(req.body.transactionId.trim()),
      message: 'Transaction ID must be 6-64 characters and contain only letters, numbers, _ or -',
    },
  ]));

const validateQuizSubmission = validatePayload((req) =>
  collectErrors([
    {
      field: 'quizName',
      valid: isNonEmptyString(req.body.quizName, 2),
      message: 'Quiz name is required',
    },
    {
      field: 'score',
      valid: isFiniteNumber(req.body.score) && Number(req.body.score) >= 0,
      message: 'Score must be 0 or greater',
    },
    {
      field: 'maxScore',
      valid: isFiniteNumber(req.body.maxScore) && Number(req.body.maxScore) > 0,
      message: 'maxScore must be greater than 0',
    },
    {
      field: 'totalQuestions',
      valid: isFiniteNumber(req.body.totalQuestions) && Number(req.body.totalQuestions) > 0,
      message: 'totalQuestions must be greater than 0',
    },
  ]));

const validateTestSubmission = validatePayload((req) =>
  collectErrors([
    {
      field: 'testName',
      valid: isNonEmptyString(req.body.testName, 2),
      message: 'Test name is required',
    },
    {
      field: 'score',
      valid: isFiniteNumber(req.body.score) && Number(req.body.score) >= 0,
      message: 'Score must be 0 or greater',
    },
    {
      field: 'maxScore',
      valid: isFiniteNumber(req.body.maxScore) && Number(req.body.maxScore) > 0,
      message: 'maxScore must be greater than 0',
    },
    {
      field: 'totalQuestions',
      valid: isFiniteNumber(req.body.totalQuestions) && Number(req.body.totalQuestions) > 0,
      message: 'totalQuestions must be greater than 0',
    },
  ]));

const validateInterviewSubmission = validatePayload((req) =>
  collectErrors([
    {
      field: 'title',
      valid: isNonEmptyString(req.body.title, 2),
      message: 'Interview title is required',
    },
    {
      field: 'score',
      valid: isFiniteNumber(req.body.score) && Number(req.body.score) >= 0,
      message: 'Score must be 0 or greater',
    },
    {
      field: 'maxScore',
      valid: isFiniteNumber(req.body.maxScore || 100) && Number(req.body.maxScore || 100) > 0,
      message: 'maxScore must be greater than 0',
    },
    {
      field: 'interviewType',
      valid:
        !req.body.interviewType ||
        ['Technical', 'HR', 'Coding', 'Mock', 'Live', 'Group Discussion', 'Other'].includes(
          req.body.interviewType
        ),
      message: 'Invalid interview type',
    },
  ]));

const validateVideoWatch = validatePayload((req) =>
  collectErrors([
    {
      field: 'videoId',
      valid: req.body.videoId !== undefined && String(req.body.videoId).trim().length > 0,
      message: 'videoId is required',
    },
    {
      field: 'videoName',
      valid: isNonEmptyString(req.body.videoName, 2),
      message: 'videoName is required',
    },
  ]));

const validateProfileUpdate = validatePayload((req) =>
  collectErrors([
    {
      field: 'body',
      valid: ['name', 'firstName', 'lastName', 'phone', 'bio', 'preferences'].some(
        (field) => req.body[field] !== undefined
      ),
      message: 'Provide at least one profile field to update',
    },
  ]));

const checkDuplicateTransaction = async (req, res, next) => {
  try {
    const existingTransaction = await Purchase.findOne({
      transactionId: req.body.transactionId,
      userId: req.user._id,
    }).lean();

    if (existingTransaction) {
      return res.status(409).json({
        success: false,
        message: 'This transaction ID has already been used.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

const optionalObjectIdParam = (paramName) =>
  validatePayload((req) =>
    req.params[paramName]
      ? collectErrors([
          {
            field: paramName,
            valid: isValidObjectId(req.params[paramName]),
            message: `Invalid ${paramName}`,
          },
        ])
      : []);

module.exports = {
  validateRegister,
  validateLogin,
  validatePurchase,
  validateQuizSubmission,
  validateTestSubmission,
  validateInterviewSubmission,
  validateVideoWatch,
  validateProfileUpdate,
  checkDuplicateTransaction,
  optionalObjectIdParam,
};
