define(['jquery',
    'underscore', 
    'backbone', 
    'views/includes/navbar', 
    'views/welcome/welcome', 
    ], function($, _, Backbone
    , Navbar
    , WelcomeView) {
  var HomeRouter = Backbone.Router.extend({
    routes: {
      '': 'home',
      '*actions': 'defaultAction'
    },

    initialize: function(options) {
      this.vent =  _.extend({}, Backbone.Events);

      //cached elements
      this.elms = {
        'page-content': $('#page-content')
      };

      this.elms['page-content'].html(new Navbar().render().el);
      this.elms['navbar'] = $('#navbar');

      Backbone.history.start();
    },

    'home': function() {
      if(!this.welcomeView) {
        this.welcomeView = new WelcomeView().render();
      }
      this.elms['page-content'].append(this.welcomeView.el);
     },

    'defaultAction': function(actions) {
      //currently, we do nothing for any other routes not listed
    }
  });

  return HomeRouter;
});
