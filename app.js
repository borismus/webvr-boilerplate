var express = require('express');
var path = require('path');
var Twitter = require('twitter');

var app = express();
var port = process.env.PORT || 8000;

if(!process.env.CONSUMER_KEY){
    var env = require('./env.js');
}
var client = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret:process.env.ACCESS_TOKEN_SECRET,
});

var server = require('http').createServer(app).listen(port, function(){
    console.log('listening on ' + port);
});

app.use(express.static(path.join(__dirname, '')));
//app.use('/images', express.static(__dirname + 'images'));
app.get('/', function(request, response) {
    response.sendFile(__dirname + '/views/index.html');
});

var io = require('socket.io').listen(server);
io.on('connection', function(socket){
    console.log('user connected');
    /*
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
    // getting Twitter data using different API calls
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
    */
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});
