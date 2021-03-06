
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

  var proxyHost =  grunt.option('proxyhost') ? grunt.option('proxyhost') : "http://localhost:8000";

  function authorizeWithHeaders() {
    return function authorizeWithHeaders(req, res, next) {
      if (grunt.option('sso_username') || process.env.SSO_USERNAME) {
        req.headers.username = grunt.option('sso_username') || process.env.SSO_USERNAME;
        req.headers.password = grunt.option('sso_password') || process.env.SSO_PASSWORD;
      }
      next();
    };
  }

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
    ///////////////////////////////////////////////////////////////////////////
    // NB! Changing the frankenstein expression below in an incorrect manner and
    // subsequently running the command `$ npm run transifex` will make the rest
    // of your day living hell: Grunt will assume there are no translatable
    // strings in your JS and will consider all translated strings on Transifex
    // redundant: all those translated strings will be deleted.
    jsFileDirs: '{,components, lib}/**/{,*/}*.js'
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
        tasks: ['karma:unit', 'newer:jshint:dev'],
      },
      jstemplates: {
        files: ['<%= yeoman.app %>/<%= yeoman.templateFileDirs %>'],
        tasks: ['html2js']
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: ['karma:unit', 'newer:jshint:dev'],
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
        port: grunt.option('port') || 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: grunt.option('hostname') ? grunt.option('hostname') + '' : 'localhost',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          middleware: function (connect, options) {
            return [
              connect().use(
                authorizeWithHeaders()
              ),
              modRewrite([
                '!\\\/media|\\\/screens|\\\/api|\\\/accounts|\\\/bootstrap|\\\/about|\\\/proxy|\\\/scripts\/|\\.html|\\.js|\\.svg|\\.css|\\.woff|\\.png$ /index.html [L]',
                '^/screens/ ' + proxyHost + '/screens/ [P]',
                '^/media/ ' + proxyHost + '/media/ [P]',
                '^/about/ ' + proxyHost + '/about/ [P]',
                '^/api/ ' + proxyHost + '/api/ [P]',
                '^/proxy/ ' + proxyHost + '/proxy/ [P]',
                '^/bootstrap/ ' + proxyHost + '/bootstrap/ [P]',
                '^/accounts/ ' + proxyHost + '/accounts/ [P]',
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
      all: {
        files: {
          '.tmp/po/template.pot': [
            '<%= yeoman.app %>/<%= yeoman.jsFileDirs %>',
            '<%= yeoman.app %>/<%= yeoman.templateFileDirs %>']
        }
      },
    },

    nggettext_compile: {
      all: {
        files: {
          // dest : src
          'app/translations.js': ['.tmp/po/*.po']
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
          reporterOutput: ""
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
        src: ['dist/*.html','dist/scripts/*.js'],
        overwrite: true,                 // overwrite matched source files
        replacements: [
          
          // we assume that the only 2 styles included with the string "/syles/" in the url are /styles/main/ and /styles/vendor/
          // previously all /styles/ were replaced, but this caused problem with the new mapbox urls that also contain /styles/ 
          {
            from: '/styles/main',
            to: '/static/client/styles/main'
          }, 
          {
            from: '/styles/vendor',
            to: '/static/client/styles/vendor'
          }
          ,{
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
      js: '<%= yeoman.dist %>/scripts/*.js',
      options: {
        assetsDirs: ['<%= yeoman.dist %>', '<%= yeoman.dist %>/images'],
        patterns: {
          js: [
              [/\/(images\/.*?\.(?:gif|jpeg|jpg|png|webp))/gm, 'Update the JS to reference our revved images']
          ]
        }
      },
    },

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
          cwd: 'vendor/bootstrap',
          src: 'fonts/*',
          dest: '<%= yeoman.dist %>'
        }, {
          expand: true,
          cwd: 'vendor/lizard-iconfont/',
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
    mrdoc: {
      all: {
        src: 'app',
        target: 'doc',
        options: {
          title: require('./bower.json').name
        }
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
        project: 'lizard-client',
        resource: 'core',
        i18nType: 'pot'
      },
      src: '.tmp/po/template.pot'
    }
  });


  grunt.registerTask('serve', 'Compile, start a connect web server and watch',
    function (target) {
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
    }
  );

  grunt.registerTask('test', [
    'html2js',
    'karma:unit',
    'jshint:dev'
  ]);

  grunt.registerTask('build', function () {
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-svgmin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-filerev');
    grunt.loadNpmTasks('grunt-text-replace');

    grunt.task.run([
      'clean:dist',
      'translate',
      'html2js',
      'wiredep',
      'useminPrepare',
      'sass',
      'imagemin',
      'copy:styles',
      'autoprefixer',
      'svgmin',
      'concat',
      'ngAnnotate',
      'copy:dist',
      'cssmin',
      'filerev',
      'usemin',
      'replace:dist'
    ]);
  });

  grunt.registerTask('docs', function () {
    grunt.loadNpmTasks('grunt-mrdoc');
    grunt.task.run(['mrdoc']);
  });

  grunt.registerTask(
    'checkOrGetTransifexCredentials',
    'Check if transifex credential are set as environment variable or prompts' +
    ' for credentials.',
    function () {

    var username = grunt.option('txusername') || process.env.TRANSIFEX_USERNAME;
    var password = grunt.option('txpassword') || process.env.TRANSIFEX_PASSWORD;

    if (!username || !password) {
      grunt.log.error('Define environment variables TRANSIFEX_USERNAME or TRANSIFEX_PASSWORD to skip this prompt');
      var done = this.async();

      var prompt = require("prompt");
      var colors = require("colors/safe");

      prompt.message = "";
      prompt.delimiter = ' ';
      prompt.start();
      prompt.get({
        properties: {
          username: {
            description: colors.cyan("What is your transifex username?")
          },
          password: {
            hidden: true,
            description: colors.cyan("What is your password?")
          }
        }
      }, function (err, result) {
        process.env.TRANSIFEX_USERNAME = result.username;
        process.env.TRANSIFEX_PASSWORD = result.password;
        done();
      });
    } else {
      process.env.TRANSIFEX_USERNAME = username;
      process.env.TRANSIFEX_PASSWORD = password;
      grunt.log.oklns('Got transifex credentials for user:', username);
    }
  });

  grunt.registerTask(
    'transifex',
    'Extraxt strings annotated for translation and upload to transifex.',
    function () {
      grunt.loadNpmTasks('grunt-angular-gettext');
      grunt.loadNpmTasks('grunt-tx-source-upload');

      grunt.task.run([
        'checkOrGetTransifexCredentials',
        'nggettext_extract', // extract strings from code
        'tx-source-upload', // upload to transifex
      ]);
    }
  );

  grunt.registerTask(
    'translate',
    'Get translations from transifex and compile for use in app.' ,
    function () {
      grunt.loadNpmTasks('grunt-angular-gettext');
      grunt.task.run([
        'checkOrGetTransifexCredentials',
        'download-po-files',
        'nggettext_compile',
      ]);
    }
  );

  grunt.registerTask('download-po-files',
    'Internal task to get po files for each language from transifex',
    function () {
      var request = require('request');
      var chalk = require('chalk');
      var done = this.async();
      var fs = require('fs');

      grunt.log.ok('Getting available languages');

      var response = '';

      request.get('http://www.transifex.com/api/2/project/lizard-client/resource/core/?details')
      .auth(process.env.TRANSIFEX_USERNAME, process.env.TRANSIFEX_PASSWORD)
      .on('data', function (chunck) {
        response += chunck;
      })
      .on('end', function () {
        getLanguages(JSON.parse(response).available_languages);
      });

      var getLanguages = function (languages) {
        var completed_request = 0;
        grunt.file.mkdir('.tmp/po');

        languages.forEach(function (lang) {

          var writeStream = fs.createWriteStream(
            '.tmp/po/lizard6_lizard-client_' +
            lang.code +
            '.po'
          );

          writeStream.on('finish', function () {
            if (completed_request === languages.length) {
              grunt.log.ok('Received all languages');
              done();
            }
          });

          var options = {
            url: 'http://www.transifex.com/api/2/project/lizard-client/resource/core/translation/' +
              lang.code + '?file',
            auth: {
              user: process.env.TRANSIFEX_USERNAME,
              password: process.env.TRANSIFEX_PASSWORD
            }
          };

          var cb = function (err, res, body) {
            completed_request++;
            if (!err && res.statusCode === 200) {
              grunt.log.writeln(chalk.green('✔ ') + 'Received: ' + lang.name);
            } else {
              grunt.log.writeln(chalk.red('X ') +
                'Something went wrong, missing: ' + lang.name +
                ' status: ', res.statusCode, +
                ' error: ', err
                );
            }
          };

          var req = request(options, cb);

          var stream = req.pipe(writeStream);
        });
      };
    }
  );

};
