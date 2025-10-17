const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contribution = sequelize.define('Contribution', {
  contribution_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'tasks',
      key: 'task_id'
    }
  },
  event_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'events',
      key: 'event_id'
    }
  },
  points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  type: {
    type: DataTypes.ENUM('task_completion', 'event_attendance', 'discussion_participation', 'other'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  community_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'communities',
      key: 'community_id'
    }
  }
}, {
  tableName: 'contributions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Contribution;
