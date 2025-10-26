const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User, Community } = require('../models');

/**
 * Google OAuth Configuration
 */
// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        passReqToCallback: true
      },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Extract user information from Google profile
        const email = profile.emails[0].value;
        const fullName = profile.displayName;
        const googleId = profile.id;
        const profilePicture = profile.photos[0]?.value;

        // Check if user already exists
        let user = await User.findOne({ 
          where: { email },
          include: [
            { 
              model: Community, 
              as: 'communities',
              through: { 
                where: { is_active: true },
                attributes: ['role', 'joined_at']
              },
              required: false
            }
          ]
        });

        if (user) {
          // Update Google ID and profile picture if not set
          if (!user.google_id) {
            user.google_id = googleId;
          }
          if (!user.profile_picture && profilePicture) {
            user.profile_picture = profilePicture;
          }
          await user.save();
        } else {
          // Create new user with Google account
          user = await User.create({
            email,
            full_name: fullName,
            google_id: googleId,
            profile_picture: profilePicture,
            password_hash: null, // No password for Google OAuth users
            role: 'member',
            email_verified: true // Google accounts are pre-verified
          });

          // Reload user with communities
          user = await User.findByPk(user.user_id, {
            include: [
              { 
                model: Community, 
                as: 'communities',
                through: { 
                  where: { is_active: true },
                  attributes: ['role', 'joined_at']
                },
                required: false
              }
            ]
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findByPk(id, {
        include: [
          { 
            model: Community, 
            as: 'communities',
            through: { 
              where: { is_active: true },
              attributes: ['role', 'joined_at']
            },
            required: false
          }
        ]
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
} else {
  console.warn('⚠️  Google OAuth is disabled - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set in .env');
}

module.exports = passport;
