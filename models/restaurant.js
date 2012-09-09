// restaurant.js
// Restaurant model logic.
var _ = require('underscore');
var _s = require('underscore.string');
var async = require('async');
var moment = require('moment');
var colors = require('colors');
var locu = require('locu');

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

var Item = require('./item');

var vclient = locu.VenueClient(process.env.LOCU_API_KEY, 'http://api.locu.com');

// model helpers
var Node = require('./node');
var Cypher = require('./cypher');

// constants:
var INDEX_NAME = 'restaurants';
var INDEX_KEYS = ['id'];

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
      restaurant.items = _.map(results, function (res, callback){
        var item = new Item(res.item);
        // item.index(output, item.date == params.DATE, function (err) {
        // });
        return item.convert();
      });
        // restaurant.items = items;

      restaurant.index(true, true, function (err) {
        callback(err, restaurant.convert());
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
    'START restaurant=node:restaurants({RESTAURANT})',
    'MATCH restaurant<--item<-[r?:LIKE]-()',
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
        , _id   : item._id
        , likes : res.likes
      };
    });
    
    callback(null, items);
  });
};

// return all items for restaurant
Restaurant.findItemsArray = function (restaurant, output, callback) {
  var query = [
    'START restaurant=node:restaurants({RESTAURANT})',
    'MATCH restaurant<--item',
    'RETURN item'
    // 'ORDER BY likes DESC'
  ].join('\n');
  
  var params = {
    RESTAURANT : 'id:'+restaurant.id
  };
  
  Cypher.query('Restaurant.findItemsArray',query,params,output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
    var items = _.map(results, function (res){
      return new Item(res.item).convert();
      // // console.log(item);
      // return {
      //   id      : item.id
      //   , _id   : item._id
      //   , likes : res.likes
      // };
    });
    
    callback(null, items);
  });
};

// personalize by people that like this like that
Restaurant.personalizeMenu = function (restaurant, user, output, callback) {
  var query = [
    'START restaurant=node:restaurants({RESTAURANT}), user=node:users({USER})',
    // 'MATCH restaurant<--item<-[r?:LIKE]-()',
    // 'WITH restaurant, item, count(*) as likes',
    'MATCH restaurant<-item-[:KNOWS*1..3]-user',
    'RETURN item, count(*) as likeness',
    'ORDER BY likeness DESC'
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
        // , likes     : res.likes
        , likeness  : res.likeness
      };
    });
    
    callback(null, items);
  });
};

// personalize by people that like this like that
Restaurant.popular = function (restaurant, output, callback) {
  var query = [
    'START restaurant=node:restaurants({RESTAURANT})',
    'MATCH restaurant<--item<-[r?:LIKE]-()',
    'RETURN item, count(*) as likes',
    'ORDER BY likes DESC'
  ].join('\n');
  
  var params = {
    RESTAURANT  : 'id:'+(restaurant.id || restaurant)
    // , USER      : 'id:'+(user.id || user)
  };
  
  Cypher.query('Restaurant.popular',query,params,output);
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
      };
    });
    
    callback(null, items);
  });
};

// query locu for the restaurants
Restaurant.search = function (params, output, callback) {
  var restaurants;
  vclient.search(params, function (response){
    restaurants = response && response.objects ? response.objects : null;
    console.log(restaurants);
    callback(null, restaurants);
  });
};

// query locu for the restaurants
Restaurant.likeSome = function (restaurant, output, callback) {
  Restaurant.findItemsArray(restaurant, output, function (err, items){
    if(err) return callback(err);
    console.log('trying to like '+(items ? items.length : 0)+' items for '+restaurant.name.cyan);
    var likeCount=0;
    _.each(items, function (item){
      var rand = (Math.floor(Math.random()*20/(item.likes ? 3 : 1)))+2;
      var pass = (item.id % rand == 0);
      // console.log(item.name.cyan + ' like? '+pass);
      if(pass){
        // var users = _.
        var randUser = 'user'+Math.floor(Math.random()*10);
        likeCount++;
        // console.log(randUser+' is trying to like '+item.name.cyan);
        // console.log(item);
        Item.like(item, {id:randUser}, false, function (err, res){
          if(err) return callback(err);
        });
      }
    });
    console.log(likeCount.toString().magenta+' likes added to '+restaurant.name.cyan);
  });
};

// return all users
Restaurant.getAll = function (output, callback) {
  var query = [
    'START restaurant=node:restaurants({USER})',
    'RETURN restaurant',
    'ORDER BY restaurant.id'
  ].join('\n');
  
  var params = {
    USER   : 'id:*'
  };
  Cypher.query('Restaurant.getAll',query,params,output);
  db.query(query, params, function (err, results) {
    if (err) return callback(err);
    Cypher.results(results, output);
    
    var restaurants = _.map(results, function (res) {
      return new Restaurant(res.restaurant).convert();
    });
    callback(null, restaurants);
  });
};

// get all items for a restaurant as key value pairs {name: {id, count, score, etc}}
// integrate it back with the menu
// rate a bunch of items
