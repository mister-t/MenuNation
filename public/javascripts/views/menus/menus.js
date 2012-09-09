define(['jquery'
    , 'backbone'
    , 'underscore'
    , 'jade!templates/menus/menus'
    , 'views/BaseView'
    , 'views/menus/menuList'
    , 'models/menu'
    ], function($
      , Backbone
      , _
      , tpl
      , BaseView
      , MenuListView
      , Menu) {
  var Menus = BaseView.extend({

    NUM_MENU_LISTS: 3,

    tagName: 'div',

    className: 'container',

    events: {},
 
    initialize: function() {
      _.bindAll(this, 'render', 'renderMenuLists');
      _.templateSettings = { interpolate : /\{\{(.+?)\}\}/g }; //change underscore's interpolate variables to {{var}} from <%var%>
      this.template = _.template(tpl());
    },

    render: function() {
      $(this.el).html(this.template({title: 'Menu Nation'}));
      this.renderMenuLists(this.NUM_MENU_LISTS);
      return this;
    },

    renderMenuLists: function(numMenuLists) {
      var tabContent = this.$el.find('.tab-content');
      for(var i=0; i<numMenuLists; i++) {
        var menuList = new MenuListView({id: 'tab'+i});
        tabContent.append(menuList.render().el);
        
        if(i == 0) {
          this.$el.find('.tab-pane').addClass('active');
        }
      }
    }
  });
  
  return Menus;
});

