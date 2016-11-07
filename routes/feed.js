var express = require('express');
var path = require('path');
var router = express.Router();

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
    /*
    res.render('users', {
        user: {
            name: req.user.displayName,
            image: req.user.image
        }
    });
    */

    res.sendFile(path.resolve(__dirname + '/../views/index.html'));
});

module.exports = router;
