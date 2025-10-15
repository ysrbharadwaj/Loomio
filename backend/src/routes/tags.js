const express = require('express');
const router = express.Router();
const {
  getCommunityTags,
  createTag,
  updateTag,
  deleteTag,
  assignTagsToTask,
  getTasksByTag
} = require('../controllers/tagController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

// Get all tags for a community
router.get('/', authenticateToken, getCommunityTags);

// Create a new tag (members can create tags)
router.post('/', authenticateToken, createTag);

// Update a tag (admins only)
router.put('/:id', authenticateToken, requireAdmin, validateId, updateTag);

// Delete a tag (admins only)
router.delete('/:id', authenticateToken, requireAdmin, validateId, deleteTag);

// Assign tags to a task
router.post('/task/:taskId', authenticateToken, assignTagsToTask);

// Get tasks by tag
router.get('/:tagId/tasks', authenticateToken, validateId, getTasksByTag);

module.exports = router;
