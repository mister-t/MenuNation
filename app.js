
/**
 * Module dependencies.
 */

var express = require('express')
  , expressResource = require('express-resource')
  , util = require('util')
  , MongoStore = require('connect-mongodb')
  , mongoose = require('mongoose')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.resource('venues', require('./routes/venues'));


var port = process.env.PORT || 3000
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
