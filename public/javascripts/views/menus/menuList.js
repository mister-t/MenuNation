define(['jquery'
    , 'backbone'
    , 'underscore'
    , 'jade!templates/menus/menuList'
    , 'jade!templates/menus/menuItem'
    , 'views/BaseView'
    , 'models/menu'
    ], function($
      , Backbone
      , _
      , MenuListTpl
      , MenuItemTpl
      , BaseView
      , Menu) {
  var Menus = BaseView.extend({
    tagName: 'ul',

    className: 'tab-pane',

    events: {},

    NUM_ITEMS: 10,
 
    initialize: function() {
      _.bindAll(this, 'render', 'renderItems');
      _.templateSettings = { interpolate : /\{\{(.+?)\}\}/g }; //change underscore's interpolate variables to {{var}} from <%var%>
      this.template = _.template(MenuListTpl());
    },

    render: function() {
      $(this.el).html(this.template({title: 'Menu Nation'}));
      this.renderItems(this.NUM_ITEMS);
      return this;
    },

    renderItems: function(numItems) {
      // var tabPane = this.$el.find('.tab-pane');
      var tpl = _.template(MenuItemTpl());
      for(var i=0; i<numItems; i++) {
        this.$el.append(tpl({dishName: this.id + '-dishName' + i}));
      }
    }
  });
  
  return Menus;
});


