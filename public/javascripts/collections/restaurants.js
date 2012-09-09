define(['backbone', 'underscore', 'models/restaurant'], function(Backbone, _, restaurant) {
  var Restaurants = Backbone.Collection.extend({
    model: restaurant,

    initialize: function(models, options) {
    },
  
    url: '/restaurants'
  
    });

  return Restaurants;
});
