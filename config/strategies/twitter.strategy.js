var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

module.exports = function() {
    passport.use(new TwitterStrategy({
        consumerKey: 'L7XkZPm9OlxSrK4wyAhWdbFza',
        consumerSecret: 'fdbgMlGoJGFhsk6GPU74TpAPQltVHM3EG31buInqRmOi25UsDj',
        callbackURL: 'http://localhost:8000/auth/twitter/callback',
        passReqToCallback: true
    },
    function(req, token, tokenSecret, profile, done) {
        var user = {};

        user.displayName = profile.displayName;

        user.twitter = {};
        user.twitter.id = profile.id;
        user.twitter.token = token;
        user.twitter.tokenSecret = tokenSecret;

        console.log('Twitter profile', profile);

        done(null, user);
    }));
}
