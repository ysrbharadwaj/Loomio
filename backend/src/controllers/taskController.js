const { Task, User, TaskAssignment, Community, Contribution } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      priority = '', 
      community_id = '',
      assigned_to = '',
      search = '',
      start_date = '',
      end_date = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filter by community - get user's communities first
    if (req.user.role !== 'platform_admin') {
      // Get user's communities through UserCommunity association
      const { UserCommunity } = require('../models');
      const userCommunities = await UserCommunity.findAll({
        where: { user_id: req.user.user_id },
        attributes: ['community_id']
      });
      
      const communityIds = userCommunities.map(uc => uc.community_id);
      if (communityIds.length === 0) {
        return res.json({ tasks: [], pagination: { total: 0, page: 1, limit: parseInt(limit), pages: 0 } });
      }
      
      if (community_id && communityIds.includes(parseInt(community_id))) {
        whereClause.community_id = parseInt(community_id);
      } else {
        whereClause.community_id = { [Op.in]: communityIds };
      }
    } else if (community_id) {
      whereClause.community_id = community_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Add date filtering
    if (start_date || end_date) {
      const dateFilter = {};
      if (start_date) {
        dateFilter[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        dateFilter[Op.lte] = new Date(end_date);
      }
      whereClause.deadline = dateFilter;
    }

    const tasks = await Task.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name', 'email'] 
        },
        { 
          model: User, 
          as: 'assignees', 
          attributes: ['user_id', 'full_name', 'email'],
          through: { 
            attributes: ['status', 'assigned_at', 'accepted_at', 'completed_at', 'submission_link', 'submission_notes', 'submitted_at', 'review_notes', 'reviewed_at'],
            as: 'TaskAssignment'
          },
          required: false
        },
        { 
          model: User, 
          as: 'reviewer', 
          attributes: ['user_id', 'full_name', 'email'],
          required: false
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Filter by assigned user if specified
    let filteredTasks = tasks.rows;
    if (assigned_to) {
      filteredTasks = tasks.rows.filter(task => 
        task.assignees.some(assignee => assignee.user_id === parseInt(assigned_to))
      );
    }

    res.json({
      tasks: filteredTasks,
      pagination: {
        total: filteredTasks.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(filteredTasks.length / limit)
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name', 'email'] 
        },
        { 
          model: User, 
          as: 'assignees', 
          attributes: ['user_id', 'full_name', 'email'],
          through: { 
            attributes: ['status', 'assigned_at', 'accepted_at', 'completed_at', 'notes', 'submission_link', 'submission_notes', 'submitted_at', 'review_notes', 'reviewed_at'],
            as: 'TaskAssignment'
          },
          required: false
        },
        { 
          model: User, 
          as: 'reviewer', 
          attributes: ['user_id', 'full_name', 'email'],
          required: false
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role !== 'platform_admin' && task.community_id !== req.user.community_id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    res.json({ task: task.toJSON() });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Failed to fetch task', error: error.message });
  }
};

// Create new task
const createTask = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      deadline, 
      priority = 'medium', 
      estimated_hours,
      tags = [],
      assignee_ids = [],
      community_id,
      task_type = 'individual',
      max_assignees = 1
    } = req.body;

    const assigned_by = req.user.user_id;

    if (!community_id) {
      return res.status(400).json({ message: 'Community ID is required to create tasks' });
    }

    // Verify user is a member of the community and has admin role
    const { UserCommunity } = require('../models');
    const userCommunity = await UserCommunity.findOne({
      where: { 
        user_id: req.user.user_id, 
        community_id: parseInt(community_id)
      }
    });

    if (!userCommunity) {
      return res.status(403).json({ message: 'You must be a member of this community to create tasks' });
    }

    if (userCommunity.role !== 'community_admin') {
      return res.status(403).json({ message: 'Only community administrators can create tasks' });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      assigned_by,
      deadline: deadline ? new Date(deadline) : null,
      priority,
      estimated_hours,
      tags,
      community_id,
      task_type,
      max_assignees: task_type === 'group' ? max_assignees : 1
    });

    // Assign users if specified
    if (assignee_ids.length > 0) {
      const assignments = assignee_ids.map(userId => ({
        task_id: task.task_id,
        user_id: userId,
        assigned_at: new Date()
      }));

      await TaskAssignment.bulkCreate(assignments);
    }

    // Get created task with relations
    const createdTask = await Task.findByPk(task.task_id, {
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name', 'email'] 
        },
        { 
          model: User, 
          as: 'assignees', 
          attributes: ['user_id', 'full_name', 'email'],
          through: { attributes: ['status', 'assigned_at'] }
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ]
    });

    // Send notifications
    try {
      const community = await Community.findByPk(community_id);
      
      // Notify all community members about the new task
      await notificationService.notifyTaskCreated(
        task, 
        req.user.full_name, 
        community.name
      );

      // If users were assigned, send assignment notifications
      if (assignee_ids.length > 0) {
        await notificationService.notifyTaskAssigned(
          task,
          assignee_ids,
          req.user.full_name,
          community.name
        );
      }
    } catch (notifError) {
      console.error('Error sending task creation notifications:', notifError);
    }

    res.status(201).json({
      message: 'Task created successfully',
      task: createdTask.toJSON()
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      deadline, 
      priority, 
      estimated_hours,
      tags,
      status
    } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role !== 'platform_admin' && task.community_id !== req.user.community_id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Update task
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (priority !== undefined) updateData.priority = priority;
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completion_date = new Date();
      }
    }

    await task.update(updateData);

    // Get updated task with relations
    const updatedTask = await Task.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name', 'email'] 
        },
        { 
          model: User, 
          as: 'assignees', 
          attributes: ['user_id', 'full_name', 'email'],
          through: { attributes: ['status', 'assigned_at', 'accepted_at', 'completed_at'] }
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ]
    });

    // Send notifications to assignees about task update
    try {
      if (updatedTask.assignees && updatedTask.assignees.length > 0) {
        const assigneeIds = updatedTask.assignees.map(a => a.user_id);
        await notificationService.notifyTaskUpdated(
          updatedTask,
          assigneeIds,
          req.user.full_name,
          updatedTask.community.name
        );
      }
    } catch (notifError) {
      console.error('Error sending task update notifications:', notifError);
    }

    res.json({
      message: 'Task updated successfully',
      task: updatedTask.toJSON()
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'assignees', 
          attributes: ['user_id'] 
        },
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ]
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role !== 'platform_admin' && task.community_id !== req.user.community_id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Store data for notification before deletion
    const taskTitle = task.title;
    const assigneeIds = task.assignees ? task.assignees.map(a => a.user_id) : [];
    const communityId = task.community_id;
    const communityName = task.community ? task.community.name : 'Community';

    // Delete task assignments first
    await TaskAssignment.destroy({ where: { task_id: id } });

    // Delete task
    await task.destroy();

    // Send notifications to assignees about task deletion
    try {
      if (assigneeIds.length > 0) {
        await notificationService.notifyTaskDeleted(
          taskTitle,
          assigneeIds,
          req.user.full_name,
          communityId,
          communityName
        );
      }
    } catch (notifError) {
      console.error('Error sending task deletion notifications:', notifError);
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

// Assign task to users
const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_ids } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role !== 'platform_admin' && task.community_id !== req.user.community_id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Remove existing assignments
    await TaskAssignment.destroy({ where: { task_id: id } });

    // Create new assignments
    if (user_ids && user_ids.length > 0) {
      const assignments = user_ids.map(userId => ({
        task_id: id,
        user_id: userId,
        assigned_at: new Date()
      }));

      await TaskAssignment.bulkCreate(assignments);
    }

    // Get updated task with assignments
    const updatedTask = await Task.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'assignees', 
          attributes: ['user_id', 'full_name', 'email'],
          through: { attributes: ['status', 'assigned_at'] }
        }
      ]
    });

    res.json({
      message: 'Task assignments updated successfully',
      task: updatedTask.toJSON()
    });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ message: 'Failed to assign task', error: error.message });
  }
};

// Update task assignment status
const updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.user_id;

    const assignment = await TaskAssignment.findOne({
      where: { task_id: id, user_id: userId }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Task assignment not found' });
    }

    const updateData = { status };
    if (notes !== undefined) updateData.notes = notes;

    if (status === 'accepted') {
      updateData.accepted_at = new Date();
    } else if (status === 'completed') {
      updateData.completed_at = new Date();
      
      // Award points for task completion
      const task = await Task.findByPk(id);
      if (task) {
        await Contribution.create({
          user_id: userId,
          task_id: id,
          points: 10, // Default task completion points
          type: 'task_completion',
          description: `Completed task: ${task.title}`,
          community_id: task.community_id
        });

        // Update user points
        await User.increment('points', { 
          by: 10, 
          where: { user_id: userId } 
        });
      }
    }

    await assignment.update(updateData);

    res.json({
      message: 'Assignment status updated successfully',
      assignment: assignment.toJSON()
    });
  } catch (error) {
    console.error('Update assignment status error:', error);
    res.status(500).json({ message: 'Failed to update assignment status', error: error.message });
  }
};

// Get user's tasks
const getUserTasks = async (req, res) => {
  try {
    const { status = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.params.userId || req.user.user_id;

    const whereClause = { user_id: userId };
    if (status) {
      whereClause.status = status;
    }

    const assignments = await TaskAssignment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Task,
          include: [
            { model: User, as: 'creator', attributes: ['user_id', 'full_name', 'email'] },
            { model: Community, as: 'community', attributes: ['community_id', 'name'] }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['assigned_at', 'DESC']]
    });

    res.json({
      tasks: assignments.rows,
      pagination: {
        total: assignments.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(assignments.count / limit)
      }
    });
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ message: 'Failed to fetch user tasks', error: error.message });
  }
};

// Assign task to specific users
const assignTaskToUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_ids } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    const task = await Task.findByPk(id, {
      include: [{ model: Community, as: 'community' }]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user is admin of the community
    const { UserCommunity } = require('../models');
    const userCommunity = await UserCommunity.findOne({
      where: { 
        user_id: req.user.user_id, 
        community_id: task.community_id,
        role: 'community_admin'
      }
    });

    if (!userCommunity && req.user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Only community administrators can assign tasks' });
    }

    // For group tasks, allow assignment if not completed/cancelled/rejected
    // For individual tasks, only allow if not_started or in_progress
    const allowedStatuses = task.task_type === 'group' 
      ? ['not_started', 'in_progress', 'submitted'] 
      : ['not_started', 'in_progress'];

    if (!allowedStatuses.includes(task.status)) {
      return res.status(400).json({ 
        message: task.task_type === 'group' 
          ? 'Task is no longer available for assignment' 
          : 'Task is not available for assignment' 
      });
    }

    // For group tasks, check if max assignees limit would be exceeded
    if (task.task_type === 'group') {
      const currentAssigneeCount = await TaskAssignment.count({
        where: { task_id: parseInt(id) }
      });

      if (currentAssigneeCount + user_ids.length > task.max_assignees) {
        return res.status(400).json({ 
          message: `Cannot assign ${user_ids.length} users. Only ${task.max_assignees - currentAssigneeCount} slots available.` 
        });
      }
    }

    // Create assignments for each user
    const assignments = [];
    for (const user_id of user_ids) {
      try {
        const assignment = await TaskAssignment.create({
          task_id: parseInt(id),
          user_id: parseInt(user_id),
          status: 'assigned'
        });
        assignments.push(assignment);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          // User already assigned, skip
          continue;
        }
        throw error;
      }
    }

    // Send notifications to assigned users
    try {
      const assignedUserIds = assignments.map(a => a.user_id);
      if (assignedUserIds.length > 0) {
        await notificationService.notifyTaskAssigned(
          task,
          assignedUserIds,
          req.user.full_name,
          task.community.name
        );
      }
    } catch (notifError) {
      console.error('Error sending task assignment notifications:', notifError);
    }

    res.json({
      message: `Task assigned to ${assignments.length} users`,
      assignments: assignments
    });
  } catch (error) {
    console.error('Assign task to users error:', error);
    res.status(500).json({ message: 'Failed to assign task', error: error.message });
  }
};

// Self-assign to available task
const selfAssignTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [{ model: Community, as: 'community' }]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // For group tasks, allow self-assignment if not completed/cancelled/rejected and slots available
    // For individual tasks, only allow if not_started or in_progress
    const allowedStatuses = task.task_type === 'group' 
      ? ['not_started', 'in_progress', 'submitted'] 
      : ['not_started', 'in_progress'];

    if (!allowedStatuses.includes(task.status)) {
      return res.status(400).json({ 
        message: task.task_type === 'group' 
          ? 'Task is no longer available for self-assignment' 
          : 'Task is not available for self-assignment' 
      });
    }

    // Check if user is already assigned
    const existingAssignment = await TaskAssignment.findOne({
      where: { 
        task_id: parseInt(id),
        user_id: req.user.user_id
      }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'You are already assigned to this task' });
    }

    // For group tasks, check if max assignees limit is reached
    if (task.task_type === 'group') {
      const currentAssigneeCount = await TaskAssignment.count({
        where: { task_id: parseInt(id) }
      });

      if (currentAssigneeCount >= task.max_assignees) {
        return res.status(400).json({ message: 'Maximum number of assignees reached for this task' });
      }
    } else {
      // For individual tasks, check if already assigned to someone
      const assigneeCount = await TaskAssignment.count({
        where: { task_id: parseInt(id) }
      });

      if (assigneeCount > 0) {
        return res.status(400).json({ message: 'This individual task is already assigned to someone' });
      }
    }

    // Verify user is member of the community
    const { UserCommunity } = require('../models');
    const userCommunity = await UserCommunity.findOne({
      where: { 
        user_id: req.user.user_id, 
        community_id: task.community_id,
        is_active: true
      }
    });

    if (!userCommunity) {
      return res.status(403).json({ message: 'You must be a member of this community to self-assign tasks' });
    }

    // Create assignment
    const assignment = await TaskAssignment.create({
      task_id: parseInt(id),
      user_id: req.user.user_id,
      status: 'accepted',
      accepted_at: new Date()
    });

    // Update task status to in_progress if it was not_started
    if (task.status === 'not_started') {
      await task.update({ status: 'in_progress' });
    }

    // Notify community admins about self-assignment
    try {
      await notificationService.notifyTaskSelfAssigned(
        task,
        req.user.full_name,
        task.community.name
      );
    } catch (notifError) {
      console.error('Error sending self-assignment notification:', notifError);
    }

    res.json({
      message: 'Successfully self-assigned to task',
      assignment: assignment
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'You are already assigned to this task' });
    }
    console.error('Self-assign task error:', error);
    res.status(500).json({ message: 'Failed to self-assign task', error: error.message });
  }
};

// Submit task completion
const submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { submission_link, submission_notes } = req.body;

    // Find user's assignment for this task
    const assignment = await TaskAssignment.findOne({
      where: {
        task_id: parseInt(id),
        user_id: req.user.user_id
      },
      include: [{ model: Task, as: 'task' }]
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Task assignment not found' });
    }

    if (!['accepted', 'in_progress'].includes(assignment.status)) {
      return res.status(400).json({ message: 'Task cannot be submitted in current status' });
    }

    // Check if task deadline has passed
    if (assignment.task.deadline && new Date() > new Date(assignment.task.deadline)) {
      return res.status(400).json({ message: 'Task cannot be submitted after the deadline has passed' });
    }

    // Update assignment with individual submission
    await assignment.update({
      status: 'submitted',
      submission_link: submission_link || null,
      submission_notes: submission_notes || null,
      submitted_at: new Date()
    });

    // For individual tasks or when all group members have submitted, update task status
    const allAssignments = await TaskAssignment.findAll({
      where: { task_id: parseInt(id) }
    });

    const allSubmitted = allAssignments.every(a => a.status === 'submitted' || a.status === 'completed' || a.status === 'rejected');
    
    if (assignment.task.task_type === 'individual' || allSubmitted) {
      await assignment.task.update({
        status: 'submitted',
        submitted_at: new Date()
      });
    }

    // Notify community admins about task submission
    try {
      await notificationService.notifyTaskSubmitted(
        assignment.task,
        req.user.full_name,
        assignment.task.community.name
      );
    } catch (notifError) {
      console.error('Error sending task submission notification:', notifError);
    }

    res.json({
      message: 'Task submitted successfully. Awaiting admin review.',
      task: await Task.findByPk(id, {
        include: [
          { model: User, as: 'creator', attributes: ['user_id', 'full_name', 'email'] },
          { 
            model: User, 
            as: 'assignees', 
            attributes: ['user_id', 'full_name', 'email'],
            through: { 
              attributes: ['status', 'submission_link', 'submission_notes', 'submitted_at', 'review_notes', 'reviewed_at'],
              as: 'TaskAssignment'
            }
          },
          { model: Community, as: 'community', attributes: ['community_id', 'name'] }
        ]
      })
    });
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ message: 'Failed to submit task', error: error.message });
  }
};

// Approve or reject task submission
const reviewTaskSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, review_notes } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either "approve" or "reject"' });
    }

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status !== 'submitted') {
      return res.status(400).json({ message: 'Task is not in submitted status' });
    }

    // Verify user is admin of the community
    const { UserCommunity } = require('../models');
    const userCommunity = await UserCommunity.findOne({
      where: { 
        user_id: req.user.user_id, 
        community_id: task.community_id,
        role: 'community_admin'
      }
    });

    if (!userCommunity && req.user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Only community administrators can review task submissions' });
    }

    const newStatus = action === 'approve' ? 'completed' : 'rejected';
    const completionDate = action === 'approve' ? new Date() : null;

    // Update task
    await task.update({
      status: newStatus,
      reviewed_by: req.user.user_id,
      reviewed_at: new Date(),
      review_notes: review_notes || null,
      completion_date: completionDate
    });

    // Update all assignments for this task
    await TaskAssignment.update(
      { 
        status: newStatus,
        completed_at: completionDate
      },
      { where: { task_id: parseInt(id) } }
    );

    // Award points if task is approved
    if (action === 'approve') {
      // Get all users assigned to this task
      const assignments = await TaskAssignment.findAll({
        where: { task_id: parseInt(id) },
        include: [{ model: User, as: 'user' }]
      });

      // Award points to each assigned user
      const pointsToAward = 10; // Standard points for task completion
      const { Contribution } = require('../models');

      const assigneeIds = [];
      for (const assignment of assignments) {
        assigneeIds.push(assignment.user_id);
        
        // Update user's total points
        await User.increment('points', {
          by: pointsToAward,
          where: { user_id: assignment.user_id }
        });

        // Create contribution record
        await Contribution.create({
          user_id: assignment.user_id,
          task_id: parseInt(id),
          community_id: task.community_id,
          type: 'task_completion',
          points: pointsToAward,
          description: `Completed task: ${task.title}`
        });
      }

      // Notify assignees about task approval
      try {
        await notificationService.notifyTaskApproved(
          task,
          assigneeIds,
          req.user.full_name,
          task.community.name
        );
      } catch (notifError) {
        console.error('Error sending task approval notification:', notifError);
      }
    } else {
      // Notify assignees about task rejection
      try {
        const assignments = await TaskAssignment.findAll({
          where: { task_id: parseInt(id) }
        });
        const assigneeIds = assignments.map(a => a.user_id);
        
        await notificationService.notifyTaskRejected(
          task,
          assigneeIds,
          req.user.full_name,
          review_notes,
          task.community.name
        );
      } catch (notifError) {
        console.error('Error sending task rejection notification:', notifError);
      }
    }

    res.json({
      message: `Task ${action}d successfully`,
      task: await Task.findByPk(id, {
        include: [
          { model: User, as: 'creator', attributes: ['user_id', 'full_name', 'email'] },
          { model: User, as: 'reviewer', attributes: ['user_id', 'full_name', 'email'] },
          { model: Community, as: 'community', attributes: ['community_id', 'name'] }
        ]
      })
    });
  } catch (error) {
    console.error('Review task submission error:', error);
    res.status(500).json({ message: 'Failed to review task submission', error: error.message });
  }
};

// Delete task (admin only)
const deleteTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [{ model: Community, as: 'community' }]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is community admin or platform admin
    if (req.user.role !== 'platform_admin') {
      const { UserCommunity } = require('../models');
      const userCommunity = await UserCommunity.findOne({
        where: {
          user_id: req.user.user_id,
          community_id: task.community_id
        }
      });

      if (!userCommunity || userCommunity.role !== 'community_admin') {
        return res.status(403).json({ message: 'Only community administrators can delete tasks' });
      }
    }

    await task.destroy();

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

// Revoke task assignment (user can remove themselves from a task)
const revokeTaskAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const assignment = await TaskAssignment.findOne({
      where: {
        task_id: parseInt(id),
        user_id: req.user.user_id
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'You are not assigned to this task' });
    }

    // Can't revoke if already submitted or completed
    if (['submitted', 'completed'].includes(assignment.status)) {
      return res.status(400).json({ message: 'Cannot revoke assignment for submitted or completed tasks' });
    }

    await assignment.destroy();

    // Check if there are any remaining assignments
    const remainingAssignments = await TaskAssignment.count({
      where: { task_id: parseInt(id) }
    });

    // If no assignments left, set task status back to not_started
    if (remainingAssignments === 0) {
      await task.update({ status: 'not_started' });
    }

    res.json({ message: 'Task assignment revoked successfully' });
  } catch (error) {
    console.error('Revoke task assignment error:', error);
    res.status(500).json({ message: 'Failed to revoke task assignment', error: error.message });
  }
};

// Review individual assignment (for group tasks)
const reviewIndividualAssignment = async (req, res) => {
  try {
    const { taskId, userId } = req.params;
    const { action, review_notes } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be either "approve" or "reject"' });
    }

    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user is admin of the community
    const { UserCommunity } = require('../models');
    const userCommunity = await UserCommunity.findOne({
      where: { 
        user_id: req.user.user_id, 
        community_id: task.community_id,
        role: 'community_admin'
      }
    });

    if (!userCommunity && req.user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Only community administrators can review submissions' });
    }

    const assignment = await TaskAssignment.findOne({
      where: {
        task_id: parseInt(taskId),
        user_id: parseInt(userId)
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.status !== 'submitted') {
      return res.status(400).json({ message: 'Assignment is not in submitted status' });
    }

    const newStatus = action === 'approve' ? 'completed' : 'rejected';
    const completionDate = action === 'approve' ? new Date() : null;

    // Update assignment
    await assignment.update({
      status: newStatus,
      reviewed_by: req.user.user_id,
      reviewed_at: new Date(),
      review_notes: review_notes || null,
      completed_at: completionDate
    });

    // Award points if approved
    if (action === 'approve') {
      const pointsToAward = 10;
      const { Contribution } = require('../models');

      await User.increment('points', {
        by: pointsToAward,
        where: { user_id: parseInt(userId) }
      });

      await Contribution.create({
        user_id: parseInt(userId),
        task_id: parseInt(taskId),
        community_id: task.community_id,
        type: 'task_completion',
        points: pointsToAward,
        description: `Completed task: ${task.title}`
      });
    }

    // Check if all assignments are reviewed
    const allAssignments = await TaskAssignment.findAll({
      where: { task_id: parseInt(taskId) }
    });

    const allReviewed = allAssignments.every(a => 
      ['completed', 'rejected'].includes(a.status)
    );

    // If all assignments are reviewed, update task status
    if (allReviewed) {
      const anyApproved = allAssignments.some(a => a.status === 'completed');
      await task.update({
        status: anyApproved ? 'completed' : 'rejected',
        reviewed_by: req.user.user_id,
        reviewed_at: new Date(),
        completion_date: anyApproved ? new Date() : null
      });
    }

    res.json({
      message: `Assignment ${action}d successfully`,
      assignment: await TaskAssignment.findOne({
        where: {
          task_id: parseInt(taskId),
          user_id: parseInt(userId)
        },
        include: [
          { model: User, as: 'user', attributes: ['user_id', 'full_name', 'email'] }
        ]
      }),
      task: await Task.findByPk(taskId, {
        include: [
          { 
            model: User, 
            as: 'assignees', 
            attributes: ['user_id', 'full_name', 'email'],
            through: { 
              attributes: ['status', 'submission_link', 'submission_notes', 'submitted_at', 'review_notes', 'reviewed_at'],
              as: 'TaskAssignment'
            }
          }
        ]
      })
    });
  } catch (error) {
    console.error('Review individual assignment error:', error);
    res.status(500).json({ message: 'Failed to review assignment', error: error.message });
  }
};

module.exports = {
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
};
