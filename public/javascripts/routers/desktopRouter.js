define(['jquery'
    ,'underscore' 
    , 'backbone' 
    , 'views/includes/navbar'
    , 'views/menus/menus' 
    , 'views/welcome/welcome' 
    , 'collections/dishes'
    ], function($, _, Backbone
    , Navbar
    , MenusView
    , WelcomeView
    , Dishes) {
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
        this.elms['menusView'] = new MenusView({collection: new Dishes()});
        var self = this;
        this.elms['menusView'].collection.fetch({
          success: function(collection) {
            // var temp = collection.toJSON();
            // console.log(temp[0].sections);;
            // self.elms['menusView'].renderMenuLists(temp[0].sections);
            self.elms['menusView'].render();
            if(self.elms['welcomeView']) {
              self.elms['welcomeView'].dispose();
            }
            self.elms['page-content'].html(self.elms['navbar']);
            self.elms['page-content'].append(self.elms['menusView'].el);
          },
          error: function(model, errMsg) {
            console.log(errMsg);
          }
        });
      }



     },

    'defaultAction': function(actions) {
      //currently, we do nothing for any other routes not listed
    }
  });

  return HomeRouter;
});
