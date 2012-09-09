define(['jquery'
    , 'backbone'
    , 'underscore'
    , 'jade!templates/menus/menuList'
    , 'jade!templates/menus/menuItem'
    , 'jade!templates/menus/menuSection'
    , 'views/BaseView'
    , 'models/menu'
    ], function($
      , Backbone
      , _
      , MenuListTpl
      , MenuItemTpl
      , MenuSectionTpl
      , BaseView
      , Menu) {
  var Menus = BaseView.extend({
    tagName: 'ul',

    className: 'tab-pane',

    events: {},

    NUM_ITEMS: 10,
 
    initialize: function(options) {
      options || (options = {});

      this.listTitle = options.listTitle;
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
      var self = this;
      // console.log(this.collection);
      this.collection.forEach(function(section) {
         self.$el.append(MenuSectionTpl());
         self.$el.append('<lh><h3>' + section.section_name + '</h3></lh>');
         var randDishes = _.shuffle(section.subsections[0].contents);
         var len = randDishes.length;
         for(var j=0; j<len; j++) {
           if(j==0 && self.id == 'tab1') {
            self.$el.append(tpl({dishName: randDishes[j].name + ' <strong>(Most Popular)</strong>'}));
           } else if(self.id == 'tab2') {
            var score = Math.floor((len - j+Math.random()*2-1)/len*90);
            self.$el.append(tpl({dishName: randDishes[j].name + ' (<strong>'+score+'%</strong>)'}));
           } else {
            self.$el.append(tpl({dishName: randDishes[j].name}));
           }
           
      }
      });
    }
  });
  
  return Menus;
});
