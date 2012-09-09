// root.js
// Root model logic.
var _ = require('underscore');
var _s = require('underscore.string');
var async = require('async');
var moment = require('moment');
var colors = require('colors');
var locu = require('locu');

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

var User = require('./user');
var Restaurant = require('./restaurant');
var Item = require('./item');

var vclient = locu.VenueClient(process.env.LOCU_API_KEY, 'http://api.locu.com');

// model helpers
var Node = require('./node');
var Cypher = require('./cypher');

// constants:
var ROOT_ID = 0; // default but might change

var INDEX_NAME = 'root';
var INDEX_KEY = 'name';

// private constructor:

var Root = module.exports = function Root(_node) {
  this._node = _node;
}

// pass-through node properties:

Node.proxyProperty(Root, '_id'); // node id
Node.proxyProperty(Root, 'exists');
Node.proxyProperty(Root, 'name', true);
Node.proxyProperty(Root, 'date', true);

// private instance methods

// public instance methods:

// converts a Root object to a simple root object
Root.prototype.convert = function () {
  return _.pick(this,'name','_id');
};

// indexes the user async
Root.prototype.index = function (output, condition, callback) {
  // set condition to false to not index
  if(condition==false){
    return callback(null);
  }
  var that = this;
  var value = that[INDEX_KEY];
  that._node.index(INDEX_NAME, INDEX_KEY, value, function (err){
    if(err) return callback(err);
    
    if(_.isUndefined(output) || (_.isBoolean(output) ? output : output.index)){
      console.log('Node indexed in '+INDEX_NAME.green+' as "'+INDEX_KEY.yellow+':'+value.yellow+'"');
    }
    callback(err, true);
  });
};

// static methods:

// create first nodes and indeces
Root.initialize = function (initialize, output, callback) {
  if(initialize === false){
    console.log('Initialization: '.cyan + 'disabled'.red);
    return callback(null);
  }
  var timer = moment();
  output = _.isUndefined(output) ? {query:true, index:true, results:false} : output; // default true
  console.log("Starting Graph Initialization".cyan);
  var query = [
    'START root=node({ROOT_ID})',
    'CREATE UNIQUE root<-[:ROOT]-(restaurant {name:"restaurant"}), '+
    'root<-[:ROOT]-(user {name:"user"}), '+
    'root<-[:ROOT]-(item {name:"item"})',
    'SET restaurant.date = COALESCE(restaurant.date?,{DATE}), '+
    'user.date = COALESCE(user.date?,{DATE}), '+
    'item.date = COALESCE(item.date?,{DATE})',
    'RETURN *'
  ].join('\n');
  var params = {
    ROOT_ID : ROOT_ID
    , DATE  : moment().unix()
  };
  Cypher.query('Root.initialize',query, params, {title:true});
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
    var res = results[0];

    // index root nodes first
    var rootValues = ['restaurant', 'user', 'item'];
    async.forEach(rootValues, function (value, callback){
      if(initialize){
        var root = new Root(res[value]);
        // only index if dates are equal, meaning node was just created
        root.index(output, root.date == params.DATE, function (err) {
          callback(err);
        });
      } else {
        callback(null);
      }
    }, function (err){
      if(err) return callback(err);
      console.log('root nodes initialized'.green);
      // handle other nodes
      async.series([
        function (callback) {
          Root.initializeClasses(true, output, callback);
        }
      ], function (err, results) {
        if (err) return callback(err);
        console.log('Graph Initialized: '.green+(moment().diff(timer, "seconds", true)+" seconds").red);
        callback(null);
      });
    });
  });
};

// initialize all the classes in the right order
Root.initializeClasses = function (initialize, output, callback) {
  if(initialize === false){
    console.log('Class Initialization: '.cyan + 'disabled'.red);
    return callback(null);
  }
  if(output){
    console.log('Root.initializeClasses'.magenta);
  }
  // massive async call
  async.parallel({
    restaurants : function (callback){
      Root.initializeRestaurants(output, function (err, results) {
        if (err) return callback(err);
        console.log(results.length+" restaurants added".green);
        callback(err, results);
      });
    },
    users : function (callback){
      Root.initializeUsers(output, function (err, results) {
        if (err) return callback(err);
        console.log(results.length+" users added".green);
        callback(err, results);
      });
    }
  }, function (err, results) {
    if (err) return callback(err);

    var restaurants = results.restaurants;
    var users = results.userr;
    callback(null);
  });
};

Root.initializeRestaurants = function (output, callback) {
  if(output){
    console.log('Root.initializeRestaurants'.magenta);
  }
  // vclient.search()
  var restaurant;
  vclient.get_details("b0229cd9cbc5a973e6a9", function (response){
    restaurant = response && response.objects ? response.objects[0] : null;
    // console.log(JSON.stringify(restaurant));
    if (restaurant) {
      Restaurant.add([restaurant], {name:true, index:true}, callback);
    }
  });
};

Root.initializeUsers = function (output, callback) {
  if(output){
    console.log('Root.initializeUsers'.magenta);
  }
  var user1 = {
    id    : 'mat'
  };

  var user2 = {
    id    : 'tony'
  };
  User.add([user1, user2], output, callback);
};



