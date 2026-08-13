const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 */
const generateToken = (userId, email = null) => {
  const payload = {
    id: userId,
    email,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_super_secret_jwt_key', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  return token;
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
  } catch (error) {
    return null;
  }
};

/**
 * Decode token without verification
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Generate random string
 */
const generateRandomString = (length = 32) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Format date to readable format
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  const formats = {
    'YYYY-MM-DD': `${year}-${month}-${day}`,
    'MM/DD/YYYY': `${month}/${day}/${year}`,
    'DD-MM-YYYY': `${day}-${month}-${year}`,
    'YYYY-MM-DD HH:MM:SS': `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
    'DD MMM YYYY': `${day} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${year}`,
  };

  return formats[format] || formats['YYYY-MM-DD'];
};

/**
 * Calculate percentage
 */
const calculatePercentage = (obtained, total) => {
  if (total === 0) return 0;
  return ((obtained / total) * 100).toFixed(2);
};

/**
 * Format time duration
 */
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (secs > 0 || result === '') result += `${secs}s`;

  return result.trim();
};

/**
 * Validate email
 */
const validateEmail = (email) => {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

/**
 * Sanitize object (remove sensitive data)
 */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpire;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationTokenExpire;
  return obj;
};

/**
 * Paginate array
 */
const paginate = (array, page, limit) => {
  const skip = (page - 1) * limit;
  return {
    data: array.slice(skip, skip + limit),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(array.length / limit),
      totalItems: array.length,
      itemsPerPage: limit,
    },
  };
};

/**
 * Generate API response
 */
const apiResponse = (success, message, data = null, statusCode = 200) => {
  return {
    success,
    message,
    ...(data && { data }),
    statusCode,
  };
};

/**
 * Log activity to file (optional)
 */
const logToFile = (type, message) => {
  const fs = require('fs');
  const path = require('path');
  const logsDir = path.join(__dirname, '../logs');

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const logFile = path.join(logsDir, `${type}-${new Date().toISOString().split('T')[0]}.log`);
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFileSync(logFile, logMessage);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateRandomString,
  formatDate,
  calculatePercentage,
  formatTime,
  validateEmail,
  sanitizeUser,
  paginate,
  apiResponse,
  logToFile,
};
