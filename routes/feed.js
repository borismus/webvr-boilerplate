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
            var tweets = [];
            for(var i = 0; i < results.length; i++) {
                tweets.push({
                    text: results[i].text,
                    user: {
                        name: results[i].user.name,
                        screen_name: results[i].user.screen_name,
                        profile_image_url: results[i].user.profile_image_url_https,
                        text_color: results[i].user.profile_text_color,
                        profile_banner_url: results[i].user.profile_banner_url
                    }
                });
                console.log(results[i]);
            }

            res.render(path.resolve(__dirname + '/../views/feed.ejs'), { timeline: tweets });
        }
    )
});

module.exports = router;
