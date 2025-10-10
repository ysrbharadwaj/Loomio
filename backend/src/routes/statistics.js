const express = require('express');
const router = express.Router();
const {
  getUserStatistics,
  getUserActivity
} = require('../controllers/statisticsController');
const { authenticateToken } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

// Get user statistics
router.get('/:userId?', authenticateToken, getUserStatistics);

// Get user activity timeline
router.get('/:userId/activity', authenticateToken, validatePagination, getUserActivity);

module.exports = router;
