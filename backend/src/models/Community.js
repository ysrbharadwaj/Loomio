const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Community = sequelize.define('Community', {
  community_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id'
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {
      allowSelfRegistration: false,
      requireApproval: true,
      maxMembers: null,
      taskPoints: {
        completion: 10,
        eventAttendance: 5,
        discussionParticipation: 2
      }
    }
  },
  community_code: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
    validate: {
      len: [6, 6],
      isAlphanumeric: true
    }
  }
}, {
  tableName: 'communities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (community) => {
      // Generate unique 6-character community code
      if (!community.community_code) {
        let code;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (!isUnique && attempts < maxAttempts) {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          code = '';
          for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          
          try {
            // Check if code already exists using the Community model directly
            const existingCommunity = await Community.findOne({ 
              where: { community_code: code },
              raw: true 
            });
            
            if (!existingCommunity) {
              isUnique = true;
            }
          } catch (error) {
            // If there's an error checking, just continue with attempts
            console.warn('Error checking community code uniqueness:', error);
          }
          attempts++;
        }
        
        // Fallback if we couldn't generate a unique code
        if (!isUnique) {
          code = Date.now().toString(36).substr(-6).toUpperCase();
        }
        
        community.community_code = code;
      }
    }
  }
});

module.exports = Community;
