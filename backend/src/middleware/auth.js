const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!user.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Platform admin only
const requirePlatformAdmin = requireRole(['platform_admin']);

// Community admin or platform admin
const requireCommunityAdmin = requireRole(['community_admin', 'platform_admin']);

// Admin (community or platform)
const requireAdmin = requireRole(['community_admin', 'platform_admin']);

// Community member (any authenticated user)
const requireMember = authenticateToken;

module.exports = {
  authenticateToken,
  requireRole,
  requirePlatformAdmin,
  requireCommunityAdmin,
  requireAdmin,
  requireMember
};
