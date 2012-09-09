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
      // this.bindTo(this.collection, 'reset', this.render);
    },

    render: function() {
      $(this.el).html(this.template({title: 'Menu Nation'}));
      this.renderItems();
      return this;
    },

    renderItems: function() {
      // var tabPane = this.$el.find('.tab-pane');
      var tpl = _.template(MenuItemTpl());
      // console.log(this.models);
      var self;
      console.log(this.collection);
      for(var i=0; i<this.collection.length; i++) {
        this.$el.append(tpl({dishName: this.collection[i].name}));
      }
      // this.collection.foreEach(function(item) {
      //   self.$el.append(tpl({dishName: this.models[i]}));
      // });
    }
  });
  
  return Menus;
});
