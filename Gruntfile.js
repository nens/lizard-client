'use strict';

/*
  Gruntfile for Lizard NXT client.

  To see what tasks are available run::
  `grunt --help`

  Before deploying it should run::
  `grunt build`

  In development run::
  `grunt watch`
  This watches all the files and runs tests as
  you develop.

*/

module.exports = function (grunt) {
  // loads all the grunt dependencies found in package.json
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  var lizard_nxt_dir = '';


  // Project configuration.
  grunt.initConfig({
    nxt_dir: {
      base: lizard_nxt_dir,
      test: lizard_nxt_dir + 'test',
      vendor: lizard_nxt_dir + 'vendor',
      src: lizard_nxt_dir + 'source',
      dist: lizard_nxt_dir + 'dist'
    },
  // converts html templates to Angular modules
    html2js: {
      options: {
        rename: function (moduleName) {
          return moduleName.split('app/')[1];
        }
      },
      main: {
        src: ['<%= nxt_dir.src %>/app/templates/*.html'],
        dest: '<%= nxt_dir.src %>/app/templates/templates.js'
      },
    },
    // variables to be used in other parts of grunt file
    vendorfiles:
      [
        //'<%= nxt_dir.vendor %>/bootstrap/bootstrap.js',  // TYPO?!
        '<%= nxt_dir.vendor %>/bootstrap/js/bootstrap.js', // CORRECTION
        '<%= nxt_dir.vendor %>/d3/d3.js',
        '<%= nxt_dir.vendor %>/leaflet-dist/leaflet.js',
        '<%= nxt_dir.vendor %>/angular-ui-bootstrap/ui-bootstrap-tpls-0.10.0.min.js',
        '<%= nxt_dir.vendor %>/lodash/dist/lodash.min.js',
        '<%= nxt_dir.vendor %>/raven-js/dist/raven.min.js'
      ],
      testfiles: [
        '<%= nxt_dir.vendor %>/angular-mocks/angular-mocks.js',
        '<%= nxt_dir.test %>/mocks.js'
      ],
      angularfiles:
      [
        '<%= nxt_dir.vendor %>/jquery/jquery.js',
        '<%= nxt_dir.vendor %>/angular/angular.js',
        '<%= nxt_dir.vendor %>/restangular/dist/restangular.min.js',
        '<%= nxt_dir.vendor %>/ui-utils/ui-utils.js',
        '<%= nxt_dir.vendor %>/angular-sanitize/angular-sanitize.min.js',
        '<%= nxt_dir.vendor %>/ng-csv/build/ng-csv.min.js',
        '<%= nxt_dir.vendor %>/ng-table/ng-table.min.js',
      ],
      appfiles: [
        '<%= nxt_dir.src %>/app/lizard-nxt.js',
        '<%= nxt_dir.src %>/app/services/**/*.js',
        '<%= nxt_dir.src %>/app/lizard-nxt-filters.js',
        '<%= nxt_dir.src %>/app/directives/**/*.js',
        '<%= nxt_dir.src %>/app/controllers/**/*.js',
        '<%= nxt_dir.src %>/app/templates/templates.js',
        '<%= nxt_dir.src %>/app/lib/TileLayer.GeoJSONd3.js',
        '<%= nxt_dir.src %>/app/lib/Layer.GeoJSONd3.js',
        '<%= nxt_dir.src %>/app/lib/leaflet-utfgrid-lizard.js',
        '<%= nxt_dir.src %>/app/lib/utils.js',
      ],
      /*
      can be run while developing
      watches:
        * JS appfiles and specs -> runs tests
        * CSS files -> runs minification
        * HTML files -> runs html2js
      */
      watch: {
        tests: {
          files: [
            '<%= appfiles %>',
            '<%= nxt_dir.test %>/**/*.js'
          ],
          tasks: ['test', 'jsdoc']
        },
        styles: {
          files: ['<%= nxt_dir.src %>/assets/css/{,*/}*.css'],
          tasks: ['cssmin:dist']
        },
        jstemplates: {
          files: ['<%= nxt_dir.src %>/app/templates/{,*/}*.html'],
          tasks: ['html2js']
        }
      },
      // destroys dist folder (e.g. before regenerating it)
      clean: {
        dist: {
          files: [{
            dot: true,
            src: [
              '.tmp',
              '<%= nxt_dir.dist %>/*',
              '!<%= nxt_dir.dist %>/.git*'
            ]
          }]
        }
      },
      // minifies all the css
      cssmin: {
        dist: {
          files: {
            '<%= nxt_dir.dist %>/css/nxt.css' : [
              '<%= nxt_dir.src %>/assets/css/graph.css',
              '<%= nxt_dir.src %>/assets/css/omnibox.css',
              '<%= nxt_dir.src %>/assets/css/nxt_base.css'
            ],
            '<%= nxt_dir.dist %>/css/vendor.css' : [
              '<%= nxt_dir.vendor %>/bootstrap/dist/css/bootstrap.css',
              '<%= nxt_dir.vendor %>/leaflet-dist/leaflet.css',
              '<%= nxt_dir.vendor %>/font-awesome/css/font-awesome.min.css',
              '<%= nxt_dir.vendor %>/ng-table/ng-table.min.css',
              '<%= nxt_dir.vendor %>/lizard-iconfont/lizard/dest/css/Lizard.css'
            ]
          }
        }
      },
      // produces docs
      jsdoc: {
        dist: {
          src: ['<%= appfiles %>'],
          options: {
            destination: 'doc'
          }
        }
      },
      // produces linting results
      jshint: {
        all: [
          // 'Gruntfile.js',
          '<%= nxt_dir.src %>/app/**/*.js',
          '!<%= nxt_dir.src %>/app/lib/leaflet-utfgrid-lizard.js',
          '!<%= nxt_dir.src %>/app/lib/leaflet.contours-layer.js',
          '!<%= nxt_dir.src %>/app/lib/TileLayer.GeoJSONd3.js',
          '!<%= nxt_dir.src %>/app/templates/templates.js'
        ],
        options: {
          jshintrc: '.jshintrc',
          reporter: 'jslint',
          reporterOutput: 'qa/jshint.xml',
          force: true // finishes jshint instead of `failing`.
        }
      },
      // test suite (suite is pronounced as sweet, not suit)
      jasmine: {
        pivotal: {
          src: ['<%= angularfiles %>',
                '<%= vendorfiles %>',
                '<%= appfiles %>',
                '<%= testfiles %>'
              ],
          options: {
            specs: [
              '<%= nxt_dir.test %>/**/*.js',
              '!<%= nxt_dir.test %>/mocks.js'
              ],
            junit: {
              path: 'qa/junit'
            }
          }
        },
        // istanbul produces coverage reports in xml (cobertura)
        // needs the same input as jasmine stuff
        istanbul: {
          src: '<%= jasmine.pivotal.src %>',
          options: {
            specs: '<%= jasmine.pivotal.options.specs %>',
            template: require('grunt-template-jasmine-istanbul'),
            templateOptions: {
              coverage: 'qa/coverage/json/coverage.json',
              report: [
                  {type: 'html', options: {dir: 'qa/coverage/html'}},
                  {type: 'cobertura', options: {dir: 'qa/'}},
                  {type: 'text-summary'}
                ]
              }
            }
          },
        },
        concat: {
          dist: {
            files: {
              '<%= nxt_dir.dist %>/js/nxt.js': [
                '<%= appfiles %>'
              ],
              '<%= nxt_dir.dist %>/js/ng.js': [
                '<%= angularfiles %>'
              ],
              '<%= nxt_dir.dist %>/js/vendor.js': [
                '<%= vendorfiles %>'
              ]
            }
          }
        },
        copy: {
          dist: {
            files: [{
              expand: true,
              dot: true,
              cwd: '<%= nxt_dir.vendor %>/font-awesome/fonts/',
              dest: '<%= nxt_dir.dist %>/fonts',
              src: [
                '*.*'
              ]
            }, {
              expand: true,
              dot: true,
              cwd: '<%= nxt_dir.vendor %>/lizard-iconfont/lizard/dest/fonts/',
              dest: '<%= nxt_dir.dist %>/fonts',
              src: [
                '*.*'
              ]
            }, {
              expand: true,
              cwd: '<%= nxt_dir.src %>/assets/images',
              dest: '<%= nxt_dir.dist %>/images',
              src: [
                '*'
              ]
            }]
          }
        }
      });

  grunt.registerTask('test', [
    'html2js',
    'jasmine'
  ]);
  grunt.registerTask('coverage', [
    'jasmine:istanbul'
  ]);
  grunt.registerTask('build', [
    'clean:dist',
    'cssmin',
    'html2js',
    'concat',
    'jsdoc',
    'copy:dist'
  ]);
  grunt.registerTask('plakhetaanelkaar', [
    'clean:dist',
    'cssmin',
    'concat',
    'copy:dist'
  ]);
  grunt.registerTask('dev', [
    'watch'
  ]);
  grunt.registerTask('default', [
    'build'
  ]);
};
