// user.js
// User model logic.
var _ = require('underscore');
var _s = require('underscore.string');
var async = require('async');
var moment = require('moment');
var colors = require('colors');

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

// model helpers
var Node = require('./node');
var Cypher = require('./cypher');

// constants:
var INDEX_NAME = 'users';
var INDEX_KEYS = ['id'];

// private constructor:

var User = module.exports = function User(_node) {
  this._node = _node;
}

// pass-through node properties:

Node.proxyProperty(User, '_id'); // node id
Node.proxyProperty(User, 'id', true); // object id property
Node.proxyProperty(User, 'exists');
// Node.proxyProperty(User, 'name', true);
// Node.proxyProperty(User, 'login', true);
Node.proxyProperty(User, 'date', true);

// private instance methods:


// public instance methods:

User.prototype.convert = function () {
  return _.pick(this, 'id');
};

// indexes the user async
User.prototype.index = function (output, condition, callback) {
  // set condition to false to not index
  if(condition==false){
    return callback(null);
  }
  var that = this;
  async.forEach(INDEX_KEYS, function(key, callback){
    that._node.index(INDEX_NAME, key, that[key], function (err){
      callback(err);
    });
  }, function(err){
    if(err) return callback(err);
    
    if(_.isUndefined(output) || (_.isBoolean(output) ? output : output.index)){
      console.log('User indexed in '+INDEX_NAME.green+' as '+
                  _s.toSentence(_.map(INDEX_KEYS, function(k){ return '"'+k.yellow+':'+that[k].toString().yellow+'"'; })));
    }
    callback(err, true);
  });
};

// static methods:

// adds multiple users and indexes them, each users can be a string or object
User.add = function (users, output, callback) {
  // converts to array if necessary
  if(!_.isArray(users)){
    users = [users];
  }
  async.map(_.uniq(users), function (user, callback){
    User.create(user, output, callback);
  }, callback);
};

// creates a new user, adds to index, and creates relationships to tags and masters
User.create = function (user, output, callback) {
  // assemble query by plugging in vars
  var query = [
    'START rootUser=node:root("name:user")',
    'CREATE UNIQUE rootUser<-[:IS_A]-(user {id:{USER_ID}})',
    'SET user.date = COALESCE(user.date?,{DATE})',
    'RETURN user'
  ].join('\n');
  var params = {
    USER_ID : user.id || user._id || user
    , DATE  : moment().unix() // account creation date
  };
  Cypher.query('User.addUser',query,params,output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);

    if(results.length){
      var user = new User(results[0].user);
      // only index if just created
      user.index(output, user.date==params.DATE, function (err) {
        callback(err, user);
      });
    } else {
      console.log("no user returned".red);
      callback(new Exception('User not found'));
    }
  });
};

// looks up user by id and returns it
User.get = function (_id, callback) {
  db.getNodeById(_id, function (err, node) {
    if (err) return callback(err);
    callback(null, new User(node));
  });
};

// looks up user by "key:value" and returns it
User.getIndexed = function (key, value, callback) {
  db.getIndexedNode(INDEX_NAME,key,value, function (err, node) {
    if (err) return callback(err);
    callback(null, new User(node).convert());
  });
};

// return all users
User.getAll = function (output, callback) {
  var query = [
    'START user=node:users({USER})',
    'RETURN user',
    'ORDER BY user.id'
  ].join('\n');
  
  var params = {
    USER   : 'id:*'
  };
  Cypher.query('User.getAll',query,params,output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
    var users = _.map(results, function (res) {
      return new User(res.user).convert();
    });
    callback(null, users);
  });
};

// find users
User.find = function (user, output, callback) {
  var query = [
    'START user=node:users({USER})',
    'RETURN user'
  ].join('\n');
  
  var params = {
    USER   : 'id:'+user.id
  };
  Cypher.query('User.find',query,params,output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
    var users = _.map(results, function (res) {
      return new User(res.user).convert();
    });
    callback(null, users);
  });
};

