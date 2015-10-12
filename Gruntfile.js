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
  var modRewrite = require('connect-modrewrite');

  // Load tasks used by grunt watch
  grunt.loadNpmTasks('grunt-html2js');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-newer');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-wiredep');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-autoprefixer');


  var appConfig = {
    app: require('./bower.json').appPath,
    dist: 'dist',
    // Templates that need to be converted reside in components and core
    templateFileDirs: 'components/**/{,*/}*.html',
    // Files reside in components, lib and in several subdirectories.
    jsFileDirs: '{,components, lib}/{,*/}*.js'
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
        files: [
        '<%= yeoman.app %>/<%= yeoman.jsFileDirs %>',
        '!<%= yeoman.app %>/templates.js'
      ],
        tasks: ['karma:dev', 'newer:jshint:dev'],
      },
      jstemplates: {
        files: ['<%= yeoman.app %>/<%= yeoman.templateFileDirs %>'],
        tasks: ['html2js']
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: ['karma:dev', 'newer:jshint:dev'],
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
          // All js files
          '<%= yeoman.app %>/<%= yeoman.jsFileDirs %>'
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
                '!\\api|\\accounts|\\lizard-bs\.js|\\proxy|\\\/scripts\/|\\.html|\\.js|\\.svg|\\.css|\\.woff|\\.png$ /index.html [L]',
                '^/api/ http://localhost:8000/api/ [P]',
                '^/proxy/ http://localhost:8000/proxy/ [P]',
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
          // Rename templates to just the the component name with the
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

    // Config for angular-gettext
    nggettext_extract: {
      pot: {
        options: {
          startDelim: '<%',
          endDelim: '%>'
        },
        files: {
          'po/template.pot': ['<%= yeoman.app %>/<%= yeoman.jsFileDirs %>', '<%= yeoman.app %>/<%= yeoman.templateFileDirs %>']
        }
      },
    },

    nggettext_compile: {
      all: {
        files: {
          // dest : src
          'app/translations.js': ['po/*.po']
        }
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

    // Profiling
    phantomas: {
      gruntSite: {
        options: {
          indexPath: 'qa/phantomas/',
          numberOfRuns: 5,
          output: ['json'],
          url: 'http://integration.nxt.lizard.net',
          buildUi: true
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
      },
      ghpages: {
        src: ['dist/*.html'],
        overwrite: true,                 // overwrite matched source files
        replacements: [{
          from: '/styles/',
          to: 'styles/'
        }, {
          from: '/scripts/',
          to: 'scripts/'
        }, {
          from: '/images/',
          to: 'images/'
        },{
          from: '/lizard-bs.js',
          to: 'https://nxt.lizard.net/lizard-bs.js'
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
      },
      CNAME: {
        expand: true,
        cwd: './',
        dest: '<%= yeoman.dist %>',
        src: 'CNAME'

      }
    },

    // produces docs
    doxx: {
      all: {
        src: 'app/',
        target: 'doc'
      }
    },

    // Test settings
    karma: {
      dev: {
        configFile: 'test/karma.conf.dev.js',
      },
      unit: {
        configFile: 'test/karma.conf.js',
      }
    },

    releaser: {
      ghpages: {
        options: {
          upstream: 'gh-pages',
          tag: false,
          changelog: false
        }
      },
      dist: {
        options: {
          upstream: 'dist',
          changelog: true,
          tag: true
        }
      }
    },

    'tx-source-upload': {
      options: {
        username: grunt.option('txusername'),
        password: grunt.option('txpassword'),
        project: 'lizard-client',
        resource: 'core',
        i18nType: 'pot'
      },
      src: 'po/template.pot'
    }
  });


  grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'html2js', // Convert html omnibox templates to js files.
      'wiredep', // Add bower files as script tags to index.html
      'sass:watch', // Create .tmp/main.css from sass files.
      'autoprefixer', // Add vendor prefixes to .tmp/main.css.
      'connect:livereload', // Connect browser window.
      'watch' // Watch for changes to reload.
    ]);
  });

  grunt.registerTask('test', [
    'html2js',
    'karma:unit',
    'newer:jshint:dev'
  ]);

  grunt.registerTask('build', function () {
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-svgmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-google-cdn');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-doxx');

    grunt.task.run([
      'translate',
      'clean:dist',
      'html2js',
      'wiredep',
      'useminPrepare',
      'sass',
      'copy:styles',
      'autoprefixer',
      'svgmin',
      'concat',
      'ngAnnotate',
      'copy:dist',
      'cdnify',
      'cssmin',
      'filerev',
      'usemin',
      'htmlmin',
      'doxx'
    ]);
  });

  grunt.registerTask('internationalize', function () {
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.loadNpmTasks('grunt-tx-source-upload');

    grunt.task.run([
      'translate',
      'nggettext_extract', // extract strings from code
      'tx-source-upload', // upload to transifex
    ]);
  });

  grunt.registerTask('translate', function () {
    grunt.loadNpmTasks('grunt-angular-gettext');
    grunt.task.run([
      'download-po-files',
      'nggettext_compile' // create translations
    ]);

  });

  grunt.registerTask('release', function () {
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-lizard-release');

    grunt.task.run([
      'test',
      'build',
      'replace:dist',
      'releaser:dist'
    ]);
  });

  grunt.registerTask('sandbox', function () {
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.task.run([
      'test',
      'build',
      'copy:CNAME',
      'replace:ghpages',
      'releaser:ghpages'
    ]);
  });

  grunt.registerTask('default', function () {
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.task.run([
      'test',
      'internationalize',
      'build',
      'replace:dist',
    ]);
  });

  grunt.registerTask('download-po-files',
    'Task to get languages and po files for each language from transifex',
    function () {
      var request = require('request');
      var done = this.async();
      grunt.log.writeln('Getting available languages');
      var fs = require('fs');

      request.get('http://www.transifex.com/api/2/project/lizard-client/resource/core/?details')
      .auth(grunt.option('txusername'), grunt.option('txpassword'))
      .on('data', function (response) {
        getLanguages(JSON.parse(response).available_languages);
      });

      var getLanguages = function (languages) {
        var completed_request = 0;
        languages.forEach(function (lang) {
          request.get('http://www.transifex.com/api/2/project/lizard-client/resource/core/translation/' + lang.code + '?file')
          .auth(grunt.option('txusername'), grunt.option('txpassword'))
          .on('response', function (res) {
            completed_request++;
            grunt.log.writeln('Recieved: ' + lang.name);
            if (completed_request === languages.length) {
                done();
            }
          })
          .pipe(fs.createWriteStream('po/lizard6_lizard-client_' + lang.code + '.po'));
        });
      };
    }
  );

};
