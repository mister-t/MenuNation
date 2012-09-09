//A route is always in plural form. eg. /venues/, /movies/, /users/, etc
var util = require('util')
    , url = require('url')
    , _ = require('underscore')
    , winston = require('winston')
    , colors = require('colors')
    , http = require('http')
    ;

//To learn more about express-resource, go to 
//https://github.com/visionmedia/express-resource
//
//Default mapping 
// GET     /venues              ->  index
// GET     /venues/new          ->  new
// POST    /venues              ->  create
// GET     /venues/:venue       ->  show
// GET     /venues/:venue/edit  ->  edit
// PUT     /venues/:venue       ->  update
// DELETE  /venues/:venue       ->  destroy
//
// In app.js add the following
//app.resource('venues', require('./routes/venues'));

exports.index = function(req, res){
  if(!req.query) {
    res.json(404);
  } else {
    //Find the movie poster image url
    var urlParts = url.parse(req.originalUrl, true);
    var search = urlParts.search;
    search = search.substring(1); //get rid of the ?
    var payload = '', venues = [];
    
    // console.log('path = '+ process.env.LOCU_API_HOST + process.env.LOCU_API_PATH + '?api_key='+process.env.LOCU_API_KEY + '&' + search);
    // http://api.locu.com/v1_0/venue/b0229cd9cbc5a973e6a9/?api_key=ed9fc3007437ee0a2c3e3c4acfb00e5e169e186c
    // http://api.locu.com/v1_0/venue/b0229cd9cbc5a973e6a9/?api_key=ed9fc3007437ee0a2c3e3c4acfb00e5e169e186c
    http.get({
      // host: process.env.LOCU_API_HOST,
      // path: process.env.LOCU_API_PATH + '?api_key='+process.env.LOCU_API_KEY + '&' + search
      host: 'api.locu.com',
      path: '/v1_0/venue/b0229cd9cbc5a973e6a9/?api_key=ed9fc3007437ee0a2c3e3c4acfb00e5e169e186c'
    }, function(result) {
      result.on('data', function(d) {
        payload += d.toString(); //keep adding the data chunks till 'end'
      });

      result.on('end', function() {
        //Extract the our desired object since all data have arrived
        var jsonObj = JSON.parse(payload); 
        // console.log('payload = '.red + payload);
        for(var i=0; i<jsonObj.objects.length; i++) {
          if(jsonObj.objects[i].has_menu) {
            var venue = {
              name: jsonObj.objects[i].name,
              id: jsonObj.objects[i].id,
              lat: jsonObj.objects[i].lat,
              long: jsonObj.objects[i].long,
              sections: jsonObj.objects[i].menus[0].sections,
            };
            venues.push(venue);
          }
        }
        console.log(JSON.stringify(venues));
        if(venues && venues.length == 0) {
          res.json({error: 'No Venues Found'});
        }
        else {
          res.json(venues);
        }
      });
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

