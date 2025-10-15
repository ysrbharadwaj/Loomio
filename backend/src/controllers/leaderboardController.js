const { User, Community, UserCommunity, Contribution, Task } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Get leaderboard for a community or platform-wide
 */
const getLeaderboard = async (req, res) => {
  try {
    const { 
      period = 'all-time', // all-time, monthly, weekly
      community_id,
      limit = 20
    } = req.query;

    const user = req.user;
    
    // Determine which community to show leaderboard for
    let targetCommunityId = community_id;
    
    // If no community specified and user is not platform admin, use their community
    if (!targetCommunityId && user.role !== 'platform_admin') {
      const userCommunity = await UserCommunity.findOne({
        where: { user_id: user.user_id },
        attributes: ['community_id']
      });
      targetCommunityId = userCommunity?.community_id;
    }

    // Build where clause based on period
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { created_at: { [Op.gte]: weekAgo } };
    } else if (period === 'monthly') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { created_at: { [Op.gte]: monthAgo } };
    }

    // Build user filter based on community
    let userFilter = {};
    let communityUserIds = [];
    if (targetCommunityId) {
      const userCommunities = await UserCommunity.findAll({
        where: { community_id: targetCommunityId },
        attributes: ['user_id']
      });
      communityUserIds = userCommunities.map(uc => uc.user_id);
      
      // If no users in community, return empty leaderboard
      if (communityUserIds.length === 0) {
        return res.json({
          leaderboard: [],
          currentUserRank: null,
          period,
          community_id: targetCommunityId
        });
      }
      
      userFilter = {
        user_id: { [Op.in]: communityUserIds }
      };
    }

    // Get leaderboard based on period
    let leaderboardData;
    
    if (period === 'all-time') {
      // Use total points from users table - only for users in the community
      // Calculate tasks_completed dynamically from TaskAssignment table
      const usersWithTasks = await User.findAll({
        where: userFilter,
        attributes: [
          'user_id',
          'full_name',
          'email',
          'role',
          'points',
          'current_streak',
          'longest_streak',
          [sequelize.fn('COUNT', sequelize.col('assignedTasks.TaskAssignment.task_id')), 'tasks_completed']
        ],
        include: [
          {
            model: Task,
            as: 'assignedTasks',
            through: {
              where: { status: 'completed' },
              attributes: []
            },
            attributes: [],
            required: false
          }
        ],
        group: ['User.user_id'],
        order: [['points', 'DESC']],
        limit: parseInt(limit),
        subQuery: false
      });

      leaderboardData = usersWithTasks.map((user, index) => ({
        rank: index + 1,
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        points: user.points || 0,
        tasks_completed: parseInt(user.dataValues.tasks_completed) || 0,
        current_streak: user.current_streak || 0,
        longest_streak: user.longest_streak || 0
      }));
    } else {
      // Calculate points from contributions in the period
      const contributionWhere = {
        ...dateFilter,
        ...(targetCommunityId && { community_id: targetCommunityId })
      };
      
      // Also filter by community members if targetCommunityId is specified
      if (communityUserIds.length > 0) {
        contributionWhere.user_id = { [Op.in]: communityUserIds };
      }

      const contributions = await Contribution.findAll({
        where: contributionWhere,
        attributes: [
          'user_id',
          [sequelize.fn('SUM', sequelize.col('points')), 'period_points'],
          [sequelize.fn('COUNT', sequelize.col('contribution_id')), 'period_contributions']
        ],
        group: ['user_id'],
        order: [[sequelize.literal('period_points'), 'DESC']],
        limit: parseInt(limit),
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'full_name', 'email', 'role', 'points', 'current_streak']
        }]
      });

      leaderboardData = contributions.map((contrib, index) => ({
        rank: index + 1,
        user_id: contrib.user.user_id,
        full_name: contrib.user.full_name,
        email: contrib.user.email,
        role: contrib.user.role,
        points: parseInt(contrib.dataValues.period_points) || 0,
        total_points: contrib.user.points || 0,
        contributions: parseInt(contrib.dataValues.period_contributions) || 0,
        current_streak: contrib.user.current_streak || 0
      }));
    }

    // Get current user's rank
    let currentUserRank = null;
    if (user) {
      const userIndex = leaderboardData.findIndex(u => u.user_id === user.user_id);
      if (userIndex !== -1) {
        currentUserRank = userIndex + 1;
      } else {
        // User not in top N, calculate their actual rank
        if (period === 'all-time') {
          const betterUsers = await User.count({
            where: {
              ...userFilter,
              points: { [Op.gt]: user.points || 0 }
            }
          });
          currentUserRank = betterUsers + 1;
        }
      }
    }

    res.json({
      success: true,
      leaderboard: leaderboardData,
      currentUserRank,
      period,
      community_id: targetCommunityId,
      total: leaderboardData.length
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
};

/**
 * Get user's personal rank and stats
 */
const getUserRank = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.user_id;
    const { period = 'all-time' } = req.query;

    // Get user with completed tasks count
    const user = await User.findOne({
      where: { user_id: userId },
      attributes: [
        'user_id',
        'full_name',
        'email',
        'points',
        'current_streak',
        'longest_streak',
        [sequelize.fn('COUNT', sequelize.col('assignedTasks.TaskAssignment.task_id')), 'tasks_completed']
      ],
      include: [
        {
          model: Task,
          as: 'assignedTasks',
          through: {
            where: { status: 'completed' },
            attributes: []
          },
          attributes: [],
          required: false
        }
      ],
      group: ['User.user_id']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's community
    const userCommunity = await UserCommunity.findOne({
      where: { user_id: userId },
      include: [{
        model: Community,
        as: 'community',
        attributes: ['community_id', 'name']
      }]
    });

    const communityId = userCommunity?.community_id;

    // Calculate rank
    let rank;
    if (period === 'all-time') {
      const betterUsers = await User.count({
        where: {
          points: { [Op.gt]: user.points || 0 }
        }
      });
      rank = betterUsers + 1;

      // Community rank
      let communityRank = null;
      if (communityId) {
        const communityUserIds = await UserCommunity.findAll({
          where: { community_id: communityId },
          attributes: ['user_id']
        });
        
        const betterInCommunity = await User.count({
          where: {
            user_id: { [Op.in]: communityUserIds.map(uc => uc.user_id) },
            points: { [Op.gt]: user.points || 0 }
          }
        });
        communityRank = betterInCommunity + 1;
      }

      res.json({
        success: true,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          points: user.points || 0,
          tasks_completed: parseInt(user.dataValues.tasks_completed) || 0,
          current_streak: user.current_streak || 0,
          longest_streak: user.longest_streak || 0
        },
        rank,
        communityRank,
        community: userCommunity?.community,
        period
      });
    } else {
      // Period-based ranking
      const dateFilter = period === 'weekly' 
        ? { created_at: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        : { created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };

      const userPoints = await Contribution.sum('points', {
        where: {
          user_id: userId,
          ...dateFilter
        }
      });

      const betterUsers = await sequelize.query(
        `SELECT COUNT(DISTINCT user_id) as count 
         FROM contributions 
         WHERE created_at >= :startDate 
         GROUP BY user_id 
         HAVING SUM(points) > :userPoints`,
        {
          replacements: {
            startDate: dateFilter.created_at[Op.gte],
            userPoints: userPoints || 0
          },
          type: sequelize.QueryTypes.SELECT
        }
      );

      rank = (betterUsers[0]?.count || 0) + 1;

      res.json({
        success: true,
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          period_points: userPoints || 0,
          total_points: user.points || 0
        },
        rank,
        period
      });
    }
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user rank',
      error: error.message
    });
  }
};

module.exports = {
  getLeaderboard,
  getUserRank
};
