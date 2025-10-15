const express = require('express');
const router = express.Router();
const {
  getTaskSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks
} = require('../controllers/subtaskController');
const { authenticateToken } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

// Get all subtasks for a task
router.get('/task/:taskId', authenticateToken, getTaskSubtasks);

// Create a new subtask
router.post('/task/:taskId', authenticateToken, createSubtask);

// Update a subtask
router.put('/:subtaskId', authenticateToken, validateId, updateSubtask);

// Delete a subtask
router.delete('/:subtaskId', authenticateToken, validateId, deleteSubtask);

// Reorder subtasks
router.put('/task/:taskId/reorder', authenticateToken, reorderSubtasks);

module.exports = router;
