![Build Status](http://buildbot.lizardsystem.nl/jenkins/buildStatus/icon?job=Lizard-Client Integration 2. Deploy)

# Lizard client

Angular/leaflet/d3 app that visualizes (geo-)information specific for the water sector. It is the front-end in the lizard-nxt ecosystem, with the closed source lizard-nxt django app as an API to the hydra-core db.

* [Install](#Install)
* [Use](#Use)

For more than demo purposes Lizard client depends on:

* [Hydra-core]( https://github.com/nens/hydra-core ), a django app with hydrological models and utils
* [Lizard-nxt]( https://github.com/nens/lizard-nxt ), a django site that provides an api for hydra-core

## Install

Lizard client can be installed independent of the lizard-nxt ecosystem or from within lizard-nxt using mr. developer

### Independent

Clone this repo:

    git clone git@github.com:nens/lizard-client.git
    cd lizard-client

Run NPM install (see [Node Package Manager]( https://www.npmjs.org/ )):

    npm install

If you don't have the bower and grunt-cli do this too:
    
    (sudo) npm install -g bower grunt-cli

Install vendor files:

    bower install

Create dist files (optional) and templates (compulsory):

    grunt build

Point you browser to index.html for a client demo

### Django backend

Django serves a REST API which also bootstraps the data for the client. Tiles and stuff also come from Lizard-NXT django site:
    
    cd to/wherever/this/may/be/lizard-nxt
    bin/django runserver <ip>:<port>

## Use

Use Grunt to simplify development in the client. When developing the client the easiest way to test and watch your files is by running:
  
    bin/grunt serve

Whenever files change, grunt triggers the `test` and the `compile` scripts that compile all the html templates to a js file and run the jasmine tests. The failing tests show up in your notification area.

This error: `Waiting...Fatal error: watch ENOSPC` (on Ubuntu/OS X) when runnning the watch command, means inotify is tracking too many files. Possibly because of Dropbox or other filewatchers. Either switch those off, or increase the amount of files that can be watched by `inotify`:

    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

When you want to add a external library, add it to bower.json with an url to the github or zipfile.
This can be done by hand or if it is available in the bower repo through searching a library and
adding the --save option. Always check your bower.json afterwards. e.g.:

    bin/bower search leaflet-dist
    bin/bower install leaflet-dist --save

### Release

Doing a release for your package is easy. There is a grunt task to tag and push tags to github. 

**NOTE: make sure you are not running `grunt serve` in a different session**

Workflow:

    git pull origin
    git checkout staging
    git merge integration
    grunt release
    git checkout integration 
    git merge staging

This creates a staging release of integration. The release can be pushed to the server by following instructions on https://github.com/nens/lizard-nxt#deployment.

**NOTE:** grunt release expects:

* There is a CHANGES.rst with `Unreleased ()` as a header.
* There is a package.json.
* There is a bower.json.
* You release from `integration` branch.
* There is a `dist` folder where the build will be released.


## Source files
Files are grouped per component, mini angular apps doing one thing. Timeline is currently our most straightforward example. It has a template, a directive, a controller and a service under `app/components/timeline`.

There are still 3 todo's for this example:

1. Preferably the component also contains its own css or sass file with a proper component namespace.
2. It contains unit-tests.
3. The component is a seperate angular module.

The components can include other components and should be used by a *core* module. NOTE: this is a major todo, even the term *core* is under debate. But what is agreed on is that components should be grouped in modules (like mapView and dashboardView modules). Core modules are included by the app's module which resides in the root of `/app`.

`app/lib` contains low level services and non-angular files. These do not make up a component but contain individual pieces of logic that are used by components or *core* modules.

## Browser compatibility chart

Lizard NXT may not work as expected in every browser, which is why we attempt to track compatibility using the following table.
If you experience errors, bugs or visual inconsistency, please `create <https://github.com/nens/lizard-nxt/issues/new>`_ a new issue, and update this table (or contact us).

+---------------------------------------------------------------------------------------------------------------+----------+
| Browser compatibility chart  *(blank: not tested, X: broken, V: success)*                                     |          |
+-------------------+-----+-----+-----+------+----------+----------+--------------+--------------+--------------+----------+
|                   | IE7 | IE8 | IE9 | IE10 | FF (Win) | FF (Mac) | Safari (Mac) | Chrome (Win) | Chrome (Mac) | iPad 2/3 |
+===================+=====+=====+=====+======+==========+==========+==============+==============+==============+==========+
| Omnibox           |     |     |     |      |          |     V    |      V       |              |     V        |          |
+-------------------+-----+-----+-----+------+----------+----------+--------------+--------------+--------------+----------+
| Layer selector    |     |     |     |      |          |     V    |      V       |              |     V        |          |
+-------------------+-----+-----+-----+------+----------+----------+--------------+--------------+--------------+----------+
| Map controls      |     |     |     |      |          |     V    |      V       |              |     V        |          |
+-------------------+-----+-----+-----+------+----------+----------+--------------+--------------+--------------+----------+
| KPI tool          |     |     |     |      |          |     V    |      V       |              |     V        |          |
+-------------------+-----+-----+-----+------+----------+----------+--------------+--------------+--------------+----------+
| Profile tool      |     |     |     |      |          |     V    |      V       |              |     V        |          |
+-------------------+-----+-----+-----+------+----------+----------+--------------+--------------+--------------+----------+
| Styling / layout  |     |     |     |      |          |     V    |      V       |              |     V        |          |
+-------------------+-----+-----+-----+------+----------+----------+--------------+--------------+--------------+----------+

## Angular coding guidelines

A __controller__ is the keeper/guardian of the state: it's primary purpose is the containing of models specific to the part of the DOM it is attached to. It should not store global state, because this get inaccessible from outside the controllers scope. Every controller gets it's own $scope, so it is able to define it's own models: $scope.model0, $scope.model1, $scope.modelFooBar etc. Controllers don't contain business logic, don't do DOM manipulation, no selectors, and no data, unless binding to the DOM. It should not have to contain any watches, because it is either its own model or state that is of no concern to the specific model of the component it is attached to.

A __directive__ serves to $watch any changes on $scopes, and act accordingly: write to $scopes and manipulate the DOM.  The directive can watch for any changes (_read_ $scope(s)), and act accordingly (either _write_ $scope(s) and manipulate the DOM indirectly, or manipulate the DOM directly). It gets it's values (to write to $scope(s)) by calling functions defined in one of it's injected Angular services, which do the actual computations.

A __service__ is used to provide functions representing the business logic of the application, handling API calls, do some simple string formatting etc. A single service can be used by ("injected in") both controllers and directives. We should aim at keeping these services stateless.

__Factories__ are practically equal to services. Services are instantiated by Angular. You can also do that with factories or return a constructor that can be *new*ed: "Factories offer slightly more flexibility than services because they can return functions which can then be new'd. This follows the factory pattern from object oriented programming. A factory can be an object for creating other objects." Factories and services are always singletons, factories can be used to create objects.
