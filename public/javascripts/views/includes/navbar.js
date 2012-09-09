define(['jquery'
    , 'backbone'
    , 'underscore'
    , 'jade!templates/includes/navbar'
    , 'views/BaseView'
    ], function($, Backbone, _, tpl, BaseView) {
  var NavBar = BaseView.extend({
    className: 'navbar navbar-fixed-top', 

    id: 'navbar', 
    
    initialize: function() {
      _.bindAll(this, 'render');
      _.templateSettings = { interpolate : /\{\{(.+?)\}\}/g }; //change underscore's interpolate variables to {{var}} from <%var%>
      this.template = _.template(tpl());

    },

    render: function() {
      $(this.el).html(this.template({title: 'Menu Nation'}));
      return this;
    }
  });
  
  return NavBar;
});

