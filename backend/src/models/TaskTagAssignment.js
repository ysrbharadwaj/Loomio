const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaskTagAssignment = sequelize.define('TaskTagAssignment', {
  assignment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tasks',
      key: 'task_id'
    }
  },
  tag_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'TaskTags',
      key: 'tag_id'
    }
  }
}, {
  tableName: 'task_tag_assignments',
  timestamps: true,
  createdAt: 'assigned_at',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['task_id', 'tag_id']
    },
    {
      fields: ['task_id']
    },
    {
      fields: ['tag_id']
    }
  ]
});

module.exports = TaskTagAssignment;
