// restaurant.js
// Restaurant model logic.
var _ = require('underscore');
var _s = require('underscore.string');
var async = require('async');
var moment = require('moment');
var colors = require('colors');

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

var Item = require('./item');

// model helpers
var Node = require('./node');
var Cypher = require('./cypher');

// constants:
var INDEX_NAME = 'restaurants';
var INDEX_KEYS = ['name','id'];

// private constructor:

var Restaurant = module.exports = function Restaurant(_node) {
  this._node = _node;
}

// pass-through node properties:

// Node.proxyProperty(Restaurant, '_id'); // node id
Node.proxyProperty(Restaurant, 'id', true); // object id property
Node.proxyProperty(Restaurant, 'exists');
Node.proxyProperty(Restaurant, 'name', true);
Node.proxyProperty(Restaurant, 'items', true);
Node.proxyProperty(Restaurant, 'date', true);

// private instance methods:

// public instance methods:

// converts a Restaurant object to a simple restaurant object
Restaurant.prototype.convert = function () {
  return _.pick(this,'name','id','items');
};

// indexes the restaurant async
Restaurant.prototype.index = function (output, condition, callback) {
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
      console.log('Restaurant indexed in '+INDEX_NAME.green+' as '+
                  _s.toSentence(_.map(INDEX_KEYS, function (k){ return '"'+k.yellow+':'+that[k].toString().yellow+'"'; })));
    }
    callback(err, true);
  });
};

// static methods:

// adds multiple restaurants and indexes them, each is an object
Restaurant.add = function (restaurants, output, callback) {
  // converts to array if necessary
  if(!_.isArray(restaurants)){
    restaurants = [restaurants];
  }
  async.map(_.uniq(restaurants), function (restaurant, callback) {
    Restaurant.create(restaurant, output, callback);
  }, callback);
};

// creates a new restaurant, adds to index, and creates relationships to tags and masters
Restaurant.create = function (restaurant, output, callback) {
  var params = {
    NAME    : restaurant.name
    , ID    : restaurant.id
    , MS    : moment().milliseconds()
    , DATE  : moment().unix()
  };
  
  // hard coding root nodes
  var startQ = 'START rootRestaurant=node:root("name:restaurant"), rootItem=node:root("name:item")';
  var createQ = ['CREATE UNIQUE rootRestaurant<-[:IS_A]-(restaurant {name:{NAME}, id:{ID}})'];
  var setQ = [];

  _.each(restaurant.menus, function (menu, i){
    // var m = 'MENU'+i;
    // params[m] = menu.menu_name;
    // createQ.push('restaurant<-[:MENU]-('+m+' {menu_name:{'+m+'}, rid:{ID}})');
    _.each(menu.sections, function (section, ii){
      // var s = 'SECTION'+ii;
      // params[s] = section.section_name;
      // createQ.push(m+'<-[:SECTION]-('+s+' {section_name:{'+s+'}, rid:{ID}})');
      _.each(section.subsections, function (subsection, iii) {
        // var sub = 'SUBSECTION'+iii;
        // params[sub] = subsection.section_name;
        // createQ.push(s+'<-[:SECTION]-('+sub+' {section_name:{'+sub+'}, rid:{ID}})');
        _.each(subsection.contents, function (item, iv) {
          // this is the item, finally! making a shallow graph to keep things "simple"
          if (item.name){
            var it = 'CONTENT_'+[i,ii,iii,iv].join('_');
            params[it+'_name'] = item.name;
            params[it+'_description'] = item.description;
            params[it+'_price'] = item.price;
            // rid is the restaurant id;
            createQ.push('restaurant<-[:ITEM_AT]-('+it+' {name:{'+it+'_name}, rid:{ID}})-[:IS_A]->rootItem');
            setQ.push(it+'.description = {'+it+'_description}');
            setQ.push(it+'.price = {'+it+'_price}');
            setQ.push(it+'.id = COALESCE('+it+'.id?, ROUND(ID('+it+')*1000+ROUND({MS})))');
            setQ.push(it+'.date = COALESCE('+it+'.date?,{DATE})');
          }
        });
      });
    });
  });
  
  var withQ = 'WITH restaurant';

  // match query
  var matchQ = 'MATCH restaurant<-[:ITEM_AT]-item';

  // return query
  var returnQ = 'RETURN restaurant, item';

  // complete query
  var query = [startQ,createQ.join(', '),'SET '+setQ.join(', '),withQ,matchQ,returnQ].join('\n');
  Cypher.query('Restaurant.create',query,params,output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);

    if(results.length){
      var restaurant = new Restaurant(results[0].restaurant);
      async.map(results, function (res, callback){
        var item = new Item(res.item);
        item.index(output, item.date == params.DATE, function (err) {
          callback(item);
        });
      }, function (err, items){
        restaurant.items = items;

        restaurant.index(output, restaurant.date == params.DATE, function (err) {
          callback(err, restaurant.convert());
        });
      });
    } else {
      console.log("no restaurant returned".red);
      callback(null);
    }
  });
};

// return all items for restaurant
Restaurant.findItems = function (restaurant, output, callback) {
  var query = [
    'START item=node:items({RESTAURANT})',
    'MATCH item<-[r?:LIKE]-()',
    'RETURN item, count(r) as likes'
    // 'ORDER BY likes DESC'
  ].join('\n');
  
  var params = {
    RESTAURANT : 'id:'+restaurant.id
  };
  
  Cypher.query('Restaurant.findItems',query,params,output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
    var items = {};
    _.each(results, function (res){
      var item = new Item(res.item).convert();
      // console.log(item);
      items[item.name] = {
        id      : item.id
        , likes : res.likes
      };
    });
    
    callback(null, items);
  });
};

// personalize by people that like this like that
Restaurant.personalizeMenu = function (restaurant, user, output, callback) {
  var query = [
    'START item=node:items({RESTAURANT}), user=node:users({USER})',
    'MATCH item<-[r?:LIKE]-()-[:LIKE]->item2<-[:LIKE]-user',
    'RETURN item, count(r) as likes, count(*) as likeness'
    // 'ORDER BY likes DESC'
  ].join('\n');
  
  var params = {
    RESTAURANT  : 'id:'+(restaurant.id || restaurant)
    , USER      : 'id:'+(user.id || user)
  };
  
  Cypher.query('Restaurant.personalizeMenu',query,params,output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
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
  });
};

// get all items for a restaurant as key value pairs {name: {id, count, score, etc}}
// integrate it back with the menu
// rate a bunch of items
