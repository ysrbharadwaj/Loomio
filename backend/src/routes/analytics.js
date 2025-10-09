const express = require('express');
const router = express.Router();
const {
  getPlatformAnalytics,
  getCommunityAnalytics,
  getMyCommunityAnalytics
} = require('../controllers/analyticsController');
const { 
  authenticateToken, 
  requireAdmin, 
  requirePlatformAdmin 
} = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

// Get platform-wide analytics (platform admin only)
router.get('/platform', authenticateToken, requirePlatformAdmin, getPlatformAnalytics);

// Get community analytics for user's admin community
router.get('/my-community', authenticateToken, requireAdmin, getMyCommunityAnalytics);

// Get community analytics (community admin and platform admin only)
router.get('/community/:communityId', authenticateToken, requireAdmin, validateId, getCommunityAnalytics);

module.exports = router;