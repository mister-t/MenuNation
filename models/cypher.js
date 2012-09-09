// cypher.js
// Helper functions relating to cypher for neo4j models.
var _ = require('underscore');
var _s = require('underscore.string');
var async = require('async');
var moment = require('moment');
var colors = require('colors');

var Cypher = module.exports;

// displays and color codes the query and params if output is undefined, true, or {query: true}
Cypher.query = function (name, query, params, output) {
  if(_.isUndefined(output) || (_.isBoolean(output) ? output : output.query)){
    var cmds = ['START','UNIQUE','SET','WITH','MATCH','WHERE','CREATE','RETURN','DELETE','ORDER','BY','FOREACH','LIMIT','SKIP'];
    //var arrows = ['\Q<-[\E','\Q]->\E','<--','-->','\Q-[\E','\Q]-\E'];
    var fn = ['COALESCE','COLLECT','LENGTH','FILTER','ROUND','HAS','NOT','ID','DISTINCT','AND'];
    var newParams = _.map(params, function(v, k){
      if(!_.isUndefined(v)){
        query = query.replace(new RegExp('\{'+k+'\}',"gi"), _.isString(v)?('"'+v+'"').yellow : _.isArray(v) || !_.isNumber(v) ? JSON.stringify(v).yellow : v.toString().yellow);
        return k.green + ':'+(_.isString(v)?('"'+v+'"').yellow : _.isArray(v) || !_.isNumber(v) ? JSON.stringify(v).yellow : v.toString().yellow);}
      }
    );
    _.each(fn, function(w){ query = query.replace(new RegExp(w,"g"), w.cyan); });
    _.each(cmds, function(w){ query = query.replace(new RegExp(w,"g"), w.magenta); });
    //_.each(arrows, function(w){ query = query.replace(new RegExp(w,"g"), w.red); });
    console.log(name.green.underline);
    console.log("query = \n"+query);
    console.log("params = {"+newParams.join(', ')+'}');
  } else if (output && output.name){
    // displays only the name of the function if output.name is true and output.query is undefined or false (for less console spam)
    console.log('function'.cyan+': '+name.green.underline);
  }
};

// show the stringified results of a cypher query
Cypher.results = function (results, output) {
  if(_.isBoolean(output) ? output : _.isObject(output) ? output.results : output){
    console.log('results = '.magenta+JSON.stringify(results));
  } else if (_.isObject(output) ? output.res : false) {
    // to show whether results contains anything
    console.log('results.length = '.magenta+results.length);
  }
};