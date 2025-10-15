const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { 
  authenticateToken, 
  requireAdmin 
} = require('../middleware/auth');
const { 
  validateEvent, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

// Get all events
router.get('/', authenticateToken, validatePagination, getAllEvents);

// Get event by ID
router.get('/:id', authenticateToken, validateId, getEventById);

// Create new event (community members only)
router.post('/', authenticateToken, validateEvent, createEvent);

// Update event (creator or admin only)
router.put('/:id', authenticateToken, validateId, validateEvent, updateEvent);

// Delete event (creator or admin only)
router.delete('/:id', authenticateToken, validateId, deleteEvent);

module.exports = router;
