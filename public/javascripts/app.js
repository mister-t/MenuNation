define(["underscore", "backbone", "routers/desktopRouter"], function(_, Backbone, Router) {
  var app = {
    init: function() {
      var router = new Router();
      console.log("App started....");
    }
  };

  return _.extend(app, Backbone.Events);
});
