const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  notification_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  type: {
    type: DataTypes.ENUM(
      'task_created',
      'task_assigned', 
      'task_self_assigned',
      'task_submitted', 
      'task_approved', 
      'task_rejected',
      'task_updated',
      'task_deleted',
      'deadline_reminder', 
      'leave_approved', 
      'leave_rejected', 
      'event_created',
      'event_updated',
      'event_reminder', 
      'community_member_joined',
      'community_member_left',
      'general'
    ),
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  related_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  related_type: {
    type: DataTypes.ENUM('task', 'event', 'leave_request', 'community'),
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  },
  community_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Communities',
      key: 'community_id'
    }
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Notification;
