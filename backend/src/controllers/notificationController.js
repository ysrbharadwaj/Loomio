const { Notification, User, Community } = require('../models');
const { Op } = require('sequelize');

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, is_read = '', type = '' } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.user_id;

    const whereClause = { user_id: userId };

    if (is_read !== '') {
      whereClause.is_read = is_read === 'true';
    }

    if (type) {
      whereClause.type = type;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      include: [
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

    res.json({
      notifications: notifications.rows,
      pagination: {
        total: notifications.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(notifications.count / limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await Notification.findOne({
      where: { notification_id: id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({ 
      is_read: true, 
      read_at: new Date() 
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.user_id;

    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read', error: error.message });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const notification = await Notification.findOne({
      where: { notification_id: id, user_id: userId }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.destroy();

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};

// Get notification count
const getNotificationCount = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const unreadCount = await Notification.count({
      where: { user_id: userId, is_read: false }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({ message: 'Failed to get notification count', error: error.message });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationCount
};
