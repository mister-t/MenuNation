define(['jquery'
    ,'underscore' 
    , 'backbone' 
    , 'views/includes/navbar'
    , 'views/menus/menus' 
    , 'views/welcome/welcome' 
    ], function($, _, Backbone
    , Navbar
    , MenusView
    , WelcomeView) {
  var HomeRouter = Backbone.Router.extend({
    routes: {
      '': 'home',
      'menus': 'showMenus',
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
      if(!this.elms['welcomeView']) {
        this.elms['welcomeView']= new WelcomeView().render();
      }
      this.elms['page-content'].append(this.elms['welcomeView'].el);
     },

    'showMenus': function() {
      if(!this.elms['menusView']) {
        this.elms['menusView'] = new MenusView().render();
      }

      if(this.elms['welcomeView']) {
        this.elms['welcomeView'].dispose();
      }
      this.elms['page-content'].html(this.elms['navbar']);
      this.elms['page-content'].append(this.elms['menusView'].el);

     },

    'defaultAction': function(actions) {
      //currently, we do nothing for any other routes not listed
    }
  });

  return HomeRouter;
});
