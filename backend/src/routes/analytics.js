const express = require('express');
const router = express.Router();
const {
  getPlatformAnalytics,
  getCommunityAnalytics,
  getMyCommunityAnalytics,
  generateMemberReport,
  getMemberReportData
} = require('../controllers/analyticsController');
const { 
  authenticateToken, 
  requireAdmin, 
  requirePlatformAdmin 
} = require('../middleware/auth');
const { validateId, validateUserId, validateCommunityId } = require('../middleware/validation');

// Get platform-wide analytics (platform admin only)
router.get('/platform', authenticateToken, requirePlatformAdmin, getPlatformAnalytics);

// Get community analytics for user's admin community
router.get('/my-community', authenticateToken, requireAdmin, getMyCommunityAnalytics);

// Get community analytics (community admin and platform admin only)
router.get('/community/:communityId', authenticateToken, requireAdmin, validateCommunityId, getCommunityAnalytics);

// Get member report data as JSON (for modal view)
router.get('/member-report-data/:userId', authenticateToken, requireAdmin, validateUserId, getMemberReportData);

// Generate member activity report as PDF (admin only)
router.get('/member-report/:userId', authenticateToken, requireAdmin, validateUserId, generateMemberReport);

module.exports = router;