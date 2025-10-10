const { Subtask, Task, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all subtasks for a task
 */
const getTaskSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtasks = await Subtask.findAll({
      where: { parent_task_id: taskId },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['user_id', 'full_name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'full_name']
        }
      ],
      order: [['position', 'ASC'], ['created_at', 'ASC']]
    });

    // Calculate progress
    const totalSubtasks = subtasks.length;
    const completedSubtasks = subtasks.filter(st => st.status === 'completed').length;
    const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

    res.json({
      success: true,
      subtasks,
      progress: {
        total: totalSubtasks,
        completed: completedSubtasks,
        percentage: progress
      }
    });
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subtasks',
      error: error.message
    });
  }
};

/**
 * Create a new subtask
 */
const createSubtask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assigned_to, position } = req.body;
    const user = req.user;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    const task = await Task.findByPk(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // If position not provided, add at the end
    let subtaskPosition = position;
    if (subtaskPosition === undefined) {
      const maxPosition = await Subtask.max('position', {
        where: { parent_task_id: taskId }
      });
      subtaskPosition = (maxPosition || 0) + 1;
    }

    const subtask = await Subtask.create({
      parent_task_id: taskId,
      title: title.trim(),
      description: description?.trim(),
      assigned_to,
      created_by: user.user_id,
      position: subtaskPosition,
      status: 'not_started'
    });

    // Update parent task subtask count
    await task.increment('subtask_count');

    // Fetch created subtask with relations
    const createdSubtask = await Subtask.findByPk(subtask.subtask_id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['user_id', 'full_name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'full_name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Subtask created successfully',
      subtask: createdSubtask
    });
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subtask',
      error: error.message
    });
  }
};

/**
 * Update a subtask
 */
const updateSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { title, description, status, assigned_to, position } = req.body;
    const user = req.user;

    const subtask = await Subtask.findByPk(subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    // Track if status is being changed to completed
    const wasCompleted = subtask.status === 'completed';
    const isBeingCompleted = status === 'completed' && !wasCompleted;
    const isBeingUncompleted = wasCompleted && status !== 'completed';

    // Update fields
    if (title !== undefined) subtask.title = title.trim();
    if (description !== undefined) subtask.description = description?.trim();
    if (status !== undefined) subtask.status = status;
    if (assigned_to !== undefined) subtask.assigned_to = assigned_to;
    if (position !== undefined) subtask.position = position;

    // Handle completion
    if (isBeingCompleted) {
      subtask.completed_at = new Date();
      subtask.completed_by = user.user_id;
      
      // Update parent task completed count
      const parentTask = await Task.findByPk(subtask.parent_task_id);
      if (parentTask) {
        await parentTask.increment('completed_subtask_count');
      }
    } else if (isBeingUncompleted) {
      subtask.completed_at = null;
      subtask.completed_by = null;
      
      // Update parent task completed count
      const parentTask = await Task.findByPk(subtask.parent_task_id);
      if (parentTask && parentTask.completed_subtask_count > 0) {
        await parentTask.decrement('completed_subtask_count');
      }
    }

    await subtask.save();

    // Fetch updated subtask with relations
    const updatedSubtask = await Subtask.findByPk(subtaskId, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['user_id', 'full_name', 'email']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'full_name']
        },
        {
          model: User,
          as: 'completer',
          attributes: ['user_id', 'full_name']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Subtask updated successfully',
      subtask: updatedSubtask
    });
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subtask',
      error: error.message
    });
  }
};

/**
 * Delete a subtask
 */
const deleteSubtask = async (req, res) => {
  try {
    const { subtaskId } = req.params;

    const subtask = await Subtask.findByPk(subtaskId);

    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    const wasCompleted = subtask.status === 'completed';
    const parentTaskId = subtask.parent_task_id;

    await subtask.destroy();

    // Update parent task counts
    const parentTask = await Task.findByPk(parentTaskId);
    if (parentTask) {
      if (parentTask.subtask_count > 0) {
        await parentTask.decrement('subtask_count');
      }
      if (wasCompleted && parentTask.completed_subtask_count > 0) {
        await parentTask.decrement('completed_subtask_count');
      }
    }

    res.json({
      success: true,
      message: 'Subtask deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subtask',
      error: error.message
    });
  }
};

/**
 * Reorder subtasks
 */
const reorderSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { subtask_ids } = req.body; // Array of subtask IDs in new order

    if (!Array.isArray(subtask_ids)) {
      return res.status(400).json({
        success: false,
        message: 'subtask_ids must be an array'
      });
    }

    // Update positions
    const updatePromises = subtask_ids.map((subtaskId, index) =>
      Subtask.update(
        { position: index },
        { where: { subtask_id: subtaskId, parent_task_id: taskId } }
      )
    );

    await Promise.all(updatePromises);

    // Get updated subtasks
    const subtasks = await Subtask.findAll({
      where: { parent_task_id: taskId },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['user_id', 'full_name', 'email']
        }
      ],
      order: [['position', 'ASC']]
    });

    res.json({
      success: true,
      message: 'Subtasks reordered successfully',
      subtasks
    });
  } catch (error) {
    console.error('Error reordering subtasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder subtasks',
      error: error.message
    });
  }
};

module.exports = {
  getTaskSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
  reorderSubtasks
};
