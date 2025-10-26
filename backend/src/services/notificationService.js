const { Notification, User, UserCommunity } = require('../models');
const emailService = require('./emailService');

/**
 * Notification Service
 * Centralizes all notification creation logic with email integration
 */

/**
 * Send email notification based on user preferences
 */
const sendEmailIfEnabled = async (user, notificationData) => {
  try {
    if (!user.email) {
      return;
    }

    // Check if user has email notifications enabled based on notification type
    const prefs = user.email_preferences || {
      notifications: true,
      taskAssignments: true,
      taskReminders: true,
      communityUpdates: true
    };

    // Map notification types to preference keys
    let shouldSend = prefs.notifications; // Default to general notifications preference

    if (notificationData.type === 'task_assigned' || notificationData.type === 'task_self_assigned') {
      shouldSend = prefs.taskAssignments !== false;
    } else if (notificationData.type === 'deadline_reminder') {
      shouldSend = prefs.taskReminders !== false;
    } else if (notificationData.type.includes('community')) {
      shouldSend = prefs.communityUpdates !== false;
    }

    if (!shouldSend) {
      return;
    }

    // Map notification types to email templates
    const emailSubject = notificationData.title;
    const emailContent = notificationData.message;

    // Send email asynchronously (don't wait for it)
    emailService.sendEmail(user.email, emailSubject, emailContent, emailContent)
      .catch(err => console.error('Email notification failed:', err));
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

/**
 * Create a notification for a specific user
 */
const createNotification = async ({ userId, title, message, type, relatedId, relatedType, priority, communityId }) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      title,
      message,
      type,
      related_id: relatedId,
      related_type: relatedType,
      priority: priority || 'medium',
      community_id: communityId
    });

    // Send email notification
    const user = await User.findByPk(userId, { attributes: ['user_id', 'email', 'full_name'] });
    if (user) {
      await sendEmailIfEnabled(user, { title, message, type });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 */
const createBulkNotifications = async (notifications) => {
  try {
    const createdNotifications = await Notification.bulkCreate(notifications);

    // Send email notifications to all users
    const userIds = [...new Set(notifications.map(n => n.user_id))];
    const users = await User.findAll({
      where: { user_id: userIds },
      attributes: ['user_id', 'email', 'full_name']
    });

    // Map user_id to user object for quick lookup
    const userMap = {};
    users.forEach(user => {
      userMap[user.user_id] = user;
    });

    // Send emails asynchronously
    notifications.forEach(notif => {
      const user = userMap[notif.user_id];
      if (user) {
        sendEmailIfEnabled(user, notif);
      }
    });

    return createdNotifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Get all community admins for a specific community
 */
const getCommunityAdmins = async (communityId) => {
  try {
    const adminUsers = await UserCommunity.findAll({
      where: {
        community_id: communityId,
        role: 'community_admin',
        is_active: true
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'full_name', 'email']
      }]
    });

    return adminUsers.map(uc => uc.user);
  } catch (error) {
    console.error('Error getting community admins:', error);
    return [];
  }
};

/**
 * Get all members of a specific community
 */
const getCommunityMembers = async (communityId, excludeUserIds = []) => {
  try {
    const whereClause = {
      community_id: communityId,
      is_active: true
    };

    if (excludeUserIds.length > 0) {
      whereClause.user_id = { [require('sequelize').Op.notIn]: excludeUserIds };
    }

    const members = await UserCommunity.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['user_id', 'full_name', 'email']
      }]
    });

    return members.map(m => m.user);
  } catch (error) {
    console.error('Error getting community members:', error);
    return [];
  }
};

/**
 * Notify when a new task is created
 */
const notifyTaskCreated = async (task, creatorName, communityName) => {
  try {
    // Notify all community members about the new task
    const members = await getCommunityMembers(task.community_id, [task.assigned_by]);
    
    const notifications = members.map(member => ({
      user_id: member.user_id,
      title: 'New Task Available',
      message: `A new task "${task.title}" has been created by ${creatorName} in ${communityName}.`,
      type: 'task_created',
      related_id: task.task_id,
      related_type: 'task',
      priority: task.priority === 'high' ? 'high' : 'medium',
      community_id: task.community_id
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyTaskCreated:', error);
  }
};

/**
 * Notify when a task is assigned to users
 */
const notifyTaskAssigned = async (task, assignedUserIds, assignedByName, communityName) => {
  try {
    const notifications = assignedUserIds.map(userId => ({
      user_id: userId,
      title: 'Task Assigned',
      message: `You have been assigned to task "${task.title}" by ${assignedByName} in ${communityName}.`,
      type: 'task_assigned',
      related_id: task.task_id,
      related_type: 'task',
      priority: task.priority === 'high' ? 'high' : 'medium',
      community_id: task.community_id
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyTaskAssigned:', error);
  }
};

/**
 * Notify community admins when someone self-assigns a task
 */
const notifyTaskSelfAssigned = async (task, userName, communityName) => {
  try {
    const admins = await getCommunityAdmins(task.community_id);
    
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      title: 'Task Self-Assigned',
      message: `${userName} has self-assigned to task "${task.title}" in ${communityName}.`,
      type: 'task_self_assigned',
      related_id: task.task_id,
      related_type: 'task',
      priority: 'medium',
      community_id: task.community_id
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyTaskSelfAssigned:', error);
  }
};

/**
 * Notify admins when a task is submitted for review
 */
const notifyTaskSubmitted = async (task, userName, communityName) => {
  try {
    const admins = await getCommunityAdmins(task.community_id);
    
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      title: 'Task Submitted for Review',
      message: `${userName} has submitted task "${task.title}" for review in ${communityName}.`,
      type: 'task_submitted',
      related_id: task.task_id,
      related_type: 'task',
      priority: 'high',
      community_id: task.community_id
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyTaskSubmitted:', error);
  }
};

/**
 * Notify assignees when a task is approved
 */
const notifyTaskApproved = async (task, assigneeIds, reviewerName, communityName) => {
  try {
    const notifications = assigneeIds.map(userId => ({
      user_id: userId,
      title: 'Task Approved',
      message: `Congratulations! Your submission for task "${task.title}" has been approved by ${reviewerName} in ${communityName}.`,
      type: 'task_approved',
      related_id: task.task_id,
      related_type: 'task',
      priority: 'high',
      community_id: task.community_id
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyTaskApproved:', error);
  }
};

/**
 * Notify assignees when a task is rejected
 */
const notifyTaskRejected = async (task, assigneeIds, reviewerName, reviewNotes, communityName) => {
  try {
    const message = reviewNotes 
      ? `Your submission for task "${task.title}" has been rejected by ${reviewerName} in ${communityName}. Reason: ${reviewNotes}`
      : `Your submission for task "${task.title}" has been rejected by ${reviewerName} in ${communityName}.`;

    const notifications = assigneeIds.map(userId => ({
      user_id: userId,
      title: 'Task Rejected',
      message,
      type: 'task_rejected',
      related_id: task.task_id,
      related_type: 'task',
      priority: 'high',
      community_id: task.community_id
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyTaskRejected:', error);
  }
};

/**
 * Notify assignees when a task is updated
 */
const notifyTaskUpdated = async (task, assigneeIds, updatedByName, communityName) => {
  try {
    if (!assigneeIds || assigneeIds.length === 0) return;

    const notifications = assigneeIds.map(userId => ({
      user_id: userId,
      title: 'Task Updated',
      message: `Task "${task.title}" has been updated by ${updatedByName} in ${communityName}. Please review the changes.`,
      type: 'task_updated',
      related_id: task.task_id,
      related_type: 'task',
      priority: 'medium',
      community_id: task.community_id
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyTaskUpdated:', error);
  }
};

/**
 * Notify assignees when a task is deleted
 */
const notifyTaskDeleted = async (taskTitle, assigneeIds, deletedByName, communityId, communityName) => {
  try {
    if (!assigneeIds || assigneeIds.length === 0) return;

    const notifications = assigneeIds.map(userId => ({
      user_id: userId,
      title: 'Task Deleted',
      message: `Task "${taskTitle}" has been deleted by ${deletedByName} in ${communityName}.`,
      type: 'task_deleted',
      related_id: null,
      related_type: 'task',
      priority: 'medium',
      community_id: communityId
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyTaskDeleted:', error);
  }
};

/**
 * Notify when a new event is created
 */
const notifyEventCreated = async (event, creatorName, communityName) => {
  try {
    const members = await getCommunityMembers(event.community_id, [event.created_by]);
    
    const notifications = members.map(member => ({
      user_id: member.user_id,
      title: 'New Event Created',
      message: `A new event "${event.title}" has been scheduled by ${creatorName} in ${communityName}.`,
      type: 'event_created',
      related_id: event.event_id,
      related_type: 'event',
      priority: 'medium',
      community_id: event.community_id
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyEventCreated:', error);
  }
};

/**
 * Notify when an event is updated
 */
const notifyEventUpdated = async (event, updatedByName, communityName) => {
  try {
    const members = await getCommunityMembers(event.community_id, [event.created_by]);
    
    const notifications = members.map(member => ({
      user_id: member.user_id,
      title: 'Event Updated',
      message: `Event "${event.title}" has been updated by ${updatedByName} in ${communityName}.`,
      type: 'event_updated',
      related_id: event.event_id,
      related_type: 'event',
      priority: 'medium',
      community_id: event.community_id
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyEventUpdated:', error);
  }
};

/**
 * Notify admins when a new member joins the community
 */
const notifyMemberJoined = async (communityId, userName, communityName) => {
  try {
    const admins = await getCommunityAdmins(communityId);
    
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      title: 'New Member Joined',
      message: `${userName} has joined ${communityName}.`,
      type: 'community_member_joined',
      related_id: communityId,
      related_type: 'community',
      priority: 'low',
      community_id: communityId
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyMemberJoined:', error);
  }
};

/**
 * Notify admins when a member leaves the community
 */
const notifyMemberLeft = async (communityId, userName, communityName) => {
  try {
    const admins = await getCommunityAdmins(communityId);
    
    const notifications = admins.map(admin => ({
      user_id: admin.user_id,
      title: 'Member Left',
      message: `${userName} has left ${communityName}.`,
      type: 'community_member_left',
      related_id: communityId,
      related_type: 'community',
      priority: 'low',
      community_id: communityId
    }));

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }
  } catch (error) {
    console.error('Error in notifyMemberLeft:', error);
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getCommunityAdmins,
  getCommunityMembers,
  notifyTaskCreated,
  notifyTaskAssigned,
  notifyTaskSelfAssigned,
  notifyTaskSubmitted,
  notifyTaskApproved,
  notifyTaskRejected,
  notifyTaskUpdated,
  notifyTaskDeleted,
  notifyEventCreated,
  notifyEventUpdated,
  notifyMemberJoined,
  notifyMemberLeft
};
