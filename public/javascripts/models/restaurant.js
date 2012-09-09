define(['underscore', 'backbone'], function(_, Backbone) {
  var Restaurant = Backbone.Model.extend({
    defaults: {},

    idAttribute: '_id',

    urlRoot: '/venues',

    url: function() {
      var base = this.urlRoot || (this.collection && this.collection.url) || "/";

      if(this.isNew()) {
        console.log("It's a new model with base =" + base);
        return base;
      }

      console.log("Returning a model with base =");
      return base + "/" + encodeURIComponent(this.id);
    }
  });

  return Restaurant;
});

