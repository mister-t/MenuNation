define(['jquery'
    , 'backbone'
    , 'underscore'
    , 'jade!templates/welcome/welcome'
    , 'views/BaseView'
    , 'models/menu'
    ], function($, Backbone, _, tpl, BaseView, Menu) {
  var WelcomeView = BaseView.extend({
    tagName: 'div',

    className: 'container',

    events: {'submit #menuForm':  'findMenu'},

    findMenu: function(e) {
      // e.preventDefault();
      this.menuAlert.fadeOut();//hide error messages

      var findSuccess = false;
      console.log(this.menuName.val());
      console.log(this.menuCity.val());
      var attrs = {
        name: this.menuName.val(),
        locality: this.menuCity.val()
      };

      var m = new Menu(attrs);
      var self = this;
      m.find(function(err, restaurants) {
        if(restaurants) {
          console.log(JSON.stringify(restaurants));
          findSuccess = true;
          Backbone.history.navigate('menus', true);
        } else {
          var strongMsg = self.menuAlert.find('strong');
          if(strongMsg) strongMsg.remove();

          // console.log(resp);
          var errTxt = JSON.parse(resp.responseText).error;
          self.registerAlert.append('<strong>' + errTxt + '</strong>');
          self.registerAlert.fadeIn();
          findSuccess = false;
        }
      });
      return findSuccess;
    }, 
 
    initializeFields: function() {
      this.menuName = this.$el.find('#menuName');
      this.menuCity = this.$el.find('#menuCity');
      this.menuAlert = this.$el.find('#menuAlert');
    },
  
    initialize: function() {
      _.bindAll(this, 'render', 'findMenu', 'initializeFields');
      _.templateSettings = { interpolate : /\{\{(.+?)\}\}/g }; //change underscore's interpolate variables to {{var}} from <%var%>
      this.template = _.template(tpl());
      this.initializeFields();
    },

    render: function() {
      $(this.el).html(this.template({title: 'Menu Nation'}));
      return this;
    }
  });
  
  return WelcomeView;
});
