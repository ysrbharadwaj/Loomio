const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getUserRank
} = require('../controllers/leaderboardController');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

// Get leaderboard (community or platform-wide)
router.get('/', authenticateToken, validatePagination, getLeaderboard);

// Get user's rank and stats
router.get('/rank/:userId?', authenticateToken, getUserRank);

module.exports = router;
