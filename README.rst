Lizard client
=============

Angular/leaflet/d3 app that visualizes (geo-)information specific for the water sector. It is the front-end in the lizard-nxt ecosystem, with the closed source lizard-nxt django app as an API to the hydra-core db.

* `Install`_
* `Use`_

For more than demo purposes Lizard client depends on:

* `Hydra-core <https://github.com/nens/hydra-core>`_, a django app with hydrological models and utils
* `Lizard-nxt <https://github.com/nens/lizard-nxt>`_, a django site that provides an api for lizard nxt

Install
-------

Clone this repo::

  git clone git@github.com:nens/lizard-client.git

  cd lizard-client

Run NPM install (see `Node Package Manager <https://www.npmjs.org/>`)::

  npm install

Install vendor files::

  bower install

Create dist files (optional) and templates (compulsory)::

  grunt


Use
---

Use Grunt to simplify development in the client. When developing the client the easiest way to test and watch your files is by running::
  
  bin/grunt watch

Whenever files change, grunt triggers the `test` and the `compile` scripts that compile all the html templates to a js file and run the jasmine tests. The failing tests show up in your notification area.

This error: `Waiting...Fatal error: watch ENOSPC` (on Ubuntu/OS X) when runnning the watch command, means inotify is tracking too many files. Possibly because of Dropbox or other filewatchers. Either switch those off, or increase the amount of files that can be watched by `inotify`::

  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p

When you want to add a external library, add it to bower.json with an url to the github or zipfile.
This can be done by hand or if it is available in the bower repo through searching a library and
adding the --save option. Always check your bower.json afterwards. e.g.::

  bin/bower search leaflet-dist
  bin/bower install leaflet-dist --save


Browser compatibility chart
---------------------------

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
