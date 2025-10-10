const { TaskTag, TaskTagAssignment, Task, Community, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all tags for a community
 */
const getCommunityTags = async (req, res) => {
  try {
    const { community_id } = req.query;
    const user = req.user;

    let targetCommunityId = community_id;
    
    // If no community specified, use user's community
    if (!targetCommunityId) {
      const userCommunities = await user.getCommunities();
      if (userCommunities && userCommunities.length > 0) {
        targetCommunityId = userCommunities[0].community_id;
      }
    }

    if (!targetCommunityId) {
      return res.status(400).json({
        success: false,
        message: 'Community ID is required'
      });
    }

    const tags = await TaskTag.findAll({
      where: { community_id: targetCommunityId },
      include: [{
        model: User,
        as: 'creator',
        attributes: ['user_id', 'full_name']
      }],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      tags,
      total: tags.length
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags',
      error: error.message
    });
  }
};

/**
 * Create a new tag
 */
const createTag = async (req, res) => {
  try {
    const { name, color, community_id } = req.body;
    const user = req.user;

    if (!name || !community_id) {
      return res.status(400).json({
        success: false,
        message: 'Name and community_id are required'
      });
    }

    // Check if tag already exists in this community
    const existingTag = await TaskTag.findOne({
      where: {
        name: name.trim(),
        community_id
      }
    });

    if (existingTag) {
      return res.status(409).json({
        success: false,
        message: 'A tag with this name already exists in this community'
      });
    }

    const tag = await TaskTag.create({
      name: name.trim(),
      color: color || '#3B82F6',
      community_id,
      created_by: user.user_id
    });

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      tag
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tag',
      error: error.message
    });
  }
};

/**
 * Update a tag
 */
const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const tag = await TaskTag.findByPk(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    if (name) tag.name = name.trim();
    if (color) tag.color = color;

    await tag.save();

    res.json({
      success: true,
      message: 'Tag updated successfully',
      tag
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tag',
      error: error.message
    });
  }
};

/**
 * Delete a tag
 */
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await TaskTag.findByPk(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    await tag.destroy();

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tag',
      error: error.message
    });
  }
};

/**
 * Assign tags to a task
 */
const assignTagsToTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tag_ids } = req.body; // Array of tag IDs

    if (!Array.isArray(tag_ids)) {
      return res.status(400).json({
        success: false,
        message: 'tag_ids must be an array'
      });
    }

    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Remove existing tag assignments
    await TaskTagAssignment.destroy({
      where: { task_id: taskId }
    });

    // Create new assignments
    if (tag_ids.length > 0) {
      const assignments = tag_ids.map(tag_id => ({
        task_id: taskId,
        tag_id
      }));

      await TaskTagAssignment.bulkCreate(assignments);
    }

    // Get updated task with tags
    const updatedTask = await Task.findByPk(taskId, {
      include: [{
        model: TaskTag,
        as: 'tags',
        through: { attributes: [] }
      }]
    });

    res.json({
      success: true,
      message: 'Tags assigned successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error assigning tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign tags',
      error: error.message
    });
  }
};

/**
 * Get tasks by tag
 */
const getTasksByTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const tag = await TaskTag.findByPk(tagId, {
      include: [{
        model: Task,
        as: 'tasks',
        through: { attributes: [] },
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [{
          model: User,
          as: 'creator',
          attributes: ['user_id', 'full_name']
        }]
      }]
    });

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.json({
      success: true,
      tag: {
        tag_id: tag.tag_id,
        name: tag.name,
        color: tag.color
      },
      tasks: tag.tasks,
      total: tag.tasks.length
    });
  } catch (error) {
    console.error('Error fetching tasks by tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
};

module.exports = {
  getCommunityTags,
  createTag,
  updateTag,
  deleteTag,
  assignTagsToTask,
  getTasksByTag
};
