const { User, UserStatistics, Task, TaskAssignment, Contribution, Community, UserCommunity, Event, Attendance } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Get user's personal statistics and performance metrics
 */
const getUserStatistics = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.user_id;
    const { 
      period = '30', // days
      community_id 
    } = req.query;

    // Authorization check
    if (req.user.user_id !== parseInt(userId) && req.user.role !== 'platform_admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own statistics'
      });
    }

    const user = await User.findByPk(userId, {
      attributes: ['user_id', 'full_name', 'email', 'points', 'total_tasks_completed', 'current_streak', 'longest_streak', 'created_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's community
    let targetCommunityId = community_id;
    if (!targetCommunityId) {
      const userCommunity = await UserCommunity.findOne({
        where: { user_id: userId },
        attributes: ['community_id']
      });
      targetCommunityId = userCommunity?.community_id;
    }

    // Date range for statistics
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get task statistics
    const taskWhere = {
      assigned_by: userId,
      created_at: { [Op.gte]: startDate }
    };
    if (targetCommunityId) {
      taskWhere.community_id = targetCommunityId;
    }

    const tasksCreated = await Task.count({ where: taskWhere });

    // Get assigned tasks statistics
    const assignedTasks = await TaskAssignment.findAll({
      where: { user_id: userId },
      include: [{
        model: Task,
        as: 'task',
        where: {
          created_at: { [Op.gte]: startDate },
          ...(targetCommunityId && { community_id: targetCommunityId })
        },
        attributes: ['task_id', 'status', 'priority', 'created_at', 'completion_date']
      }]
    });

    const tasksByStatus = {
      not_started: 0,
      in_progress: 0,
      submitted: 0,
      completed: 0,
      rejected: 0,
      cancelled: 0
    };

    const tasksByPriority = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0
    };

    assignedTasks.forEach(assignment => {
      if (assignment.task) {
        tasksByStatus[assignment.task.status]++;
        tasksByPriority[assignment.task.priority]++;
      }
    });

    // Get contribution statistics
    const contributionWhere = {
      user_id: userId,
      date: { [Op.gte]: startDate }
    };
    if (targetCommunityId) {
      contributionWhere.community_id = targetCommunityId;
    }

    const contributions = await Contribution.findAll({
      where: contributionWhere,
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('points')), 'total_points'],
        [sequelize.fn('COUNT', sequelize.col('contribution_id')), 'count']
      ],
      group: ['type']
    });

    const contributionsByType = {};
    let totalPointsInPeriod = 0;
    
    contributions.forEach(contrib => {
      contributionsByType[contrib.type] = {
        points: parseInt(contrib.dataValues.total_points) || 0,
        count: parseInt(contrib.dataValues.count) || 0
      };
      totalPointsInPeriod += parseInt(contrib.dataValues.total_points) || 0;
    });

    // Get daily statistics for chart data
    const dailyStats = await UserStatistics.findAll({
      where: {
        user_id: userId,
        date: { [Op.gte]: startDate },
        ...(targetCommunityId && { community_id: targetCommunityId })
      },
      attributes: ['date', 'tasks_completed', 'tasks_created', 'points_earned', 'events_attended', 'attendance_status'],
      order: [['date', 'ASC']]
    });

    // Get attendance statistics
    const attendanceWhere = {
      user_id: userId,
      date: { [Op.gte]: startDate }
    };
    if (targetCommunityId) {
      attendanceWhere.community_id = targetCommunityId;
    }

    const attendance = await Attendance.findAll({
      where: attendanceWhere,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('attendance_id')), 'count']
      ],
      group: ['status']
    });

    const attendanceByStatus = {};
    attendance.forEach(att => {
      attendanceByStatus[att.status] = parseInt(att.dataValues.count) || 0;
    });

    // Calculate completion rate
    const totalAssignedTasks = assignedTasks.length;
    const completedTasksCount = tasksByStatus.completed || 0;
    const completionRate = totalAssignedTasks > 0 
      ? Math.round((completedTasksCount / totalAssignedTasks) * 100) 
      : 0;

    // Get recent achievements
    const recentAchievements = [];
    
    if (user.current_streak >= 7) {
      recentAchievements.push({
        type: 'streak',
        title: 'On Fire! 🔥',
        description: `${user.current_streak} day streak`,
        date: new Date()
      });
    }
    
    if (user.total_tasks_completed >= 50) {
      recentAchievements.push({
        type: 'tasks',
        title: 'Task Master 🏆',
        description: '50+ tasks completed',
        date: new Date()
      });
    }

    if (user.points >= 500) {
      recentAchievements.push({
        type: 'points',
        title: 'Point Champion 💎',
        description: '500+ points earned',
        date: new Date()
      });
    }

    res.json({
      success: true,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        total_points: user.points || 0,
        total_tasks_completed: user.total_tasks_completed || 0,
        current_streak: user.current_streak || 0,
        longest_streak: user.longest_streak || 0,
        member_since: user.created_at
      },
      period: {
        days: daysAgo,
        start_date: startDate,
        end_date: new Date()
      },
      statistics: {
        tasks: {
          created: tasksCreated,
          assigned: totalAssignedTasks,
          completed: completedTasksCount,
          completion_rate: completionRate,
          by_status: tasksByStatus,
          by_priority: tasksByPriority
        },
        contributions: {
          total_points: totalPointsInPeriod,
          by_type: contributionsByType
        },
        attendance: attendanceByStatus,
        daily: dailyStats
      },
      achievements: recentAchievements,
      community_id: targetCommunityId
    });
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
};

/**
 * Get activity timeline for user
 */
const getUserActivity = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.user_id;
    const { limit = 20, offset = 0 } = req.query;

    // Get recent contributions
    const contributions = await Contribution.findAll({
      where: { user_id: userId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']],
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['task_id', 'title']
        },
        {
          model: Event,
          as: 'event',
          attributes: ['event_id', 'title']
        }
      ]
    });

    const activities = contributions.map(contrib => ({
      id: contrib.contribution_id,
      type: contrib.type,
      description: contrib.description,
      points: contrib.points,
      date: contrib.date,
      task: contrib.task,
      event: contrib.event
    }));

    res.json({
      success: true,
      activities,
      total: activities.length
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activity',
      error: error.message
    });
  }
};

module.exports = {
  getUserStatistics,
  getUserActivity
};
