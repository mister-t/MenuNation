// item.js
// Item model logic.
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
var INDEX_NAME = 'items';
var INDEX_KEYS = ['id'];

// private constructor:

var Item = module.exports = function Item (_node) {
  this._node = _node;
}

// pass-through node properties:

Node.proxyProperty(Item, '_id'); // node id
Node.proxyProperty(Item, 'id', true); // object id property
Node.proxyProperty(Item, 'exists');
Node.proxyProperty(Item, 'name', true);
Node.proxyProperty(Item, 'description', true);
Node.proxyProperty(Item, 'price', true);
Node.proxyProperty(Item, 'rid', true);
Node.proxyProperty(Item, 'date', true);

// private instance methods:

// public instance methods:

// converts a Item object to a simple item object
Item.prototype.convert = function () {
  return _.pick(this,'name','id','description, price, rid, _id');
};

// indexes the item async
Item.prototype.index = function (output, condition, callback) {
  // set condition to false to not index
  if(condition==false){
    return callback(null);
  }
  var that = this;
  async.forEach(INDEX_KEYS, function (key, callback){
    that._node.index(INDEX_NAME, key, that[key], callback);
  }, function (err){
    if(err) return callback(err);
    
    if(_.isUndefined(output) || (_.isBoolean(output) ? output : output.index)){
      console.log('Item indexed in '+INDEX_NAME.green+' as '+
                  _s.toSentence(_.map(INDEX_KEYS, function (k){ return '"'+k.yellow+':'+that[k].toString().yellow+'"'; })));
    }
    callback(err, true);
  });
};

// static methods:

// looks up item by _id and returns it
Item.getNodeById = function (_id, callback) {
  db.getNodeById(_id, function (err, node) {
    if (err) return callback(err);
    callback(null, new Item(node));
  });
};

// looks up item by "key:value" and returns it
Item.getIndexed = function (key, value, callback) {
  db.getIndexedNode(INDEX_NAME,key,value, function (err, node) {
    if (err) return callback(err);
    callback(null, new Item(node).convert());
  });
};

// return all items with attached tags
Item.like = function (item, user, output, callback) {
  var query = [
    'START item=node({ITEM}), user=node:users({USER})',
    'CREATE UNIQUE user-[r:LIKE]->item',
    'SET r.date = COALESCE(r.date?,{DATE})',
    'RETURN r'
  ].join('\n');
  
  var params = {
    ITEM    : Math.floor(item.id/1000)
    , USER  : 'id:'+user.id
    , DATE  : moment().unix()
  };
  
  Cypher.query('Item.like',query,params, output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
    // if(results.length){
    //   console.log(item.name + ' liked by '+user.id);
    // }
      
    callback(null);
    // }
    // var items = _.map(results, function (res){
    //   var item = new Item(res.item).convert();
    //   console.log(item);
    //   return item;
    // });
    
    // callback(null, items);
  });
};

// return all items with attached tags
Item.find = function (item, output, callback) {
  var query = [
    'START item=node({ITEM})',
    'RETURN item'
  ].join('\n');
  
  var params = {
    ITEM : Math.floor(item.id/1000)
  };
  
  Cypher.query('Item.find',query,params, output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
    var items = _.map(results, function (res){
      var item = new Item(res.item).convert();
      // console.log(item);
      return item;
    });
    
    callback(null, items);
  });
};

// given current item, suggest other items
Item.recommendation = function (item, user, output, callback) {
  var params = {
    ITEM    : 'id:'+(item.id || item)
    , USER  : 'id:'+(user.id || user)
  }
  // searches by genre and by similar dimensions, can boost scores later to bias paths, returning dim1/genre optional
  var query = [
    'START item=node:items({ITEM}), user=node:users({USER})',
    'MATCH item<-[?:LIKE]-user2-[:LIKE]->item2<-[:LIKE]-user, item<-[?:LIKE]-user2-[:LIKE]->item3-[:ITEM_AT]->restaurant<-[:ITEM_AT]-item',
    'RETURN item, count(*) as likeness',
    'ORDER BY likeness DESC',
    'LIMIT 10'
  ].join('\n');
  Cypher.query('Item.recommendation',query,params,output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
    if(results.length){
      var items = {};
      _.each(results, function (res){
        var item = new Item(res.item).convert();
        // console.log(item);
        items[item.name] = {
          id          : item.id
          , likes     : res.likes
          , likeness  : res.likeness
        };
      });
      callback(null, items);
    } else {
      callback(null);
    }
  });
};
