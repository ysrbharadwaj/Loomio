const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { 
  register, 
  login, 
  refreshToken,
  getMe, 
  updateProfile,
  logout,
  googleAuthSuccess,
  googleAuthFailure
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin 
} = require('../middleware/validation');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/refresh', refreshToken);

// Google OAuth routes - only if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false
    })
  );

  router.get('/google/callback',
    passport.authenticate('google', { 
      session: false,
      failureRedirect: '/api/auth/google/failure'
    }),
    googleAuthSuccess
  );

  router.get('/google/failure', googleAuthFailure);
} else {
  // Provide helpful error messages when OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(503).json({ 
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file.' 
    });
  });
  
  router.get('/google/callback', (req, res) => {
    res.status(503).json({ 
      error: 'Google OAuth is not configured.' 
    });
  });
  
  router.get('/google/failure', (req, res) => {
    res.status(503).json({ 
      error: 'Google OAuth is not configured.' 
    });
  });
}


// Protected routes
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.post('/logout', authenticateToken, logout);

module.exports = router;
