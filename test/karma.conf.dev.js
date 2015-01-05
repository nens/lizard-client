// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2014-09-30 using
// generator-karma 0.8.3

module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      // bower:js
      'vendor/jquery/dist/jquery.js',
      'vendor/angular/angular.js',
      'vendor/angular-mocks/angular-mocks.js',
      'vendor/bootstrap/dist/js/bootstrap.js',
      'vendor/d3/d3.js',
      'vendor/leaflet-dist/dist/leaflet.js',
      'vendor/leaflet-dist/dist/leaflet-src.js',
      'vendor/lodash/dist/lodash.compat.js',
      'vendor/restangular/dist/restangular.js',
      'vendor/raven-js/dist/raven.js',
      'vendor/d3-comparator/d3-comparator.js',
      'vendor/angular-sanitize/angular-sanitize.js',
      'vendor/ng-csv/build/ng-csv.min.js',
      // endbower

      // application
      'test/mocks/beforeModuleMocks.js',
      'app/components/state/state.js', // Load these first to prevent dep clash
      'app/components/data-menu/data-menu.js', // Load these first to prevent dep clash
      'app/components/map/map.js', // Load these first to prevent dep clash
      'app/components/state/state.js', // Load these first to prevent dep clash
      'app/templates.js',
      'app/components/omnibox/omnibox.js',
      'app/lizard-nxt.js',
      'test/mocks/**/*.js',
      'app/lib/**/*.js',
      'app/*.js',
      'app/components/**/{controllers/,directives/,services/,*}.js',
      // end application

      // tests
      'test/spec/**/*.js'
    ],

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 8080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      'PhantomJS'
    ],

    // Which plugins to enable
    plugins: [
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-mocha-reporter',
      'karma-jasmine',
      'karma-coverage',
      'karma-junit-reporter'
    ],

    reporters: ['mocha'],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
