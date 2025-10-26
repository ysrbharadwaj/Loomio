const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  updateEmailPreferences
} = require('../controllers/userController');
const { 
  authenticateToken, 
  requireAdmin, 
  requirePlatformAdmin 
} = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, validatePagination, getAllUsers);

// Get user by ID
router.get('/:id', authenticateToken, validateId, getUserById);

// Update user (admin only or self)
router.put('/:id', authenticateToken, validateId, updateUser);

// Delete user (platform admin only)
router.delete('/:id', authenticateToken, requirePlatformAdmin, validateId, deleteUser);

// Get user stats
router.get('/:id/stats', authenticateToken, validateId, getUserStats);

// Update email preferences (user can only update their own)
router.put('/me/email-preferences', authenticateToken, updateEmailPreferences);

module.exports = router;
