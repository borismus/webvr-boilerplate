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

        //user.email = profile.emails[0].value;
        //user.image = profile._json.image.url;
        user.displayName = profile.displayName;

        user.twitter = {};
        user.twitter.id = profile.id;
        user.twitter.token = token;

        console.log("TOKEN", token);
        console.log("SECRET", tokenSecret);

        console.log('Twitter profile', profile);

        done(null, user);
    }));
}
