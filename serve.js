var express = require('express');
var app = express();

app.use(express.static('./'));

app.listen(3000, function () {
  console.log('Serving static files on port 3000!');
});

