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
      'vendor/angular-animate/angular-animate.js',
      'vendor/angular-bootstrap/ui-bootstrap-tpls.js',
      'vendor/angular-gettext/dist/angular-gettext.js',
      'vendor/angular-loading-bar/build/loading-bar.js',
      'vendor/angular-mocks/angular-mocks.js',
      'vendor/angular-resource/angular-resource.js',
      'vendor/bootstrap/dist/js/bootstrap.js',
      'vendor/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js',
      'vendor/classList.js/classList.min.js',
      'vendor/chromath/dist/chromath.min.js',
      'vendor/d3/d3.js',
      'vendor/d3-comparator/d3-comparator.js',
      'vendor/dragula/dist/dragula.js',
      'vendor/leaflet/dist/leaflet-src.js',
      'vendor/leaflet.markercluster/dist/leaflet.markercluster.js',
      'vendor/lodash/lodash.js',
      'vendor/moment/moment.js',
      'vendor/angular-sanitize/angular-sanitize.js',
      'vendor/ng-csv/build/ng-csv.min.js',
      'vendor/notie/dist/notie.js',
      'vendor/perfect-scrollbar/js/perfect-scrollbar.jquery.js',
      'vendor/perfect-scrollbar/js/perfect-scrollbar.js',
      'vendor/raven-js/dist/raven.js',
      // endbower

      'vendor/moment/locale/nl.js',
      // application
      'app/components/state/state.js', // Load these first to prevent dep clash
      'app/components/data-menu/data-menu.js', // Load these first to prevent dep clash
      'app/components/map/map.js', // Load these first to prevent dep clash
      'app/templates.js',
      'app/components/omnibox/omnibox.js',
      'app/components/state/state.js',
      'app/components/timeseries/timeseries.js',
      'app/components/image-carousel/image-carousel.js',
      'app/components/annotations/annotations.js',
      'app/components/user-menu/user-menu.js',
      'app/components/dashboard/dashboard.js',
      'app/components/favourites/favourites.js',
      'app/components/export/export.js',
      'app/components/ui-utils/ui-utils.js',
      'app/components/legend/legend.js',
      'app/lizard-nxt.js',
      'test/mocks/**/*.js',
      'app/lib/**/*.js',
      'app/*.js',
      'app/components/**/**/*.js',
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
      'karma-jasmine',
      'karma-coverage',
      'karma-junit-reporter'
    ],

    preprocessors: {
      'app/**/*.js': ['coverage']
    },

    reporters: ['progress', 'coverage'],

    junitReporter: {
      outputFile: 'qa/junit.xml',
      suite: ''
    },

    coverageReporter: {
      reporters: [
        {type: 'html', dir: 'qa/', subdir: 'coverage/'},
        {type: 'cobertura', dir: 'qa/', subdir: 'coverage/'},
        {type: 'text-summary'}
      ]
    },

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_WARN,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
