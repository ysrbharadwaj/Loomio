const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['member', 'community_admin'])
    .withMessage('Invalid role specified'),
  body('community_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Community ID must be a positive integer'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Community validation
const validateCommunity = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Community name must be between 2 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  handleValidationErrors
];

// Task validation
const validateTask = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Task title must be between 2 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('estimated_hours')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated hours must be a non-negative integer'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  handleValidationErrors
];

// Event validation
const validateEvent = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Event title must be between 2 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('date')
    .isISO8601()
    .withMessage('Event date must be a valid date'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location must not exceed 255 characters'),
  body('event_type')
    .optional()
    .isIn(['meeting', 'workshop', 'social', 'training', 'other'])
    .withMessage('Invalid event type'),
  body('max_attendees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max attendees must be a positive integer'),
  handleValidationErrors
];

// Leave request validation
const validateLeaveRequest = [
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('reason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('leave_type')
    .optional()
    .isIn(['sick', 'personal', 'vacation', 'emergency', 'other'])
    .withMessage('Invalid leave type'),
  handleValidationErrors
];

// Attendance validation
const validateAttendance = [
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('status')
    .isIn(['present', 'absent', 'late', 'excused'])
    .withMessage('Invalid attendance status'),
  body('check_in_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Check-in time must be in HH:MM format'),
  body('check_out_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Check-out time must be in HH:MM format'),
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isNumeric()
    .withMessage('User ID must be numeric')
    .custom((value) => {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 1) {
        throw new Error('User ID must be a positive integer');
      }
      return true;
    }),
  handleValidationErrors
];

// Community ID parameter validation
const validateCommunityId = [
  param('communityId')
    .notEmpty()
    .withMessage('Community ID is required')
    .isNumeric()
    .withMessage('Community ID must be numeric')
    .custom((value) => {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 1) {
        throw new Error('Community ID must be a positive integer');
      }
      return true;
    }),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateCommunity,
  validateTask,
  validateEvent,
  validateLeaveRequest,
  validateAttendance,
  validateId,
  validateUserId,
  validateCommunityId,
  validatePagination
};
