const express = require('express');
const router = express.Router();
const {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  updateMemberRole
} = require('../controllers/communityController');
const { 
  authenticateToken, 
  requireAdmin, 
  requirePlatformAdmin 
} = require('../middleware/auth');
const { 
  validateCommunity, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

// Get all communities (public for platform admin, filtered for others)
router.get('/', authenticateToken, validatePagination, getAllCommunities);

// Get community by ID
router.get('/:id', authenticateToken, validateId, getCommunityById);

// Create community (admins only)
router.post('/', authenticateToken, requireAdmin, validateCommunity, createCommunity);

// Update community (creator or platform admin only)
router.put('/:id', authenticateToken, validateId, validateCommunity, updateCommunity);

// Delete community (creator or platform admin only)
router.delete('/:id', authenticateToken, validateId, deleteCommunity);

// Join community with invite code
router.post('/join', authenticateToken, joinCommunity);

// Leave current community
router.post('/leave', authenticateToken, leaveCommunity);

// Get community members (community members only)
router.get('/:id/members', authenticateToken, validateId, validatePagination, getCommunityMembers);

// Update member role (community admin or platform admin only)
router.put('/:id/members/:userId/role', authenticateToken, validateId, updateMemberRole);

module.exports = router;
