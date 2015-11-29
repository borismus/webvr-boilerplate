/* 
 * basic ExpressJS server
 * @link http://expressjs.com/starter/static-files.html
 */

//requires
var express = require('express');
var app = express();
var path = require('path');

//use dev directories
app.use(express.static('bower_components'));
app.use(express.static('build'));

//get home page
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

//dev directories for testing
app.get('/img/*', function(req, res) {
	res.sendFile(path.join(__dirname + req.path));
});

app.get('/bower_components/*', function(req, res) {
	res.sendFile(path.join(__dirname + req.path));
});

app.get('/build/*', function(req, res) {
	res.sendFile(path.join(__dirname + req.path));
});

app.get('/test/*', function(req, res) {
	res.sendFile(path.join(__dirname + req.path));
});

/*
app.get('/*', function(req, res) {
	res.sendFile(path.join(__dirname + req.path));
});
*/

console.log('server listening at port 3000');
app.listen(3000);