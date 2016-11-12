var express = require('express');
var path = require('path');
var Twitter = require('twitter');
var passport = require('passport');
var session = require('express-session');
var routes = require('./routes/index');
var auth = require('./routes/auth');
var feed = require('./routes/feed');
var app = express();
var port = process.env.PORT || 8000;

// view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({secret: 'roxana'}));

require('./config/passport')(app);

app.use('/', routes);
app.use('/auth', auth);
app.use('/feed', feed);

app.use(express.static(path.join(__dirname, '')));
//app.use('/images', express.static(__dirname + 'images'));

if(!process.env.CONSUMER_KEY){
    var env = require('./env.js');
}
var client = new Twitter({
    consumer_key: env.CONSUMER_KEY,
    consumer_secret: env.CONSUMER_SECRET,
    access_token_key: env.ACCESS_TOKEN_KEY,
    access_token_secret: env.ACCESS_TOKEN_SECRET,
});

var server = require('http').createServer(app).listen(port, function(){
    console.log('listening on ' + port);
});
