const jwt = require('jsonwebtoken');
const { User, Community, UserCommunity, Contribution, Task, TaskAssignment } = require('../models');
const { Op } = require('sequelize');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, full_name, role = 'member', community_id } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate community_id if provided
    if (community_id) {
      const community = await Community.findByPk(community_id);
      if (!community) {
        return res.status(400).json({ message: 'Invalid community ID' });
      }
    }

    // Create new user
    const user = await User.create({
      email,
      password_hash: password, // Will be hashed by the model hook
      full_name,
      role,
      community_id
    });

    // Get user with community info
    const userWithCommunity = await User.findByPk(user.user_id, {
      include: [{ model: Community, as: 'community' }]
    });

    // Generate tokens
    const token = generateToken(user.user_id);
    const refreshToken = generateRefreshToken(user.user_id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user: userWithCommunity.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ 
      where: { email },
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

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }



    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const token = generateToken(user.user_id);
    const refreshToken = generateRefreshToken(user.user_id);

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    // Generate new tokens
    const newToken = generateToken(user.user_id);
    const newRefreshToken = generateRefreshToken(user.user_id);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      include: [{ model: Community, as: 'community' }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user stats
    const totalContributions = await Contribution.sum('points', {
      where: { user_id: user.user_id }
    });

    const completedTasks = await TaskAssignment.count({
      where: { 
        user_id: user.user_id,
        status: 'completed'
      }
    });

    const pendingTasks = await TaskAssignment.count({
      where: { 
        user_id: user.user_id,
        status: { [Op.in]: ['assigned', 'accepted'] }
      }
    });

    res.json({
      user: user.toJSON(),
      stats: {
        totalPoints: totalContributions || 0,
        completedTasks,
        pendingTasks
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile', error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, avatar_url } = req.body;
    const userId = req.user.user_id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user
    await user.update({
      full_name: full_name || user.full_name,
      avatar_url: avatar_url || user.avatar_url
    });

    // Get updated user with community
    const updatedUser = await User.findByPk(userId, {
      include: [{ model: Community, as: 'community' }]
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  logout
};
