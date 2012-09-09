require.config({
  //setting 3rd-party libraries
  paths: {
    jquery: "libs/jquery-1.7.2.min",
    underscore: "libs/underscore-min",
    backbone: "libs/backbone-min",
    bootstrap: "libs/bootstrap.min",
    bootbox: "libs/bootbox.min",
    jade: "jade",
    app: "app"
  },

  //setting dependencies for libraries; e.g. backbone depends on underscore & jquery
  //The "shim" config replaces the functionality of the "Order" plugin
  shim: {
    "underscore": {
      exports: "_"
    },
    "backbone": {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },
    'bootstrap': {
      deps: ['jquery'],
      exports: 'bootstrap'
    },
    'bootbox': {
      deps: ['jquery', 'bootstrap'],
      exports: 'bootbox'
    }
  }
});

require(["jquery", "underscore", "backbone", "bootbox", "app"], function($, _, Backbone, Bootbox, App) {
  console.log("In Main module");
  App.init();
});

