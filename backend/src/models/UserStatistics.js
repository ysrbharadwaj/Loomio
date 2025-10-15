const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserStatistics = sequelize.define('UserStatistics', {
  stat_id: {
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
  community_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Communities',
      key: 'community_id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  tasks_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tasks_created: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  points_earned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  events_attended: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  attendance_status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
    allowNull: true
  }
}, {
  tableName: 'user_statistics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'date', 'community_id']
    },
    {
      fields: ['user_id', 'date']
    },
    {
      fields: ['community_id', 'date']
    },
    {
      fields: ['date']
    }
  ]
});

module.exports = UserStatistics;
