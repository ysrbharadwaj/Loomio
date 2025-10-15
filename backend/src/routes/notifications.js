const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCount
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

// Get user notifications
router.get('/', authenticateToken, validatePagination, getUserNotifications);

// Get notification count
router.get('/count', authenticateToken, getNotificationCount);

// Mark notification as read
router.put('/:id/read', authenticateToken, validateId, markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, markAllAsRead);

// Delete notification
router.delete('/:id', authenticateToken, validateId, deleteNotification);

module.exports = router;
