var passport = require('passport');

module.exports = function(app) {

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, done) {
        console.log("SERIALIZING");

        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        console.log("DESERIALIZING");

        done(null, user);
    });

    require('./strategies/twitter.strategy')();
}
