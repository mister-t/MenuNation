define(['backbone', 'underscore', 'models/dish'], function(Backbone, _, dish) {
  var Dishes = Backbone.Collection.extend({
    model: dish,

    initialize: function(models, options) {
    },
  
    // url: 'http://api.locu.com/v1_0/venue/b0229cd9cbc5a973e6a9/?api_key=ed9fc3007437ee0a2c3e3c4acfb00e5e169e186c'
    url: '/venues',
  
    });

  return Dishes;
});

