const { User, Community, Task, TaskAssignment, Contribution, Event, Attendance } = require('../models');
const { Op } = require('sequelize');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      role = '', 
      community_id = '',
      search = '',
      is_active = ''
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Filter by community if user is community admin
    if (req.user.role === 'community_admin') {
      whereClause.community_id = req.user.community_id;
    } else if (community_id) {
      whereClause.community_id = community_id;
    }

    if (role) {
      whereClause.role = role;
    }

    if (is_active !== '') {
      whereClause.is_active = is_active === 'true';
    }

    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password_hash'] },
      include: [
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      users: users.rows,
      pagination: {
        total: users.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(users.count / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name', 'description'] 
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role !== 'platform_admin' && 
        req.user.role !== 'community_admin' && 
        req.user.user_id !== parseInt(id)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, is_active, community_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    const isSelf = req.user.user_id === parseInt(id);
    const isAdmin = req.user.role === 'platform_admin' || 
                   (req.user.role === 'community_admin' && user.community_id === req.user.community_id);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Update data
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    
    // Only admins can update role, is_active, and community_id
    if (isAdmin) {
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (community_id !== undefined) updateData.community_id = community_id;
    }

    await user.update(updateData);

    // Get updated user with community
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { 
          model: Community, 
          as: 'community', 
          attributes: ['community_id', 'name'] 
        }
      ]
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

// Delete user (platform admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Deactivate user instead of deleting
    await user.update({ is_active: false });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// Get user stats
const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions
    if (req.user.role !== 'platform_admin' && 
        req.user.role !== 'community_admin' && 
        req.user.user_id !== parseInt(id)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Get user statistics
    const [
      totalContributions,
      completedTasks,
      pendingTasks,
      totalEvents,
      attendanceCount
    ] = await Promise.all([
      Contribution.sum('points', { where: { user_id: id } }),
      TaskAssignment.count({ 
        where: { user_id: id, status: 'completed' } 
      }),
      TaskAssignment.count({ 
        where: { 
          user_id: id, 
          status: { [Op.in]: ['assigned', 'accepted'] } 
        } 
      }),
      Event.count({ where: { created_by: id } }),
      Attendance.count({ 
        where: { 
          user_id: id, 
          status: 'present' 
        } 
      })
    ]);

    // Get recent contributions
    const recentContributions = await Contribution.findAll({
      where: { user_id: id },
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    res.json({
      stats: {
        totalPoints: totalContributions || 0,
        completedTasks,
        pendingTasks,
        totalEvents,
        attendanceCount,
        rank: 1 // This would need to be calculated based on community
      },
      recentContributions: recentContributions
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Failed to fetch user stats', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
};
