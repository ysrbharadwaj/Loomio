const { Community, User, UserCommunity, Task, Event, Contribution } = require('../models');
const { Op } = require('sequelize');
const notificationService = require('../services/notificationService');

// Get all communities
const getAllCommunities = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', is_active = true } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      is_active: is_active === 'true'
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const communities = await Community.findAndCountAll({
      where: whereClause,
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['user_id', 'full_name', 'email'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    // Get member counts separately for each community
    for (let community of communities.rows) {
      const memberCount = await User.count({ 
        where: { community_id: community.community_id } 
      });
      community.dataValues.memberCount = memberCount;
    }

    res.json({
      communities: communities.rows,
      pagination: {
        total: communities.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(communities.count / limit)
      }
    });
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ message: 'Failed to fetch communities', error: error.message });
  }
};

// Get community by ID
const getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findByPk(id, {
      include: [
        { model: User, as: 'creator', attributes: ['user_id', 'full_name', 'email'] },
        { model: User, as: 'members', attributes: ['user_id', 'full_name', 'email', 'role', 'points'] }
      ]
    });

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Get community stats
    const memberCount = await User.count({ where: { community_id: id } });
    const taskCount = await Task.count({ where: { community_id: id } });
    const eventCount = await Event.count({ where: { community_id: id } });

    res.json({
      community: community.toJSON(),
      stats: {
        memberCount,
        taskCount,
        eventCount
      }
    });
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ message: 'Failed to fetch community', error: error.message });
  }
};

// Create new community
const createCommunity = async (req, res) => {
  try {
    // Only platform admins and community admins can create communities
    if (req.user.role !== 'platform_admin' && req.user.role !== 'community_admin') {
      return res.status(403).json({ message: 'Only administrators can create communities' });
    }

    const { name, description, settings } = req.body;
    const created_by = req.user.user_id;

    // Generate community code as fallback
    const generateCommunityCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    const community = await Community.create({
      name,
      description,
      created_by,
      community_code: generateCommunityCode(),
      settings: settings || {}
    });

    // Add creator to the community as admin through UserCommunity table
    await UserCommunity.create({
      user_id: created_by,
      community_id: community.community_id,
      role: 'community_admin'
    });

    // Get community with creator info
    const communityWithCreator = await Community.findByPk(community.community_id, {
      include: [{ model: User, as: 'creator', attributes: ['user_id', 'full_name', 'email'] }]
    });

    // Get updated user with all communities
    const updatedUser = await User.findByPk(created_by, {
      include: [
        { 
          model: Community, 
          as: 'communities',
          through: { 
            where: { is_active: true },
            attributes: ['role', 'joined_at']
          }
        }
      ]
    });

    res.status(201).json({
      message: 'Community created successfully',
      community: communityWithCreator.toJSON(),
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ message: 'Failed to create community', error: error.message });
  }
};

// Update community
const updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, settings, is_active } = req.body;

    const community = await Community.findByPk(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check permissions (only creator or platform admin can update)
    if (community.created_by !== req.user.user_id && req.user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await community.update({
      name: name || community.name,
      description: description !== undefined ? description : community.description,
      settings: settings || community.settings,
      is_active: is_active !== undefined ? is_active : community.is_active
    });

    // Get updated community with creator info
    const updatedCommunity = await Community.findByPk(id, {
      include: [{ model: User, as: 'creator', attributes: ['user_id', 'full_name', 'email'] }]
    });

    res.json({
      message: 'Community updated successfully',
      community: updatedCommunity.toJSON()
    });
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({ message: 'Failed to update community', error: error.message });
  }
};

// Delete community
const deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;

    const community = await Community.findByPk(id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    // Check permissions (only creator or platform admin can delete)
    if (community.created_by !== req.user.user_id && req.user.role !== 'platform_admin') {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await community.update({ is_active: false });

    res.json({ message: 'Community deactivated successfully' });
  } catch (error) {
    console.error('Delete community error:', error);
    res.status(500).json({ message: 'Failed to delete community', error: error.message });
  }
};

// Join community
const joinCommunity = async (req, res) => {
  try {
    const { community_code } = req.body;
    const userId = req.user.user_id;

    // Find community by community code
    const community = await Community.findOne({ 
      where: { 
        community_code: community_code.toUpperCase(),
        is_active: true
      }
    });

    if (!community) {
      return res.status(404).json({ message: 'Invalid community code' });
    }

    // Check if user has any existing membership (active or inactive)
    let existingMembership = await UserCommunity.findOne({
      where: {
        user_id: userId,
        community_id: community.community_id
      }
    });

    if (existingMembership) {
      if (existingMembership.is_active) {
        return res.status(400).json({ message: 'You are already a member of this community' });
      } else {
        // Reactivate inactive membership
        await existingMembership.update({
          is_active: true,
          joined_at: new Date()
        });
      }
    } else {
      // Create new membership
      await UserCommunity.create({
        user_id: userId,
        community_id: community.community_id,
        role: 'member' // Regular members get 'member' role, only creator gets 'community_admin'
      });
    }

    // Get updated user with all communities
    const updatedUser = await User.findByPk(userId, {
      include: [
        { 
          model: Community, 
          as: 'communities',
          through: { 
            where: { is_active: true },
            attributes: ['role', 'joined_at']
          }
        }
      ]
    });

    // Notify community admins about new member
    try {
      const user = await User.findByPk(userId);
      await notificationService.notifyMemberJoined(
        community.community_id,
        user.full_name,
        community.name
      );
    } catch (notifError) {
      console.error('Error sending member joined notification:', notifError);
    }

    res.json({
      message: 'Successfully joined community',
      user: updatedUser.toJSON(),
      community: community.toJSON()
    });
  } catch (error) {
    console.error('Join community error:', error);
    res.status(500).json({ message: 'Failed to join community', error: error.message });
  }
};

// Leave community
const leaveCommunity = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { community_id } = req.body;

    if (!community_id) {
      return res.status(400).json({ message: 'Community ID is required' });
    }

    // Check if user is a member of this community
    const membership = await UserCommunity.findOne({
      where: {
        user_id: userId,
        community_id: community_id,
        is_active: true
      }
    });

    if (!membership) {
      return res.status(400).json({ message: 'You are not a member of this community' });
    }

    // Check if user is the creator of the community
    const community = await Community.findByPk(community_id);
    if (community && community.created_by === userId) {
      return res.status(400).json({ message: 'Community creators cannot leave their own community. Consider transferring ownership first.' });
    }

    // Leave community by deactivating membership
    await membership.update({ is_active: false });

    // Get updated user with remaining communities
    const updatedUser = await User.findByPk(userId, {
      include: [
        { 
          model: Community, 
          as: 'communities',
          through: { 
            where: { is_active: true },
            attributes: ['role', 'joined_at']
          }
        }
      ]
    });

    // Notify community admins about member leaving
    try {
      const user = await User.findByPk(userId);
      await notificationService.notifyMemberLeft(
        community_id,
        user.full_name,
        community.name
      );
    } catch (notifError) {
      console.error('Error sending member left notification:', notifError);
    }

    res.json({
      message: 'Successfully left community',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Leave community error:', error);
    res.status(500).json({ message: 'Failed to leave community', error: error.message });
  }
};

// Get community members
const getCommunityMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, role = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause for UserCommunity
    const ucWhereClause = { 
      community_id: parseInt(id),
      is_active: true 
    };

    if (role) {
      ucWhereClause.role = role;
    }

    // Build where clause for User (for search)
    const userWhereClause = {};
    if (search) {
      userWhereClause[Op.or] = [
        { full_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Get community members through UserCommunity junction table
    const { UserCommunity } = require('../models');
    const members = await UserCommunity.findAndCountAll({
      where: ucWhereClause,
      include: [{
        model: User,
        as: 'user',
        where: userWhereClause,
        attributes: ['user_id', 'full_name', 'email', 'points', 'join_date']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['joined_at', 'ASC']]
    });

    // Format the response to include role from UserCommunity
    const formattedMembers = members.rows.map(uc => ({
      user_id: uc.user.user_id,
      full_name: uc.user.full_name,
      email: uc.user.email,
      points: uc.user.points,
      join_date: uc.user.join_date,
      role: uc.role,
      joined_at: uc.joined_at
    }));

    res.json({
      members: formattedMembers,
      pagination: {
        total: members.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(members.count / limit)
      }
    });
  } catch (error) {
    console.error('Get community members error:', error);
    res.status(500).json({ message: 'Failed to fetch community members', error: error.message });
  }
};

// Update member role
const updateMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    // Check if user is community admin or platform admin
    if (req.user.role !== 'platform_admin') {
      const userCommunity = await User.findByPk(req.user.user_id);
      if (userCommunity.community_id !== parseInt(id)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }
    }

    const member = await User.findOne({
      where: {
        user_id: userId,
        community_id: id
      }
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await member.update({ role });

    res.json({
      message: 'Member role updated successfully',
      member: member.toJSON()
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Failed to update member role', error: error.message });
  }
};

module.exports = {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityMembers,
  updateMemberRole
};
