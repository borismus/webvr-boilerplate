var express = require('express');
var path = require('path');
var router = express.Router();

var env = require('../env.js');

var twitter = require('../services/twitter')(env.CONSUMER_KEY, env.CONSUMER_SECRET);

router.use('/', function(req, res, next) {
    // If passport has not attached the user
    // redirect them to the sign on page
    if(!req.user) {
        res.redirect('/');
    }
    next();
});

/* GET users listing. */
router.get('/', function(req, res, next) {
    console.log("USER", req.user);

    twitter.getUserHomeTimeline(
        req.user.twitter.token,
        req.user.twitter.tokenSecret,
        req.user.twitter.id,
        function(results) {
            console.log("RESULTS");
            console.log(results);

            var texts = [];
            for(var i = 0; i < results.length; i++) {
                texts.push({text: results[i].text});
            }

            res.render(path.resolve(__dirname + '/../views/feed.ejs'), { timeline: texts });
        }
    )
});

module.exports = router;
