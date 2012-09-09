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
      // this.bindTo(this.collection, 'reset', this.render);
    },

    render: function() {
      $(this.el).html(this.template({title: 'Menu Nation'}));
      var self = this;
      // console.log(this.collection);
      var tmp = this.collection.toJSON();
      this.renderMenuLists(tmp[0].sections);
      // this.collection.fetch({
      //   success: function(collection) {
      //     var temp = collection.toJSON();
      //     // console.log(JSON.stringify(temp));
      //     self.renderMenuLists(temp[0].sections);
      //   },
      //   error: function(model, errMsg) {
      //     console.log(errMsg);
      //   }
      // });

      return this;
    },

    renderMenuLists: function(menuSections) {
      var tabContent = this.$el.find('.tab-content');
      for(var i=0; i<this.NUM_MENU_LISTS; i++) {
        // var menuList = new MenuListView({id: 'tab'+i});
        
        if(i == 0) {
          this.$el.find('.tab-pane').addClass('active');
          var starters = _.find(menuSections, function(section) {
            // console.log(section);
            return section.section_name == 'Starter';
          });
          // console.log(starters);
          tabContent.append(new MenuListView({collection: starters.subsections[0].contents, id: 'tab'+i}).render().el);
        }

        if(i == 1) {
          var mainCourses = _.find(menuSections, function(section) {
            // console.log(section);
            return section.section_name == 'Main Courses';
          });
          // console.log(starters);
          tabContent.append(new MenuListView({collection: mainCourses.subsections[0].contents, id: 'tab'+i}).render().el);
        }

        if(i == 2) {
          var chefSuggestion = _.find(menuSections, function(section) {
            // console.log(section);
            return section.section_name == 'Chef Suggestion';
          });
          // console.log(starters);
          tabContent.append(new MenuListView({collection: chefSuggestion.subsections[0].contents, id: 'tab'+i}).render().el);
        }


        /*
        if(i == 1) {
          tabContent.append(menuList.render().el);
        }

        if(i == 2) {
          tabContent.append(menuList.render().el);
        }
        */
      }
    }
  });
  
  return Menus;
});

