const { Community, User, UserCommunity, Task, Event, Contribution, TaskAssignment } = require('../models');
const { Op } = require('sequelize');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// Get platform-wide analytics (platform admin only)
const getPlatformAnalytics = async (req, res) => {
  try {
    // Only platform admins can access platform analytics
    if (req.user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Only platform administrators can access platform analytics' });
    }

    const [
      totalUsers,
      totalCommunities,
      totalTasks,
      totalEvents,
      totalContributions,
      activeCommunities,
      activeUsers,
      completedTasks,
      pendingTasks
    ] = await Promise.all([
      User.count(),
      Community.count({ where: { is_active: true } }),
      Task.count(),
      Event.count(),
      Contribution.count(),
      Community.count({ 
        where: { 
          is_active: true,
          created_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
        } 
      }),
      User.count({
        where: {
          last_login: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
        }
      }),
      Task.count({ where: { status: 'completed' } }),
      Task.count({ where: { status: { [Op.in]: ['assigned', 'pending'] } } })
    ]);

    // Get top communities by member count
    const topCommunities = await Community.findAll({
      attributes: [
        'community_id',
        'name',
        'description',
        [Sequelize.fn('COUNT', Sequelize.col('members.user_id')), 'memberCount']
      ],
      include: [
        {
          model: User,
          as: 'members',
          attributes: [],
          required: false
        }
      ],
      group: ['Community.community_id'],
      order: [[Sequelize.fn('COUNT', Sequelize.col('members.user_id')), 'DESC']],
      limit: 5,
      where: { is_active: true }
    });

    // Get user growth data for last 6 months
    const userGrowthData = await User.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('user_id')), 'count']
      ],
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) // Last 6 months
        }
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'ASC']]
    });

    // Get task completion rate over time
    const taskCompletionData = await Task.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('task_id')), 'totalTasks'],
        [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = "completed" THEN 1 ELSE 0 END')), 'completedTasks']
      ],
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) // Last 6 months
        }
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m')],
      order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m'), 'ASC']]
    });

    // Get top contributors
    const topContributors = await User.findAll({
      attributes: [
        'user_id',
        'full_name',
        'email',
        'points',
        [Sequelize.fn('COUNT', Sequelize.col('assignedTasks.TaskAssignment.task_id')), 'completedTasks']
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
      limit: 10
    });

    res.json({
      overview: {
        totalUsers,
        totalCommunities,
        totalTasks,
        totalEvents,
        totalContributions,
        activeCommunities,
        activeUsers,
        completedTasks,
        pendingTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      topCommunities: topCommunities.map(community => ({
        ...community.toJSON(),
        memberCount: parseInt(community.dataValues.memberCount) || 0
      })),
      userGrowthData: userGrowthData.map(item => ({
        month: item.dataValues.month,
        count: parseInt(item.dataValues.count)
      })),
      taskCompletionData: taskCompletionData.map(item => ({
        month: item.dataValues.month,
        totalTasks: parseInt(item.dataValues.totalTasks),
        completedTasks: parseInt(item.dataValues.completedTasks),
        completionRate: Math.round((parseInt(item.dataValues.completedTasks) / parseInt(item.dataValues.totalTasks)) * 100) || 0
      })),
      topContributors: topContributors.map(user => ({
        ...user.toJSON(),
        completedTasks: parseInt(user.dataValues.completedTasks) || 0
      }))
    });
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch platform analytics', error: error.message });
  }
};

// Get community analytics for user's admin community
const getMyCommunityAnalytics = async (req, res) => {
  try {
    // Get the community where the user is admin
    let communityId;
    
    if (req.user.role === 'platform_admin') {
      // Platform admin can see analytics for any community, but let's get the first one
      const firstCommunity = await Community.findOne({ where: { is_active: true } });
      if (!firstCommunity) {
        return res.status(404).json({ message: 'No communities found' });
      }
      communityId = firstCommunity.community_id;
    } else if (req.user.role === 'community_admin') {
      // Community admin sees their own community
      communityId = req.user.community_id;
    } else {
      return res.status(403).json({ message: 'Only administrators can access community analytics' });
    }

    if (!communityId) {
      return res.status(404).json({ message: 'No community found for user' });
    }

    return getCommunityAnalyticsData(communityId, res);
  } catch (error) {
    console.error('Get my community analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch community analytics', error: error.message });
  }
};

// Get community analytics (community admin and platform admin only)
const getCommunityAnalytics = async (req, res) => {
  try {
    const { communityId } = req.params;

    // Check permissions
    if (req.user.role !== 'platform_admin' && 
        (req.user.role !== 'community_admin' || req.user.community_id !== parseInt(communityId))) {
      return res.status(403).json({ message: 'Insufficient permissions to access community analytics' });
    }

    return getCommunityAnalyticsData(parseInt(communityId), res);
  } catch (error) {
    console.error('Get community analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch community analytics', error: error.message });
  }
};

// Helper function to get community analytics data
const getCommunityAnalyticsData = async (communityId, res) => {
  try {

      const community = await Community.findByPk(communityId);
      if (!community) {
        return res.status(404).json({ message: 'Community not found' });
      }

      const [
        totalMembers,
        totalTasks,
        totalEvents,
        completedTasks,
        pendingTasks,
        activeMembers,
        totalContributions
      ] = await Promise.all([
        User.count({ where: { community_id: communityId } }),
        Task.count({ where: { community_id: communityId } }),
        Event.count({ where: { community_id: communityId } }),
        Task.count({ where: { community_id: communityId, status: 'completed' } }),
        Task.count({ where: { community_id: communityId, status: { [Op.in]: ['assigned', 'pending'] } } }),
        User.count({
          where: {
            community_id: communityId,
            last_login: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
          }
        }),
        Contribution.count({
          include: [{
            model: User,
            as: 'user',
            where: { community_id: communityId },
            attributes: []
          }]
        })
      ]);

      // Get member activity data - simplified version to avoid complex associations
      const memberActivity = await User.findAll({
        where: { community_id: communityId },
        attributes: [
          'user_id',
          'full_name',
          'email',
          'points',
          'last_login'
        ],
        order: [['points', 'DESC']],
        limit: 20
      });

      // Get completed tasks count for each member separately
      for (let member of memberActivity) {
        const completedTasksCount = await TaskAssignment.count({
          where: {
            user_id: member.user_id,
            status: 'completed'
          }
        });
        member.dataValues.completedTasks = completedTasksCount;
      }

      // Get task completion trend for last 3 months
      const taskTrend = await Task.findAll({
        attributes: [
          [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m-%d'), 'date'],
          [Sequelize.fn('COUNT', Sequelize.col('task_id')), 'totalTasks'],
          [Sequelize.fn('SUM', Sequelize.literal('CASE WHEN status = "completed" THEN 1 ELSE 0 END')), 'completedTasks']
        ],
        where: {
          community_id: communityId,
          created_at: {
            [Op.gte]: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        },
        group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m-%d')],
        order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('created_at'), '%Y-%m-%d'), 'ASC']]
      });

      res.json({
        community: {
          id: community.community_id,
          name: community.name,
          description: community.description,
          createdAt: community.created_at
        },
        overview: {
          totalMembers,
          totalTasks,
          totalEvents,
          completedTasks,
          pendingTasks,
          activeMembers,
          totalContributions,
          taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
          memberActivityRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0
        },
        memberActivity: memberActivity.map(member => ({
          ...member.toJSON(),
          completedTasks: member.dataValues.completedTasks || 0,
          isActive: member.last_login && new Date(member.last_login) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        })),
        taskTrend: taskTrend.map(item => ({
          date: item.dataValues.date,
          totalTasks: parseInt(item.dataValues.totalTasks),
          completedTasks: parseInt(item.dataValues.completedTasks),
          completionRate: Math.round((parseInt(item.dataValues.completedTasks) / parseInt(item.dataValues.totalTasks)) * 100) || 0
        }))
      });
    } catch (error) {
      console.error('Get community analytics data error:', error);
      res.status(500).json({ message: 'Failed to fetch community analytics data', error: error.message });
    }
};

module.exports = {
  getPlatformAnalytics,
  getCommunityAnalytics,
  getMyCommunityAnalytics
};