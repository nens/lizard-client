'use strict';

module.exports = function (grunt) {
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
    vendorfiles:
      [
        '<%= nxt_dir.vendor %>/bootstrap/bootstrap.js',
        '<%= nxt_dir.vendor %>/d3/d3.js',
        '<%= nxt_dir.vendor %>/leaflet-dist/leaflet.js',
        '<%= nxt_dir.vendor %>/angular-ui-bootstrap/ui-bootstrap-tpls-0.10.0.min.js',
        '<%= nxt_dir.vendor %>/lodash/dist/lodash.min.js',
      ],
      testfiles: [
        '<%= nxt_dir.vendor %>/angular-mocks/angular-mocks.js'
      ],
      angularfiles:
      [
        '<%= nxt_dir.vendor %>/jquery/jquery.js',
        '<%= nxt_dir.vendor %>/angular/angular.js',
        '<%= nxt_dir.vendor %>/restangular/dist/restangular.min.js',
        '<%= nxt_dir.vendor %>/ui-utils/ui-utils.js',
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
        '<%= nxt_dir.src %>/app/lib/leaflet-utfgrid-lizard.js',
        '<%= nxt_dir.src %>/app/lib/utils.js',        
      ],
      watch: {
        tests: {
          files: [
            '<%= appfiles %>',
            '<%= nxt_dir.test %>/**/*.js'
          ],
          tasks: ['test']
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
      htmlmin: {
        dist: {
          options: {
            /*removeCommentsFromCDATA: true,
            // https://github.com/yeoman/grunt-usemin/issues/44
            //collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeOptionalTags: true*/
          },
          files: [{
            expand: true,
            cwd: '<%= nxt_dir.src %>/app/',
            src: [
              '*.html',
              'templates/*.html',
            // '../../../templates/client/base-src.html'
            ],
            dest: '<%= nxt_dir.dist %>'
          }]
        }
      },
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
      jasmine: {
        pivotal: {
          src: ['<%= angularfiles %>',
                '<%= vendorfiles %>',
                '<%= testfiles %>',
                '<%= appfiles %>'],
          options: {
            specs: '<%= nxt_dir.test %>/**/*.js',
            junit: {
              path: 'qa/junit'
            }
          }
        },
        istanbul: {
          src: ['<%= appfiles %>'],
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
        useminPrepare: {
          html: '<%= nxt_dir.base %>../templates/client/index.html',
          options: {
            dest: '<%= nxt_dir.dist %>'
          }
        },
        usemin: {
          html: ['<%= nxt_dir.dist %>/{,*/}*.html'],
          css: ['<%= nxt_dir.dist %>/styles/{,*/}*.css'],
          options: {
            dirs: ['<%= nxt_dir.dist %>']
          }
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
