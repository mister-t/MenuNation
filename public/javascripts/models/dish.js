define(['underscore', 'backbone'], function(_, Backbone) {
  var Dish = Backbone.Model.extend({
    defaults: {
      name: 'Thai',
      city: 'San Francisco'
    },

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
    },

    find: function(callback) {
      var self = this; //the User object
  
      console.log('Parameters = ' + this.city);
      $.ajax({
        type: 'GET',
        url:  'http://api.locu.com/v1_0/venue/b0229cd9cbc5a973e6a9/?api_key=ed9fc3007437ee0a2c3e3c4acfb00e5e169e186c'
        // dataType: 'jsonp',
        // data: 'name=thai&locality=san%20francisco',
        , success: function (data) {
          if (data.error) {
            callback.call(this, data.error, self);
          } else {
            // console.log(JSON.stringify(data));
            self.set(data);
            callback.call(this, null, self);
          }
        }, 
        error: function(xhr, textStatus, errorThrown){
          // console.log(JSON.stringify(xhr));
          // console.log(textStatus);
          // console.log(errorThrown);
        }
      });
    },
  });

  return Dish;
});

