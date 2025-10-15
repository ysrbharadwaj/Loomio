const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateAssignmentStatus,
  getUserTasks,
  assignTaskToUsers,
  selfAssignTask,
  submitTask,
  reviewTaskSubmission,
  reviewIndividualAssignment,
  deleteTaskById,
  revokeTaskAssignment
} = require('../controllers/taskController');
const { 
  authenticateToken, 
  requireAdmin 
} = require('../middleware/auth');
const { 
  validateTask, 
  validateId, 
  validatePagination 
} = require('../middleware/validation');

// Get all tasks
router.get('/', authenticateToken, validatePagination, getAllTasks);

// Get task by ID
router.get('/:id', authenticateToken, validateId, getTaskById);

// Create new task (community members only)
router.post('/', authenticateToken, validateTask, createTask);

// Update task (creator or admin only)
router.put('/:id', authenticateToken, validateId, validateTask, updateTask);

// Delete task (creator or admin only)
router.delete('/:id', authenticateToken, validateId, deleteTask);

// Assign task to users (creator or admin only)
router.post('/:id/assign', authenticateToken, validateId, assignTask);

// Update assignment status (assigned user only)
router.put('/:id/status', authenticateToken, validateId, updateAssignmentStatus);

// Get user's tasks
router.get('/user/:userId', authenticateToken, validatePagination, getUserTasks);
router.get('/user', authenticateToken, validatePagination, getUserTasks);

// Assign task to specific users (admin only)
router.post('/:id/assign-users', authenticateToken, validateId, assignTaskToUsers);

// Self-assign to available task (any community member)
router.post('/:id/self-assign', authenticateToken, validateId, selfAssignTask);

// Submit task completion (assigned user only)
router.post('/:id/submit', authenticateToken, validateId, submitTask);

// Review task submission - approve or reject (admin only)
router.post('/:id/review', authenticateToken, validateId, reviewTaskSubmission);

// Review individual assignment in group task (admin only)
router.post('/:taskId/review/:userId', authenticateToken, reviewIndividualAssignment);

// Delete task completely (admin only)
router.delete('/:id/delete', authenticateToken, validateId, deleteTaskById);

// Revoke self-assignment from task (assigned user only)
router.delete('/:id/revoke', authenticateToken, validateId, revokeTaskAssignment);

module.exports = router;
