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
/*
app.get('/', function(request, response) {
    response.sendFile(__dirname + '/views/index.html');
});
*/

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

/*
var io = require('socket.io').listen(server);
io.on('connection', function(socket){
    console.log('user connected');
    var params = {screen_name: 'butterfieldjb'};
    client.get('statuses/user_timeline', params, function(error, tweets, response){
        if(!error){
            for(var i = 0; i < tweets.length; i++){
                io.emit('message', {
                    'user': tweets[i]['user']['screen_name'],
                    'text': tweets[i]['text']
                });
            }
        }
    });

    var params = {track: 'donald trump'};
    client.stream('statuses/filter', params, function(stream){
        stream.on('data', function(tweet){
            io.emit('message', {
                'user':tweet['user']['screen_name'],
                'text':tweet['text']
            });
        });

        stream.on('error', function(error){
            console.log(error)
        });
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});
*/
