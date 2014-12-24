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

var modRewrite = require('connect-modrewrite');

module.exports = function (grunt) {
  // loads all the grunt dependencies found in package.json
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.loadNpmTasks('grunt-connect-proxy');


  var appConfig = {
    app: require('./bower.json').appPath,
    dist: 'dist',
    // Templates that need to be converted reside in components and core
    templateFileDirs: 'components/**/{,*/}*.html',
    // TODO: 
    // lib and lizard-nxt.js are still a swamp. Needs to be
    // * restructured
    // * refactored.
    // * Cut up in modules etc.
    //
    //
    // Files reside in components, lib and in several subdirectories.
    jsFileDirs: '{components, lib}/{,*/}*.js'
  };

  // Project configuration.
  grunt.initConfig({

    yeoman: appConfig,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      bower: {
        files: ['bower.json'],
        tasks: ['wiredep']
      },
      js: {
        files: ['<%= yeoman.app %>/<%= yeoman.jsFileDirs %>'],
        tasks: ['newer:jshint:dev', 'karma:dev'],
      },
      jstemplates: {
        files: ['<%= yeoman.app %>/<%= yeoman.templateFileDirs %>'],
        tasks: ['html2js']
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: ['newer:jshint', 'karma:dev']
      },
      styles: {
        files: ['<%= yeoman.app %>/styles/{,*/}*.scss'],
        tasks: ['sass:watch', 'newer:copy:styles', 'autoprefixer']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        // Files that trigger livereload
        files: [
          // anything html
          '<%= yeoman.app %>/{,*/}*.html',
          // CSS created from sass files
          '.tmp/styles/{,*/}*.css',
          // All images
          '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    // The actual grunt server settings
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          middleware: function (connect, options) {
            return [
              modRewrite([
                '!\\api|\\accounts|\\lizard-bs\.js|\\\/scripts\/|\\.html|\\.js|\\.svg|\\.css|\\.woff|\\.png$ /index.html [L]',
                '^/api/ http://localhost:8000/api/ [P]',
                '^/accounts/ http://localhost:8000/accounts/ [P]',
                '^/lizard-bs.js http://localhost:8000/lizard-bs.js [P]',
                ]),
              connect.static('.tmp'),
              connect().use(
                '/vendor',
                connect.static('./vendor')
              ),
              connect.static(appConfig.app)
            ];
          }
        }
      },

      test: {
        options: {
          port: 9001,
          middleware: function (connect) {
            return [
              connect.static('.tmp'),
              connect.static('test'),
              connect().use(
                'vendor',
                connect.static('./vendor')
              ),
              connect.static(appConfig.app),
            ];
          }
        }
      },
      dist: {
        options: {
          open: true,
          base: '<%= yeoman.dist %>'
        }
      }
    },

    html2js: {
      options: {
        rename: function (moduleName) {
          // Rename templates to just the name of the componente with the
          // file, so <componentName>/<templateName>.html or
          // <componentName>/templates/<templateName>.html.
          return moduleName.split('components/')[1];
        }
      },
      main: {
        src: ['<%= yeoman.app %>/<%= yeoman.templateFileDirs %>'],
        dest: '<%= yeoman.app %>/templates.js'
      },
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        force: true
      },
      build: {
        options: {
          reporter: 'jslint',
          reporterOutput: 'qa/jshint.xml',
        },
        src: [
          'Gruntfile.js',
          '<%= yeoman.app %>/<%= yeoman.jsFileDirs %>'
        ]
      },
      dev: {
        options: {
          reporter: require('jshint-stylish'),
          reporterOutput: null
        },
        src: [
          'Gruntfile.js',
          '<%= yeoman.app %>/<%= yeoman.jsFileDirs %>',
        ]
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/{,*/}*'
          ]
        }]
      },
      server: '.tmp'
    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: ['last 1 version']
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/styles/',
          src: '{,*/}*.css',
          dest: '.tmp/styles/'
        }]
      }
    },

    
    // Automatically inject Bower components into the app
    wiredep: {
      app: {
        src: ['<%= yeoman.app %>/index.html'],
        ignorePath:  /\.\./
      },
      test: {
        src: ['test/karma.conf.js', 'test/karma.conf.dev.js'],
        ignorePath:  /\.\.\//,
        fileTypes: {
          js: {
            block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
            detect: {
              js: /'(.*\.js)'/gi
            },
            replace: {
              js: '\'{{filePath}}\','
            }
          }
        }
      }
    },

    // Node Sass is faster than Compass
    sass: {
      options: {
        sourceMap: true,
        outputStyle: 'expanded'
      },
      dist: {
        files: {
          '.tmp/styles/main.css': '<%=yeoman.app %>/styles/main.scss'
        },
        options: {
          outputStyle: 'compressed'
        }
      },
      watch: {
        files: {
          '.tmp/styles/main.css': '<%= yeoman.app %>/styles/main.scss'
        }
      }
    },

    // Renames files for browser caching purposes
    filerev: {
      dist: {
        src: [
          '<%= yeoman.dist %>/<%= yeoman.jsFileDirs %>',
          '<%= yeoman.dist %>/styles/{,*/}*.css',
          '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= yeoman.dist %>/styles/fonts/*'
        ]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>',
        flow: {
          html: {
            steps: {
              js: ['concat'],
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },

    // Nginx serves from /static/client/, so in production we replace script
    // tags to point to /static/client
    replace: {
      dist: {
        src: ['dist/*.html'],
        overwrite: true,                 // overwrite matched source files
        replacements: [{
          from: '/styles/',
          to: '/static/client/styles/'
        }, {
          from: '/scripts/',
          to: '/static/client/scripts/'
        }, {
          from: '/images/',
          to: '/static/client/images/'
        }]
      }
    },

    // Performs rewrites based on filerev and the useminPrepare configuration
    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
      options: {
        assetsDirs: ['<%= yeoman.dist %>', '<%= yeoman.dist %>/images']
      }
    },


    // The following *-min tasks will produce minified files in the dist folder
    // By default, your `index.html`'s <!-- Usemin block --> will take care of
    // minification. These next options are pre-configured if you do not wish
    // to use the Usemin blocks.
    // cssmin: {
    //   dist: {
    //     files: {
    //       '<%= yeoman.dist %>/styles/main.css': [
    //         '.tmp/styles/{,*/}*.css'
    //       ]
    //     }
    //   }
    // },
    // uglify: {
    //   dist: {
    //     files: {
    //       '<%= yeoman.dist %>/scripts/scripts.js': [
    //         '<%= yeoman.dist %>/scripts/scripts.js'
    //       ]
    //     }
    //   }
    // },
    // concat: {
    //   dist: {}
    // },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg,gif}',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.svg',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true,
          removeOptionalTags: true
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: ['*.html', 'views/{,*/}*.html'],
          dest: '<%= yeoman.dist %>'
        }]
      }
    },

    // ng-annotate tries to make the code safe for minification automatically
    // by using the Angular long form for dependency injection.
    ngAnnotate: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat/scripts',
          src: ['*.js', '!oldieshim.js'],
          dest: '.tmp/concat/scripts'
        }]
      }
    },

    // Replace Google CDN references
    cdnify: {
      dist: {
        html: ['<%= yeoman.dist %>/*.html']
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            '*.html',
            'views/{,*/}*.html',
            'images/{,*/}*.{webp}',
            'fonts/*'
          ]
        }, {
          expand: true,
          cwd: '.tmp/images',
          dest: '<%= yeoman.dist %>/images',
          src: ['generated/*']
        }, {
          expand: true,
          cwd: 'vendor/components-font-awesome',
          src: 'fonts/*',
          dest: '<%= yeoman.dist %>'
        }, {
          expand: true,
          cwd: 'vendor/lizard-iconfont/lizard/dest',
          src: 'fonts/*',
          dest: '<%= yeoman.dist %>'
        }]
      },
      styles: {
        expand: true,
        cwd: '<%= yeoman.app %>/styles',
        dest: '.tmp/styles/',
        src: '{,*/}*.css'
      }
    },

    // produces docs
    doxx: {
      all: {
        src: 'app/',
        target: 'doc'
      }
    },

    // Run some tasks in parallel to speed up the build process
    concurrent: {
      server: [
        'copy:styles'
      ],
      test: [
        'copy:styles'
      ],
      dist: [
        'copy:styles',
        'imagemin',
        'svgmin'
      ]
    },

    // Test settings
    karma: {
      dev: {
        configFile: 'test/karma.conf.dev.js',
      },
      unit: {
        configFile: 'test/karma.conf.js',
      }
    }
  });


  grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'html2js',
      'wiredep',
      'configureProxies',
      'concurrent:server',
      'sass:watch',
      'autoprefixer',
      'connect:livereload',
      'watch'
    ]);
  });


  grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve:' + target]);
  });

  grunt.registerTask('test', [
    'html2js',
    'clean:server',
    'concurrent:test',
    'autoprefixer',
    'connect:test',
    'karma:unit'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'wiredep',
    'useminPrepare',
    'html2js',
    'sass',
    'concurrent:dist',
    'autoprefixer',
    'concat',
    'ngAnnotate',
    'copy:dist',
    'cdnify',
    'cssmin',
    // 'uglify',
    'filerev',
    'usemin',
    'htmlmin',
    'replace',
    'doxx'
  ]);

  grunt.registerTask('release', [
    'test',
    'build',
    'releaser'
  ]);

  grunt.registerTask('default', [
    'newer:jshint',
    'test',
    'build'
  ]);
};
