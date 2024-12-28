const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({ email: profile.emails[0].value });
            
            if (user) {
                return done(null, user);
            }
            
            // Create new user
            user = new User({
                username: profile.displayName,
                email: profile.emails[0].value,
                password: 'google-oauth', // You might want to handle this differently
                profilePicture: profile.photos[0].value
            });
            
            await user.save();
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    })
); 