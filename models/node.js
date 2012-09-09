// node.js
// Helper functions for nodes in neo4j models.
var _ = require('underscore');
var _s = require('underscore.string');
var async = require('async');
var moment = require('moment');
var colors = require('colors');

var Node = module.exports;

Node.proxyProperty = function (model, prop, isData) {
  Object.defineProperty(model.prototype, prop, {
    get: function () {
      if (isData) {
        return this._node.data[prop];
      } else if (prop === '_id'){
        return this._node['id'];
      } else if (prop === 'path'){
        return _.compact([this.movie, this.dimension, this.descriptor]);
      } else {
        return this._node[prop];
      }
    },
    set: function (value) {
      if (isData) {
        this._node.data[prop] = value;
      } else {
        this._node[prop] = value;
      }
    }
  });
};