# Lizard client

Angular/leaflet/d3 app that visualizes (geo-)information for the water sector. It is the front-end in the lizard-nxt ecosystem, with the closed source [Lizard-nxt]( https://github.com/nens/lizard-nxt) django app as an API to the hydra-core db.

[Demo](https://demo.lizard.net)


#### Get up and running

Assuming you have `node~4.4.2`, `npm~2.15.0` and `bower ~1.4.0`. Otherwise see [requirements](#requirements) for the required front-end dev environment. Since lizard-client 4.6.4 it is no longer required to have `grunt-cli` installed globally.

Clone this repo:

```sh
git clone --recursive git@github.com:nens/lizard-client.git
cd lizard-client
```

Install nvm to get the right nodeJS version but without having to reinstall every time.  
Other clients use newer versions of nodeJS.  
Swithing back and forward between different nodeJS versions is hell.  
Nvm eases the pain (slightly).  
Follow instructions for installing nvm here or google yourself:  
https://hackernoon.com/how-to-install-node-js-on-ubuntu-16-04-18-04-using-nvm-node-version-manager-668a7166b854

If nvm is correctly installed use nvm to install nodeJS version 8.17.0:  

```sh
nvm install 8.17.0
```

You can check your nodeJS installations by doing "nvm ls". Version 8.17.0 should be there.  
Now tell nvm to use 8.17.0 for now:  

```sh
nvm use 8.17.0
```


Run npm install to install development dependencies:

```sh
npm install
```

If you encounter the following error:
`fatal error: sass/context.h: No such file or directory compilation
terminated.`
this could be because the libsass souces code is not there during the build
(https://github.com/sass/node-sass/issues/2010).
This which results in no node-sass folder in the node_modules folder after
`npm install`. In that case, use this instead of `npm install`:
```sh
LIBSASS_EXT="no" npm install
```

Install vendor browser packages:

```sh
bower install
```

Start dev server to test and load app in a browser at `http://localhost:9000`:

```sh
npm start
```


If you want to proxy to staging or production:

```sh
./start
```

This starts the start script that will proxy to staging.
If you want to proxy to production, you just have to change the PROXY_HOST in
the start script to the production url.

Previous ways to do this were:

```sh
export SSO_USERNAME=<your_sso_username>
export SSO_PASSWORD=<your_sso_password>
npm start -- --proxyhost=https://nxt.staging.lizard.net
```

Or without environment variables:

```
npm start -- --proxyhost=https://nxt.staging.lizard.net --sso_username=<your_sso_username> --sso_password=<your_sso_password>
```

## Content

* [`npm start`](#npm-start): starts a dev server with Grunt.
* [`npm test`](#test): runs the test.
* [`npm run transifex`](#translations): extracts strings annotated for translation and uploads to transifex.
* [`npm run translate`](#translations): downloads translations from transifex and compile a translations file.
* [`npm run dist`](#build): builds the app as a _compiled_ distribution in `dist/`.
* [`npm run release`](#release): creates a release of your `dist/`.
* [Deployment](#deployment) is done with ansible and [nens/client_deployment](https://github.com/nens/client-deployment), included in this repo as a submodule.

Before you make any commits, make sure to read the general [nens workflow document](https://github.com/nens/inframan/blob/master/workflow/workflow.rst) and the  [commit guidelines](#commit-message-convention,-at-a-glance).


## NPM start
Grunt serves the app on `http://localhost:9000`. Call start with hostname and port `npm start -- --hostname=<hostname> --port=<port>` to serve from a different location.

Whenever files change, grunt triggers the `test` and the `compile` scripts that compile all the html templates to a js file and run the jasmine tests. The failing tests show up in your notification area.

Lizard-client by default proxies all api requests to `http://localhost:8000`. To proxy to a different location change `Gruntfile.js`.

Common practice is to run some sort of container with [Lizard-nxt]( https://github.com/nens/lizard-nxt). Lizard-nxt serves a REST API which also bootstraps the data for the client and serves tile layers. See [Lizard-nxt]( https://github.com/nens/lizard-nxt) for instructions to set up a development server.

_NOTE: Some files do not trigger a reload, this probably has to do with the configuration in `Gruntfile.js`_

## Test
```sh
npm test
```
Runs all tests once.

To only run the test without other develoment you do not need all development dependencies:

```sh
npm install --optional=false
```

Using `--optional=false` saves around halve of all the `node_modules` which is useful for continuous integration.


## Translations
```sh
npm run translate -- --txusername=<your transifex username> --txpassword=<your transifex password>
```
Includes all supported languages and all strings from transifex. It creates a `translations.js` that is included in the app.

To extract all annotated strings from the source and upload to transifex:
```sh
npm run transifex -- --txusername=<your transifex username> --txpassword=<your transifex password>
```
Supported languages:

* Nederlands nl_NL
* Engels en_GB

Lizard-client uses angular-gettext to translate and pluralize texts. See the [docs](https://angular-gettext.rocketeer.be/dev-guide/). All the translation strings are in `app/translations.js`. In the future we might move to support multiple languages in seperate files and lazy loading, see: https://angular-gettext.rocketeer.be/dev-guide/lazy-loading/ .

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
5. Run `npm run translate --txusername=<transifex username> --txpassword=<transifex password>` to get the newest translations or run `npm run release --txusername=<transifex username> --txpassword=<transifex password>` to make a release with the newest translations.


## Build
**NOTE: make sure you are not running `npm start` in a different session**

```sh
git pull origin
git checkout master
```

Create a distribution in `dist/` with translations from transifex:

```sh
npm run dist -- --txusername=<transifex username> --txpassword=<transifex password>
```


## Release

Doing a release of lizard-client is easy:

To tag this as a new release and to add the `dist` folder to the release
attachments we use nens/buck-trap. If you have not already done so, create a github token and add it to `deploy/auth.json`.

You can create your tokens here: https://github.com/settings/tokens Grant the token full access under the repo section

The `auth.json` file should like similar to this:

```json
{
    "token": "Your-token-that-you-created-on-github"
}
```

Release:

```sh
npm run release
```

Buck-trap ups version number in `package.json`, compiles the `CHANGELOG.md` tags and creates a github release with a zipped `dist/`.

_NOTE: Sometimes buck trap messes up for unknown reasons. It does everything except  making the github release. It hangs with the message: `tag already exists`. This sucks because you will have to [clean up the tag](https://nathanhoad.net/how-to-delete-a-remote-git-tag) and revert the release commit._

_NOTE on the NOTE: One time reverting the release commit an making a new release  it did not update the CHANGELOG.md again which resulted in this PR: [#821](https://github.com/nens/lizard-client/pull/821)._

### Releasing hotfixes or patches
Consider fixing bugs before creating new features or release bugfixes together with features. This significantly simplifies development. If you do decide on fixing a bug after merging features and you cannot wait for another official release, create a bugfix branch as described by the [nens workflow](https://github.com/nens/inframan/blob/master/workflow/workflow.rst#bug-fixes).

Do not linger your bugfixes around. It was a bug right? Otherwise you might as well just put it in the normal feature flow. So create a [distribution](#build), release and deploy it. The fixes can be rolled out as patches without affecting the main release track. To run buck-trap from this branch and to release the branch with its `CHANGELOG.md`:

```sh
npm run release -- -b fixes_<bugged version you want to fix>
```

The `CHANGELOG.md` would have to be merged with master after the release, which might give some merge conflicts. C'est la vie.


## Deployment
For the deployment of frontend repositories we make use of an Ansible script in the lizard-nxt repository.
More information is provided in the readme file of lizard-nxt: https://github.com/nens/lizard-nxt/blob/master/README.rst
Look below the heading "Deployment clients".


## Commit Message Convention, at a Glance
Lizard-client compiles its CHANGELOG.md directly from the commits. Therefore commits have to be atomic and follow a strict convention:

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


## Troubleshooting usage

This error: `Waiting...Fatal error: watch ENOSPC` (on Ubuntu/OS X) when runnning the watch command, means inotify is tracking too many files. Possibly because of Dropbox or other filewatchers. Either switch those off, or increase the amount of files that can be watched by `inotify`:

    echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p


Running `grunt serve` may sometimes exit with the error: `Cannot read property 'main' of undefined`.
This is usually caused by a Bower package being listed in `bower.json` while it is not actually installed.

Solved by simply running:

    bower install


## Source files

Files are grouped per component, mini angular apps doing one thing. Data-menu is currently our most straightforward example. It has a template, a directive, a controller and a service under `app/components/data-menu`.

There are still 3 todo's for this example:

1. Preferably the component also contains its own css or sass file with a proper component namespace.
2. It contains unit-tests.
3. The component is a seperate angular module.

The components can include other components and should be used by a *core* module. NOTE: this is a major todo, even the term *core* is under debate. But what is agreed on is that components should be grouped in modules (like mapView and dashboardView modules). Core modules are included by the app's module which resides in the root of `/app`.

`app/lib` contains low level services and non-angular files. These do not make up a component but contain individual pieces of logic that are used by components or *core* modules.


## Requirements

Install Node and [Node Package Manager]( https://www.npmjs.org/ )): (as per: https://github.com/nodesource/distributions#installation-instructions)

```sh
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs
```

If you don't have bower do this too:

```sh
(sudo) npm install -g bower
```

## Angular coding guidelines

A __controller__ is the keeper/guardian of the state: it's primary purpose is the containing of models specific to the part of the DOM it is attached to. It should not store global state, because this get inaccessible from outside the controllers scope. Every controller gets it's own $scope, so it is able to define it's own models: $scope.model0, $scope.model1, $scope.modelFooBar etc. Controllers don't contain business logic, don't do DOM manipulation, no selectors, and no data, unless binding to the DOM. It should not have to contain any watches, because it is either its own model or state that is of no concern to the specific model of the component it is attached to.

A __directive__ serves to $watch any changes on $scopes, and act accordingly: write to $scopes and manipulate the DOM.  The directive can watch for any changes (_read_ $scope(s)), and act accordingly (either _write_ $scope(s) and manipulate the DOM indirectly, or manipulate the DOM directly). It gets it's values (to write to $scope(s)) by calling functions defined in one of it's injected Angular services, which do the actual computations.

A __service__ is used to provide functions representing the business logic of the application, handling API calls, do some simple string formatting etc. A single service can be used by ("injected in") both controllers and directives. We should aim at keeping these services stateless.

__Factories__ are practically equal to services. Services are instantiated by Angular. You can also do that with factories or return a constructor that can be *new*ed: "Factories offer slightly more flexibility than services because they can return functions which can then be new'd. This follows the factory pattern from object oriented programming. A factory can be an object for creating other objects." Factories and services are always singletons, factories can be used to create objects.
