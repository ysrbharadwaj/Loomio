const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCommunity = sequelize.define('UserCommunity', {
  id: {
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
  role: {
    type: DataTypes.ENUM('community_admin', 'member'),
    allowNull: false,
    defaultValue: 'member'
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'user_communities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'community_id']
    }
  ]
});

module.exports = UserCommunity;