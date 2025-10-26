const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true // Allow null for Google OAuth users
  },
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  profile_picture: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  role: {
    type: DataTypes.ENUM('platform_admin', 'community_admin', 'member'),
    allowNull: false,
    defaultValue: 'member'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  join_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  community_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  email_preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      notifications: true,        // Receive email for all notifications
      taskAssignments: true,      // Receive email when assigned to tasks
      taskReminders: true,        // Receive deadline reminder emails
      communityUpdates: true,     // Receive community-related emails
      weeklyDigest: false         // Receive weekly summary email
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(10);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function(candidatePassword) {
  // If password_hash is null (Google OAuth user), return false
  if (!this.password_hash) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password_hash;
  return values;
};

module.exports = User;
