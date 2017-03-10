![Build Status](http://buildbot.lizardsystem.nl/jenkins/buildStatus/icon?job=Lizard-Client Integration 2. Deploy)


# Lizard client

Angular/leaflet/d3 app that visualizes (geo-)information specific for the water sector. It is the front-end in the lizard-nxt ecosystem, with the closed source lizard-nxt django app as an API to the hydra-core db.

* [Install](#Install)
* [Use](#Use)

For more than demo purposes Lizard client depends on:

* [Hydra-core]( https://github.com/nens/hydra-core ), a django app with hydrological models and utils
* [Lizard-nxt]( https://github.com/nens/lizard-nxt ), a django site that provides an api for hydra-core


## Requirements
Install Node and npm (as per: https://github.com/nodesource/distributions#installation-instructions)

    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
    sudo apt-get install -y nodejs


## Install

Lizard client can be installed independent of the lizard-nxt ecosystem.


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

    grunt serve

Point you browser to index.html for a client demo. By default, lizard is in
English. To enable other languages run:

    grunt translate --txusername=<transifex username> --txpassword=<transifex password>


### Django backend

Django serves a REST API which also bootstraps the data for the client. Tiles and stuff also come from Lizard-NXT django site:

    cd to/wherever/this/may/be/lizard-nxt
    bin/django runserver <ip>:<port>


## Use

Use Grunt to simplify development in the client. When developing the client the easiest way to test and watch your files is by running:

    bin/grunt serve

Whenever files change, grunt triggers the `test` and the `compile` scripts that compile all the html templates to a js file and run the jasmine tests. The failing tests show up in your notification area.

When you want to add a external library, add it to bower.json with an url to the github or zipfile.
This can be done by hand or if it is available in the bower repo through searching a library and
adding the --save option. Always check your bower.json afterwards. e.g.:

    bin/bower search leaflet-dist
    bin/bower install leaflet-dist --save


## Troubleshooting usage

This error: `Waiting...Fatal error: watch ENOSPC` (on Ubuntu/OS X) when runnning the watch command, means inotify is tracking too many files. Possibly because of Dropbox or other filewatchers. Either switch those off, or increase the amount of files that can be watched by `inotify`:

    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p


Running `grunt serve` may sometimes exit with the error: `Cannot read property 'main' of undefined`.
This is usually caused by a Bower package being listed in `bower.json` while it is not actually installed.

Solved by simply running:

    bower install


## Commit Message Convention, at a Glance
(this section is copied from https://github.com/conventional-changelog/standard-version#commit-message-convention-at-a-glance)

_patches:_

```sh
git commit -a -m "fix(parsing): fixed a bug in our parser"
```

_features:_

```sh
git commit -a -m "feat(parser): we now have a parser \o/"
```

_breaking changes:_

```sh
git commit -a -m "feat(new-parser): introduces a new parsing library
BREAKING CHANGE: new library does not support foo-construct"
```

_other changes:_

You decide, e.g., docs, chore, etc.

```sh
git commit -a -m "docs: fixed up the docs a bit"
```

_but wait, there's more!_

Github usernames (`@bcoe`) and issue references (#133) will be swapped out for the
appropriate URLs in your CHANGELOG.

The commits made are reflected in the Changelog. See the (changelog)[CHANGELOG.md] for an example.

## Release

Doing a release for your package is easy(-ish). There is a grunt task to tag and push tags to github.

**NOTE: make sure you are not running `grunt serve` in a different session**

Workflow:

    git pull origin
    git checkout master

    grunt --txusername=<transifex username> --txpassword=<transifex password>

This creates a build in the `dist/` folder.

To tag this as a new release and to add the `dist` folder to the release
attachments you we use nens/buck-trap. It versions your repo and changes the changelog for you.

	npm run buck-trap

**NOTE:** buck-trap assumes:

* There is a package.json.
* You release from `master` branch.
* There is a `dist` folder which will be attached to the release on github

#### Releasing hotfixes or patches
If a stable release is coming out release it and start a new branch for the
stable release e.g.:

	git checkout -b release4.0

If stuff is fixed on this branch, the fixes can be rolled out as patches without
affecting the mainline release track.
To run buck-trap from this branch and to release the branch with its `CHANGELOG.md`

	npm run buck-trap -- -b release4.0

The fixes and the `CHANGELOG.md` would have to be merged with master, which might
give some merge conflicts. C'est la vie.


## Deployment

For the deployment of frontend repositories we make use of the client
deployment repository https://github.com/nens/client-deployment. It is already
included as a git submodule in this repo.

Init the git submodule if you haven't done so:

    git submodule init

To update the git submodule:

    git pull --recurse-submodules
    git submodule update --remote

Deployment is done with `ansible`. Make sure to install ansible with eg:

    pip install ansible

Copy `deploy/hosts.example` to `deploy/hosts` and `deploy/production_hosts.example` to `deploy/production_hosts` and edit to match your server layout. Also copy the `deploy/group_vars\all.example` to `deploy/group_vars/all`:

    cp deploy/hosts.example deploy/hosts
    cp deploy/production_hosts.example deploy/production_hosts
    cp deploy/group_vars/all.example deploy/group_vars/all

Adjust the variables to reflect your layout. E.g. fill in build_user: `build_user: 'jeanjacquesmarieantoinette'`

Deployment to integration is done by Jenkins. All it does for deployment is check out the client repo in the right place and build project. Meanwhile the tests are being run and the JavaScript checked for syntax errors or style errors with JSHint.

Deploy to staging:

    ansible-playbook -i deploy/hosts --limit=staging -K deploy/deploy.yml --extra-vars="version=2.7.1"

Deploy to production:

    ansible-playbook -i deploy/production_hosts -K deploy/deploy.yml --extra-vars="version=2.7.1"


### Bootstrapping

For bootstrapping purposes, the DD-viewer needs some data from
[https://digitaledelta.lizard.net/bootstrap/lizard/](https://digitaledelta.lizard.net/bootstrap/lizard/).
This JSON determines the base layers and overlays, the spatial and temporal
viewport, etc., and is the recommended way to initialize the client. If you are
inclined to override any of these settings, it's possible the save the file
locally as `dd-bootstrap.json`, edit it, and place it next to `index.html`.


## Source files

Files are grouped per component, mini angular apps doing one thing. Timeline is currently our most straightforward example. It has a template, a directive, a controller and a service under `app/components/timeline`.

There are still 3 todo's for this example:

1. Preferably the component also contains its own css or sass file with a proper component namespace.
2. It contains unit-tests.
3. The component is a seperate angular module.

The components can include other components and should be used by a *core* module. NOTE: this is a major todo, even the term *core* is under debate. But what is agreed on is that components should be grouped in modules (like mapView and dashboardView modules). Core modules are included by the app's module which resides in the root of `/app`.

`app/lib` contains low level services and non-angular files. These do not make up a component but contain individual pieces of logic that are used by components or *core* modules.


## Internationalization

Supported languages:

* Nederlands nl_NL
* Engels en_GB

Lizard-client uses angular-gettext to translate and pluralize texts. See the [docs](https://angular-gettext.rocketeer.be/dev-guide/). All the translation strings are in `app/translations.js`. In the future we might move to support multiple languages in seperate files and lazy loading, see: https://angular-gettext.rocketeer.be/dev-guide/lazy-loading/ .

To include translation, make sure you have all the dependencies by calling `npm install` and run `grunt translate --txusername=<transifex username> --txpassword=<transifex password>` which downloads our translations from transifex and creates a `translations.js` that is included in the app.

The first part of the url's path indicates the lanuage. When requesting `/en`
the app should be in English. Strings still appearing in Dutch need to be
annotated for translation, this is a bug. When requesting `/nl` all strings
should be in Dutch, when string are still in English, the text is either not
translated or the text is in English but not properly annotated, the latter is a
[bug](https://github.com/nens/lizard-nxt/issues), the first requires translation
on [transifex](https://www.transifex.com/nens/lizard-client/) and a new release.


To create a new string that requires translation:

1. Use `<span translate>Hi!</span>`, or for more complicated cases check the docs: [on html elements](https://angular-gettext.rocketeer.be/dev-guide/annotate/), [or in the source code](https://angular-gettext.rocketeer.be/dev-guide/annotate-js/). The app is in English which is translated to other languages.
2. Create a PR to merge to master and let buildbot do the heavy lifting or call `grunt translate --txusername=<transifex username> --txpassword=<transifex password>` as administrator of transifex to upload strings for translation.
4. Get yourself a language wizard and get some coffee.
5. Run `grunt translate --txusername=<transifex username> --txpassword=<transifex password>` to get the newest translations or run `grunt release --txusername=<transifex username> --txpassword=<transifex password>` to make a release with the newest translations.



## Angular coding guidelines

A __controller__ is the keeper/guardian of the state: it's primary purpose is the containing of models specific to the part of the DOM it is attached to. It should not store global state, because this get inaccessible from outside the controllers scope. Every controller gets it's own $scope, so it is able to define it's own models: $scope.model0, $scope.model1, $scope.modelFooBar etc. Controllers don't contain business logic, don't do DOM manipulation, no selectors, and no data, unless binding to the DOM. It should not have to contain any watches, because it is either its own model or state that is of no concern to the specific model of the component it is attached to.

A __directive__ serves to $watch any changes on $scopes, and act accordingly: write to $scopes and manipulate the DOM.  The directive can watch for any changes (_read_ $scope(s)), and act accordingly (either _write_ $scope(s) and manipulate the DOM indirectly, or manipulate the DOM directly). It gets it's values (to write to $scope(s)) by calling functions defined in one of it's injected Angular services, which do the actual computations.

A __service__ is used to provide functions representing the business logic of the application, handling API calls, do some simple string formatting etc. A single service can be used by ("injected in") both controllers and directives. We should aim at keeping these services stateless.

__Factories__ are practically equal to services. Services are instantiated by Angular. You can also do that with factories or return a constructor that can be *new*ed: "Factories offer slightly more flexibility than services because they can return functions which can then be new'd. This follows the factory pattern from object oriented programming. A factory can be an object for creating other objects." Factories and services are always singletons, factories can be used to create objects.
