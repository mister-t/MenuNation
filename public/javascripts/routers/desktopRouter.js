define(['jquery',
    'underscore', 
    'backbone', 
    ], function($, _, Backbone
    ) {
  var HomeRouter = Backbone.Router.extend({
    routes: {
      '': 'home',
      '*actions': 'defaultAction'
    },

    initialize: function(options) {
      this.vent =  _.extend({}, Backbone.Events);

      //cached elements
      this.elms = {
      };
      console.log("Router Initialize function called");
      Backbone.history.start(true);
    },

    'home': function() {
      // console.log("Home function called");
      // this.elms['page-content'].html(this.welcomeView.render().el);
      // console.log("Welcome view called");

      //Need to hide the following if user is login
      // this.elms['page-content'].append(this.guestBtn.render().el);
      // console.log("Guest Btn called");
      // this.elms['page-content'].find('#register-tab').append(this.registerTab.render().el);
      // console.log("RegisterTab called");
     },

    'defaultAction': function(actions) {
      //currently, we do nothing for any other routes not listed
    }
  });

  return HomeRouter;
});
