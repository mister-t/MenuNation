//A route is always in plural form. eg. /venues/, /movies/, /users/, etc
var util = require('util')
    , url = require('url')
    , _ = require('underscore')
    , winston = require('winston')
    , colors = require('colors')
    , http = require('http')
    , Root = require('../models/root')
    , Restaurant = require('../models/restaurant')
    , Item = require('../models/item')
    , User = require('../models/user')
    , locu = require('locu')
    , vclient = locu.VenueClient(process.env.LOCU_API_KEY, 'http://api.locu.com')
    ;

_.once(Root.initializeClasses(false, {name:true, index:true}, function (err){
  if (err) throw err;
  console.log('finished initializing'.green);
}));

// index page for restaurants
exports.index = function(req, res){
  if(!req.query) {
    res.json(404);
  } else {
    Restaurant.search({cuisine:'thai', locality:'San Francisco'}, true, function (err, venues){
      if(venues && venues.length) {
        res.json(venues);
      }
      else {
        res.json({error: 'No Venues Found'});
      }
    });
  }
};

exports.new = function(req, res){
  console.log
  res.json('new venue');
};

exports.create = function(req, res){
  res.json('create venue');
};

exports.show = function(req, res){
  res.json('show venue ' + req.params.venue);
};

exports.edit = function(req, res){
  res.json('edit venue ' + req.params.venue);
};

exports.update = function(req, res){
  res.json('update venue ' + req.params.venue);
};

exports.destroy = function(req, res){
  res.json('destroy venue ' + req.params.venue);
};

