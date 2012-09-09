define(['underscore', 'backbone'], function(_, Backbone) {
  var Menu = Backbone.Model.extend({
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
        url:  '/venues',
        // dataType: 'jsonp',
        // data: 'name=' + self.get('name') + '&city='+ self.get('city'),
        data: 'name=thai&locality=san%20francisco',
        success: function (data) {
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

  return Menu;
});
