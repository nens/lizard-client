# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="4.6.3"></a>
## [4.6.3](https://github.com/nens/lizard-client/compare/v4.6.2...v4.6.3) (2017-01-09)


### Bug Fixes

* **dashboard:** other syntax for label in graph ([1ad556f](https://github.com/nens/lizard-client/commit/1ad556f))
* **edge:** browser determination by useragent. ([bd5f257](https://github.com/nens/lizard-client/commit/bd5f257))
* **legend:** both MS Edge and IE11 can draw the continuous legend OK ([e34502b](https://github.com/nens/lizard-client/commit/e34502b))
* **legend:** category indicators aren't hidden in IE11 ([4ba0c09](https://github.com/nens/lizard-client/commit/4ba0c09))



<a name="4.6.1"></a>
## [4.6.1](https://github.com/nens/lizard-client/compare/v4.6.0...v4.6.1) (2016-12-16)


### Bug Fixes

* **edge:** fixes legend gradient in Micrsoft Edge. Fixes: nens/lizard-nxt/issues/2155 ([debf328](https://github.com/nens/lizard-client/commit/debf328))
* **omnibox:** Add translation of sewer_system of pumped drainage area ([7fc7729](https://github.com/nens/lizard-client/commit/7fc7729))
* **omnibox:** different icons for different measuringstations ([e2c9712](https://github.com/nens/lizard-client/commit/e2c9712))
* **omnibox:** omnibox now programmatically adjusts its height based on the height of the timeline component  ([#806](https://github.com/nens/lizard-client/issues/806)) ([a2310d3](https://github.com/nens/lizard-client/commit/a2310d3))
* **scenarios:** new results translated ([53baf21](https://github.com/nens/lizard-client/commit/53baf21))
* **temporal rasters:** refreshdata when temporal start, end or at changes, only set temporal.timelineMoving when timeline moves, not when user clicks on timeline ([482e816](https://github.com/nens/lizard-client/commit/482e816))
* **temporal rasters:** request raster data with time parameter for discrete raster, with start and end interval when continuous. ([1d24f59](https://github.com/nens/lizard-client/commit/1d24f59))



<a name="4.6.0"></a>
# [4.6.0](https://github.com/nens/lizard-client/compare/v4.5.1...v4.6.0) (2016-12-15)


### Bug Fixes

* **colormaps:** WMS scaling no longer used when querying colormap endpoint. ([#782](https://github.com/nens/lizard-client/issues/782)) ([635ce7c](https://github.com/nens/lizard-client/commit/635ce7c))
* **csv-export:** Remove traces of old layer group from CSV export service and data service ([fee26d1](https://github.com/nens/lizard-client/commit/fee26d1))
* **dashboard:** en-/disabling vectorizable layers no longer conflicts… ([#775](https://github.com/nens/lizard-client/issues/775)) ([98190f6](https://github.com/nens/lizard-client/commit/98190f6))
* **draggable:** dashboard assetcard timeseries are draggable again. Fixes: nens/lizard-nxt/issues/2135 ([f350c81](https://github.com/nens/lizard-client/commit/f350c81))
* **export modal:** export modal now only iterates over nested asset timeseries if in the Map context. Fixes: nens/lizard-nxt/issues/2086 ([caa0271](https://github.com/nens/lizard-client/commit/caa0271))
* **layout:** remove material-shadow from search box, underlying navbar has it too ([aadf3a9](https://github.com/nens/lizard-client/commit/aadf3a9))
* **legend:** checks if layer has been removed or already rescaled when adding legend data ([3180527](https://github.com/nens/lizard-client/commit/3180527))
* **legend:** checks if layer has been removed or already rescaled when adding legend data ([90d71bd](https://github.com/nens/lizard-client/commit/90d71bd))
* **legend:** cont.legend gets drawn on page load ([3a2f61d](https://github.com/nens/lizard-client/commit/3a2f61d))
* **legend:** show from max to min and same on ff and chrome ([a8fe68b](https://github.com/nens/lizard-client/commit/a8fe68b))
* **map:** Set map view when something besides map changes state view. ([24c0594](https://github.com/nens/lizard-client/commit/24c0594))
* **omnibox:** do not show border for last item in timeseries list. ([f05b51e](https://github.com/nens/lizard-client/commit/f05b51e))
* **omnibox:** In dashboard, only show more timeseries button when there are many timeseries. ([e6d6dbd](https://github.com/nens/lizard-client/commit/e6d6dbd))
* **omnibox:** Stop scrollbar from showing up in omnibox in the dashboard view ([ec41ac6](https://github.com/nens/lizard-client/commit/ec41ac6))
* **omnibox search:** Fix long search results that overflow the omnibox by truncating them with ellipsis ([4ae0dd4](https://github.com/nens/lizard-client/commit/4ae0dd4))
* **raster-store:** API calls use key 'time' instead of 'at' ([92d57db](https://github.com/nens/lizard-client/commit/92d57db))
* **regions:** when fraction is 0 fully white ([232b824](https://github.com/nens/lizard-client/commit/232b824))
* **search:** set state with view of search result, instead of calling map-service directly. ([390a86c](https://github.com/nens/lizard-client/commit/390a86c))
* **translation:** title tag of export scenario button was not picked up for translation ([edb1810](https://github.com/nens/lizard-client/commit/edb1810))
* **zoom buttons:** move out of search bar and show only when in map context ([c156ce1](https://github.com/nens/lizard-client/commit/c156ce1))


### Features

* **rasters:** requests for rasterdata also have key called 'at' ([f7de570](https://github.com/nens/lizard-client/commit/f7de570))
* **search:** Adds looking glass icon to search input.  ([4622992](https://github.com/nens/lizard-client/commit/4622992))



<a name="4.5.1"></a>
## [4.5.1](https://github.com/nens/lizard-client/compare/v4.5.0...v4.5.1) (2016-12-07)


### Bug Fixes

* **dashboard:** display timeseries on left screen edge, everything else in card-content padded 10px from left ([6098212](https://github.com/nens/lizard-client/commit/6098212))
* **omnibox:** Revert horizontal stack in hectares ([#774](https://github.com/nens/lizard-client/issues/774)) ([1b516f0](https://github.com/nens/lizard-client/commit/1b516f0))



<a name="4.5.0"></a>
# [4.5.0](https://github.com/nens/lizard-client/compare/v4.4.0...v4.5.0) (2016-12-07)


### Bug Fixes

* **card-header:** Nameless cards remain nameless. Fixes nens/lizard-nxt[#2124](https://github.com/nens/lizard-client/issues/2124) ([#773](https://github.com/nens/lizard-client/issues/773)) ([3320c21](https://github.com/nens/lizard-client/commit/3320c21))
* **helpmodal:** strings should not use _.merge, but assigned directly ([3e9e0b4](https://github.com/nens/lizard-client/commit/3e9e0b4))


### Features

* **dashboard:** redesigned timeseries ([#771](https://github.com/nens/lizard-client/issues/771)) ([4073f0c](https://github.com/nens/lizard-client/commit/4073f0c))
* **rasters:** Temporal raster vectorizable and with legend too. ([ebd6cce](https://github.com/nens/lizard-client/commit/ebd6cce))



<a name="4.4.0"></a>
# [4.4.0](https://github.com/nens/lizard-client/compare/v4.3.0...v4.4.0) (2016-12-02)


### Bug Fixes

* **barchart:** Fixes stacked barchart colors. ([#748](https://github.com/nens/lizard-client/issues/748)) ([255c8fb](https://github.com/nens/lizard-client/commit/255c8fb))
* **build:** fixed notie being called from window instead of injected as dependency ([94b0709](https://github.com/nens/lizard-client/commit/94b0709))
* **data-menu:** do not capitalize namens, show as configured ([81e2076](https://github.com/nens/lizard-client/commit/81e2076))
* **data-service:** ignore wms getfeatureinfo when not point, fixes nens/lizard-nxt[#2053](https://github.com/nens/lizard-client/issues/2053) and nens/lizard-nxt[#2060](https://github.com/nens/lizard-client/issues/2060) ([138f529](https://github.com/nens/lizard-client/commit/138f529))
* **edge:** rootscope watcher is now only executed in Edge when adding layers, adds strict to data-layer-adder-directive. ([33012f8](https://github.com/nens/lizard-client/commit/33012f8))
* **legend:** include missing template and polish legend ([#758](https://github.com/nens/lizard-client/issues/758)) ([44d1f05](https://github.com/nens/lizard-client/commit/44d1f05))
* **omnibox:** better precision handling, using .toPrecision(3) ([#764](https://github.com/nens/lizard-client/issues/764)) ([d51036b](https://github.com/nens/lizard-client/commit/d51036b))
* **omnibox:** more robust precision handling ([dcadb16](https://github.com/nens/lizard-client/commit/dcadb16))
* **omnibox:** show region's name and area independently ([fb1fa56](https://github.com/nens/lizard-client/commit/fb1fa56))
* **raster-aggregates:** adds boundary type to raster-aggregates request. ([9056a2a](https://github.com/nens/lizard-client/commit/9056a2a))
* **switch:** No asset removal on switch from db to map ([#728](https://github.com/nens/lizard-client/issues/728)) ([6993df7](https://github.com/nens/lizard-client/commit/6993df7))


### Features

* **barcharts:** timeseries with a ratio measurement scale are shown as barcharts. ([#745](https://github.com/nens/lizard-client/issues/745)) ([41430f8](https://github.com/nens/lizard-client/commit/41430f8))
* **debugging:** you can now inspect the State object in the dev console ([#749](https://github.com/nens/lizard-client/issues/749)) ([788adef](https://github.com/nens/lizard-client/commit/788adef))
* **export:** timeseriesexport is now async and downloads xlsx. ([#742](https://github.com/nens/lizard-client/issues/742)) ([96b875c](https://github.com/nens/lizard-client/commit/96b875c))
* **horizontal stack:** horizontal stack in hectares ([9d17eb5](https://github.com/nens/lizard-client/commit/9d17eb5))
* **legend:** data for legend is retrieved+formatted/deleted when necessary ([7c9ecba](https://github.com/nens/lizard-client/commit/7c9ecba))
* **legend:** data for legend is retrieved+formatted/deleted when necessary ([c30c1b4](https://github.com/nens/lizard-client/commit/c30c1b4))
* **legend:** Discrete rasterdata has a visualized legend ([aa82acb](https://github.com/nens/lizard-client/commit/aa82acb))
* **legend:** legend data for cont. and discrete rasters both get visualized in omnibox ([0d1acbe](https://github.com/nens/lizard-client/commit/0d1acbe))



<a name="4.3.0"></a>
# [4.3.0](https://github.com/nens/lizard-client/compare/v4.2.1...v4.3.0) (2016-10-24)


### Bug Fixes

* **graph:** The slug is taken from each property itself (not the property identifier: since the layerrefactoring properties are identified by uuid not a slug). ([a8e72a6](https://github.com/nens/lizard-client/commit/a8e72a6))


### Features

* **graph:** Zoomable barchart along y-axis. ([27951da](https://github.com/nens/lizard-client/commit/27951da))
* **overflow:** Adds sensor level and surface level to overflow omnibox ([#738](https://github.com/nens/lizard-client/issues/738)) ([0139503](https://github.com/nens/lizard-client/commit/0139503))



<a name="4.2.1"></a>
## [4.2.1](https://github.com/nens/lizard-client/compare/v4.2.0...v4.2.1) (2016-10-19)


### Bug Fixes

* **raster:** use params when adding raster. ([4158d78](https://github.com/nens/lizard-client/commit/4158d78))



<a name="4.2.0"></a>
# [4.2.0](https://github.com/nens/lizard-client/compare/4.0.1...v4.2.0) (2016-10-19)


### Bug Fixes

* **favourites:** favourites are restored correctly nens/lizard-nxt[#2036](https://github.com/nens/lizard-client/issues/2036) ([#729](https://github.com/nens/lizard-client/issues/729)) ([dff9f3f](https://github.com/nens/lizard-client/commit/dff9f3f))
* **layers:** add slug as layers to wmsOptions if not explicitly defined in wms or raster layer, fixes nens/lizard-nxt[#2019](https://github.com/nens/lizard-client/issues/2019) ([4fb13b6](https://github.com/nens/lizard-client/commit/4fb13b6))
* **pda:** changed order of pumped drainage area attributes in omnibox ([#732](https://github.com/nens/lizard-client/issues/732)) ([1a98428](https://github.com/nens/lizard-client/commit/1a98428))
* **rasters:** be compatible with user defined, complex and flat wms options ([#735](https://github.com/nens/lizard-client/issues/735)) ([47f45b4](https://github.com/nens/lizard-client/commit/47f45b4))
* **rasters:** pass opts to leaflet ([2000dd5](https://github.com/nens/lizard-client/commit/2000dd5))


### Features

* **apps:** Reintroduces the app labels below the app icons ([#731](https://github.com/nens/lizard-client/issues/731)) ([03a1673](https://github.com/nens/lizard-client/commit/03a1673))
* **release:** add better release scripts and structure that can be reused ([#730](https://github.com/nens/lizard-client/issues/730)) ([008f254](https://github.com/nens/lizard-client/commit/008f254))



# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.




* **docs:** docs are up to date with buck-trap changes ([c917cb0](https://github.com/nens/lizard-client/commit/c917cb0))
* **favourites:** favourites are restored correctly nens/lizard-nxt[#2036](https://github.com/nens/lizard-client/issues/2036) ([#729](https://github.com/nens/lizard-client/issues/729)) ([dff9f3f](https://github.com/nens/lizard-client/commit/dff9f3f))
* **release:** add name of repo for buck-trap ([b0f6c48](https://github.com/nens/lizard-client/commit/b0f6c48))
* **release:** fix release scripts, clean up package.json ([837103e](https://github.com/nens/lizard-client/commit/837103e))
* **release-scripts:** remove some flags etc ([ee9f46a](https://github.com/nens/lizard-client/commit/ee9f46a))

---------------------
This is where we changed the way we do changelogs. First we did this by hand. We now
use nens/buck-trap. It uses the commit messages to create a changelog.

The changelogs for the releases 4.1.16 and 4.2.0 (and everything in between) might suffer
because of it. Because we didn't merge everything properly. After this all should be fine
and fixed.

---------------------

- Fix favourite layer application. Overhaul Favourite.applyFavourite function:
  replace layers in array.

- Fix animate zoom to bounds.


Release 4.1.16 (2016-10-13)
---------------------

- Annotation default not present in portal, if present and active: add and turn
  on.

- Document.title DDSC if ddsc.

- Fix multiple eventseries messup: use uuid to select svg elements
  and prepend with non-numbers to prevent breaking css selectors.

- Pass temporal to data-service so omnibox can draw graphs for temporal data.

- Only poll messages for authenticated users and when browser tab is active and
  not busy.

- On zoom change, update layers to reflect complex wms options.


Release 4.1.16 (2016-10-13)
---------------------

- Annotation default not present in portal, if present and active: add and turn
  on.

- Document.title DDSC if ddsc.

- Fix multiple eventseries messup: use uuid to select svg elements
  and prepend with non-numbers to prevent breaking css selectors.

- Pass temporal to data-service so omnibox can draw graphs for temporal data.

- Only poll messages for authenticated users and when browser tab is active and
  not busy.

- On zoom change, update layers to reflect complex wms options.


Release 4.1.15 (2016-10-10)
---------------------

- Fix rescale, send raster-store slug as layers parameter to wms getLimits.

- Undo changes to add timeseries to dashboard when switching from map.


Release 4.1.14 (2016-10-10)
---------------------

- Undo "do not poll inbox for anonymous users".


Release 4.1.13 (2016-10-7)
---------------------
-


Release 4.1.12 (2016-10-7)
---------------------

- Renamed litology to lithology.

- Fix base layers hiding other layers (#1998).

- Do not poll inbox for anonymous users.

- Fix zoomToBounds() for events.

Release 4.1.11 (2016-10-7)
---------------------

- Show scenario rasters again.


Release 4.1.10 (2016-10-7)
---------------------

- Fix rain statistics.

- Fix empty graphs (Hoogte, Dem).

- Fix icon to switch from dashboard to map is incorrect.

- Fix landuse graph not working for multipolygons (#1942).

- Minor translation issue: Select datalayers.

- Only show a single TS when switching to dashboard view.

- Timeseries CSV export uses correct temporal interval.

Release 4.1.9 (2016-10-4)
---------------------

- Fix graphs for raster aggregate data.

- Fix missing styles parameter.

- Fix agg => aggType.


Release 4.1.8 (2016-10-4)
---------------------

- Fix missing agg request parameter.


Release 4.1.4 (2016-9-30)
---------------------

- Use 3 new icons for (i) multiple point selection, (ii) line selection and
  (iii) area selection.

- Fine tuning of layout of scenarios in layer menu.

- Change the export to retrieve XLSX instead of CSV.


Release 4.1.3 (2016-9-27)
---------------------

- Added titles and attributes for Buildings and Roads.

- Fix nens/lizard-nxt#1955. Raster wms tiles now respect the slug.

- Renamed `layer` into `wmslayer` to match a (Django) model name change.

- Fixed download link of time series export.


Release 4.1.2 (2016-9-9)
---------------------

- Set the right display names for the changed scenarios

- Add inbox to the frontend. Messages contain async downloads

- Nested Assets are now shown as nested assets in dashboard. They also show
  the info and thresholds in the graphs.


Release 4.1.1 (2016-8-26)
---------------------

- Add export screen, with date picker


Release 4.0.4 (2016-8-26)
---------------------

- Include lizard-iconfont in copy step of build.


Release 4.0.3 (2016-8-26)
---------------------

- Fix bug in timeline. It doesn't use api/v2/raster-aggregates to draw ticks
  anymore, but api/v2/rasters/[uuid]/timesteps.

- Adds Jenkinsfile

- Zap timing console statement.

- Fix rain download href.

- Fix bug in styles for temporal rasters.

- Fix raster request not including geometry id.

- Fix no tickmarks, draw tickmarks.

- Fix wmslayers not drawing and wmslayers not returning getFeatureInfo.

- Enable complex dynamic wms styles.

- Fix language not changing, compute property from angular gettext.

- Fix eventseries in timeline and on map.

- Fix rain statisctics.

- De-activate layer on removal.

- Add 10% buffer when zooming to temporal bounds of eventseries.

- Fix increase size of annotation-select-box.

- Determine leaflet z-index by layer type and place in data-menu.

- Show scenarios in layer-adder with 3di icon.

- Fix scenario, match api response.

Release 4.0.2 (2016-8-5)
---------------------

- Fix: apply favourite when applying favourite, not state of favourite.

- Fix request background tiles over https.

- Fix panning around the world and messing up all coordinates.

- Fix not showing quantity in omnibox.

- Fix adding layer which could not be fetched from api: catch and display error.

- Include exclude parameter in layer-add request to filter out existing layers.

- Include scenarios in layer adder.

- Adapt graphs and timeseries to draw new flattened timeseries response as lines
  instead of polygons.


Release 4.0.1 (2016-7-27)
---------------------

- Add pumped drainage area to asset names.

- Add pumped drainage area attributes.

- Fix click feedback for polygons.

- Add scenario item in data-menu.

- Remove old scenario code.

- Remove LayerGroups, use dataLayers and mapLayers with layer directives in
  data-menu.

- Use bootstrap/lizard in json in favor of lizard-bs.js.

- Use favouriteService.applyFavourite for bootstrapping and url state.

- Do not post annotations geometry when attaching annotation to asset.

- Force login when requesting favourite unauthenticated.

- Change notie colors to flatui.


Release 3.2.5 (2016-7-13)
-------------------------

- Fix not showing timeseries for timeseries of nested assets.

- Fix timeseries of parent assets not having thresholds.

- Fix dashboard element sticking to pointer when dropping outside of drop area.


Release 3.2.4 (2016-6-20)
---------------------

- Fix no attributes for nested assets


Release 3.2.3 (2016-6-10)
---------------------

- Replace 'remove' on dom elements, it is not supported on IE.

- Remove another el.dataset in dragging of dashboard cards.


Release 3.2.2 (2016-6-6)
---------------------

- Add timeseries name to selection box, dashboard and graph hover.
- Fix rain download in production.


Release 3.2.1 (2016-5-20)
---------------------

- Reset Annotation form after successful submission.

- Make annotations omnibox collapsed by default.

- Request a confirmation when deleting an annotation.

- Only show annotation box when annotation layer is active or when an asset is
  selected.

- Make annotation text expandable.

- Draw individual points in line charts.

- Fix hovering over nodata.

- Graphs: enable zoom and pan on y-axes.

- Give favourite icon for chart or map.


Release 3.1.2 (2016-5-9)
---------------------

- Add 'About' modal to user menu.


Release 3.1.1 (2016-5-9)
---------------------

- Use new portal temporal bounds instead of hardcoded defaults.
- Align pru with valueSuffix to make tresholds work.

- Removed default values from WantedAttributes.

- Order nestedasset by filter_bottom_level.

- Fix dashboard not emptying correctly when removing asset.


Release 3.0.14 (2016-5-9)
---------------------

- Add vertical scroll bar to omnibox.

- Add interceptor to $http to throttle requests.

- Add thresholds to charts.

- Speed up angular: set debugInfoEnabled of angular compiler to false.


Release 3.0.13 (2016-4-29)
---------------------

- Fix attempting to draw assets (filters) without geometry.

- Fix now in graphs not animating well.

- Fix crosssection transitions not keeping up with temporal animation.

- Remove old graph code (donut).

- Fix showing rain and other data in omnibox.

- Fix search not cleaning scope after enter keypress.

- Fix infinite digest loop, copy land use data.

- Fix landuse label falling outside of svg.

- Fix clicking on cluster zooms too far in.

- Fix multiplying annotations when button bashing.

- Allow multiple assets/geoms in dashboard, independent of single/multi point.
  Go back to one assets when switching to map and box is not multipoint.

- Only make search request if searchstring is longer than 2.

Release 3.0.12 (2016-4-29)
---------------------
Bogus release


Release 3.0.11 (2016-4-26)
---------------------

- Fix dragging active timeseries in dashboard.

- Fix IE svg not scaling well, set height in css.

- Fix IE dashoard dragging, include datalist polyfill and get attribute instead of element.dataset.

- Fix respect to layer minZoom and maxZoom.

- Login button visible if not authenticated.

- Fix search issues related to asynch API calls.


Release 3.0.10 (2016-4-22)
---------------------

- Download rain data directly from 5minute raster endpoint.

- Fix mixing timeseries of nested and parent assets.

- Cancel consecutive calls for timeseries.


Release 3.0.9 (2016-4-19)
---------------------

- Fix relative time not restoring relative.

- Fix line intersection through non temporal rasters again.

- Fix no-data in layer for selected point bugs.


Release 3.0.8 (2016-4-15)
---------------------

- Fixed missing events on zoom to bounds.

- Fix restoring active and inactive layers again.

- Fixed translate 'export' in timeseries template.


Release 3.0.7 (2016-4-15)
---------------------

- Fix show a line graph for temporal rasters some more, replace data in ds.

- Fix ng-repeat error: track annotations by id.

- Fix restore active and inactive layergroups.

- Include loading bar indicator for all requests passing $http.

- Update Notie location.


Release 3.0.6 (2016-4-14)
---------------------

- Fix show a line graph for temporal rasters.


Release 3.0.5 (2016-4-11)
---------------------
- Fix data menu height

- Set image-rendering to pixelated and crisp-edges for pixelart-like rain.

- Set page_size for events requests to 5000.

- Round start & end timestamps on timeseries export URL.

- Set initial start to -2 days and plus three hours.

- Represent nested assets as nested asset cards in omnibox.


Release 3.0.4 (2016-4-5)
---------------------

- Improve adding layer groups by moving filtering to the backend and adding
  pagination.

- Fix plus icon alignment on 'Add data...' data menu item.


Release 3.0.3 (2016-4-4)
---------------------

- Fix the collosal bug that nothing works without the water layer.

- Fix annotations fetching when not authenticated


Release 3.0.2 (2016-4-1)
---------------------

- Fix search bug, ng-change did not pick up.


Release 3.0.1 (2016-4-1)
---------------------

- Remove line REALLY when switching to other tool.

- Fix bolletje yet again. Both on the map and in the graph.
  (nens/lizard-nxt#1616 and nens/lizard-nxt#1615)

- Fix no graph for points in temporal raster.

- Fix no translations in header.

- Fix bootstrap chevron that's missing in dist folder (glyphicon font)

- Fix annotations layer not updating.

- Add choice of organisation when adding an annotation.

- Remove the 'user' from the master controller and inject it only in the
  components that use it.

- Fix graph thowing errors when no data.

- Fix carousel throwing errors when no images.
- Fix weirdness with search. Query now fires search instead of keypress

- Add zoom to api result on ENTER key.
- Add 'remove layergroup from data menu' functionality.

- Fix favourites don't restore inactive layers.


Release 2.11.1 (2016-3-25)
---------------------

- Fix #1596: bulb hover for profile line is back.

- Favourite: Fix #1578 restore area and geometries in favourite.

- Favourite: Replace state when loading favourite using mergeWith.

- Fix bug in image carousel, showing the same image twice when changing time
  interval.

- Enable cross sections to be drawn with only elevation data.
  Update with points.

- Fix Use data.length for bar width when not aggregted events (rain etc).


Release 2.10.4 (2016-3-22)
---------------------

- Prevent duplication of geometries.

- Remove events from timeline when in db, since db shows it in a graph.

- Fix events hopping around freely on the timeline when dragging.

- Fix bug 1564. Backspace doesn't keep open the search results if search query is empty.

- JSHint prettify.

- Fix bug #1485. Elevation / line data is now downloadable again.

- Fix bug #1555 of nens/lizard-nxt. Timeseries can yet again export to csv.

- Remove timeseries of removed assets.

- Search box has a starting query of ""


Release 2.10.3 (2016-3-21)
---------------------
- Fix bug 1565 that close button on search closes all da tings.

- Fix duplicate retrieval of assets (undocumented bug).


Release 2.10.2 (2016-3-18)
---------------------

- Add hover interaction to multiline graphs

- Make the apps buttons a bit less ugly.

- Store and restore timeseries state in dashboard. Refactored state.selected.
  timeseries to contain objects with ts state. DataService.assets.[timeseries]
  contains ts metadata and TimeseriesService.timeseries contains ts in graph
  format with data, state and metadata.
- The reactivated layergroups are not ignored. (by URL or fav)

- Lizard Apps and Favourites are more similar and don't interfere

- Fix the lack of a temporal indicator for some of the graphs

- Make the apps buttons a bit less ugly


Release 2.10.1 (2016-3-11)
---------------------

- Fix delete favourites.

- Cross section: only use timeseries linked to freatic line.

- Don't open image timeseries in a line chart and vice versa.

- Fix selection persist between tools.

- Fix redraw feedback on map when coming from dashboard.

- Add support for timeseries with time image.

- Adding graphs with multiple y-axes.

- Add crosssections visualization in dashboard.

- Add share favourites.

- Remove layergroups from search.

- Adapt search results to updated full-text search API response.

- Improve user menu for mobile devices.

- Make lizard apps screen load dynamically.


Release 2.9.4 (2016-3-1)
---------------------

- Favourites have more state and gets some bugfixes


Release 2.9.3 (2016-2-26)
---------------------
-


Release 2.9.2 (2016-2-26)
---------------------
-


Release 2.9.1 (2016-2-26)
---------------------

- Add colorpicker to omnibox timeseries on the dashboard.

- Added attributes for LeveeCrosssection and MonitoringWell.

- Fix data.data.filter bug in dataservice.

- Add basic support for drag and drop. Click puts ts in seperate graph. Drag
adds ts to existing.


Release 2.8.2 (2016-2-15)
---------------------

- Add default color and order to timeseries.

- Enable toggling timeseries and temporal raster data off in db.

- Add subtle grid in db.

- Improve allignment of graphs in db.


Release 2.8.1 (2016-2-12)
---------------------

- Fix landuse, kind of.

- Fix no rain export.

- Fix statistics.

- Fix no rain in box.

- Up angular and everything related to 1.5.0.

- Draw selected timeseries and raster data in dashboard.

- No longer load map before dashboard. Dashboard no longer needs map.

- Refactored timeseries. State.selected.timeseries keeps track of selected ts
  TimeseriesService synchronizes the data with the selection. Draw graphs for
  TimeseriesService.timeseries.

- Only startPlugins if Lizard plugins is loaded.

- Add chalk to npm dependencies.

- Refine the data-menu restyle.

- Added ansible deployment.

- Add 'add extra layers to the portal' functionality to the data menu.

- Update font-awesome from 4.2.0 to 4.5.0.

- Re-add help button to the user menu.

- Fix data menu tools such that the entire button is clickable instead of just
  the icon.

- Fix data menu crosshair click is also toggles the layer visibility.

- Fix translation of creation errors in annotations directive.

- Add favourites.

- Time relative to now, in the url and in favourites.


Release 2.7.1 (2016-1-29)
---------------------

- Add geometry to annotation and add annotation to geometry. Enabling annotation
  on latlngs.

- Empty vector cache when closing layergroup.

- Use map-service spatialSelect when clicking on events.

- Use specified url when getting 'vector' data. Convert to events when
annotation

- Set full-details to false when more than two selected elements.

- Added notification bar with notie

- Add plugin dom elements and js file

- Adjusted the styling of the plugins.

- Graphs are refactored to display multiple lines.

- Improve the dashboard/map toggle.

- Restyle & resize timeline.

- Added close-card directive to remove assets from selection.

- Added state.assets.selection and state.geometries.selection to store ids of
  selected assets or geometry.

- Migrate data-fetch logic from box to data-service. DataService.assets and
  DataService.geometries contains data of the selection.

- Added ng-animate to omnibox.

- Restyle the user menu.

- Restyle the search box.

- Fix bugs in zoom buttons, openLayerGroups and clearing of the search query.

- Initial restyle of the data menu.


Release 2.6.1 (2016-1-18)
---------------------

- Created specific omnibox dashboard card for dashboard.

- Keep global state when destroying omnibox controller so other controllers can use draw cards for the same assets.

- Get assets data and ts for dashboard omnibox.

- Added header directive for asset cards and use them for point, multi and dashboard cards.

- Remove some obsolete css.

- Keep global stat when destroying omnibox controllers so other controllers can draw cards for the same assets.

- Enable timeseries service to only request meta data.

- Fixed a regression bug in dashboard, tctx is now dashboard.

- Fixed missing parameter referenced unit error in dashboard. It is consistent with the rest, no ts when when the pru is missing.

- Dashboard graphs have a shadow around them and are placed under each other correctly.

- Url sets state for point and multipoint.

- Fixed a bug with spatial.here not cleaned on point scope destroy.

- Fixed a bug with geometry not drawn in multipolygon.

- Sped up the context switch since we no longer need the map to create a dashboard on init.


Release 2.5.1 (2015-12-11)
---------------------

- When rain station request timeseries for a specific aggregation window instead
of a minimum amount of data points.

- RRC is back!

- Improve and fix annotations initial bugs.

- Add translations of codes in filters.

- Add title to timeline toggle.



Release 2.4.1 (2015-11-25)
---------------------

- Bump Angular to 1.4.7

- Remove Restangular.

- Resource service that gets stuff from rest api.

- Add tooltips that are more responsive.

- Add material design shadows.

- Dashboard replaces time-ctx and shows omnibox cards in dashboard

- Fix not compiling any translations.

- Add support for viewing, adding and deleting annotations on assets.

- Remove htmlmin from build it messes up the html and is not necessary with
  gzip.


Release 2.3.2 (2015-11-11)
---------------------

- Check for error when getting translations, check for credentials when calling
  internationalization tasks, put temp translation files in .tmp and give proper
  feedback to grunt user.

- Added search cards for omnibox for timeseries, layergroups which also include
  dates and geolocations.


Release 2.3.1 (2015-11-5)
---------------------

- Fix timeseries download button not working, add target= _blank.

- Show total damage values in results card

- Fix timeseries overriding eachother in time-ctx.

- Add command line host + port options for grunt serve.

- Add translations for entity names and units.

- Remove location listenere from url controller, only set url on init.

- Fix clip path not clipping. Use absolute url to refer to clippath and keep
  track of the url for nxt-d3 instances.


Release 2.2.13 (2016-2-15)
---------------------

- Set max zoom level of leaflet from 19 to 21.

- Updated lookups of shape and material codes in lizard-nxt-filters.js.


Release 2.2.12 (2016-2-5)
---------------------

- Fix not rendering filter attributes in omnibox.


Release 2.2.11 (2016-1-18)
---------------------

- Bump MAX_TIME (future) from 1 to 20 days.


Release 2.2.10 (2016-1-8)
---------------------

- Fix pagination for scenarios page.

- Fix WMSGetFeatureInfo bug wrong relative pixel coordinates.


Release 2.2.9 (2015-12-16)
---------------------

- Fix wms getfeatureinfo getting info of features not being clicked on.

- Fix rescale layer on doubleclick when initial domain is set.

- Fix no units on y-axes in time-ctx.

- Fix labelling of rectangles in tim-ctx out of drawing area.


Release 2.2.8 (2015-12-7)
---------------------

- Fix click on animation pause button not registered.

- Animate only the intersection of map bounds and layer bounds, to have more
  resolution with less data.

- Store bounds of layer on group and layer for zooming to lg and animating wms.


Release 2.2.7 (2015-11-25)
---------------------

- Fix showing empty graphs in time-ctx.

- Fix not updating region data on time change.

- Fix showing a subset of regions, set regions limit to 500.

- Fix not showing a full-details switch in wms getfeatureinfo card. Als include title.


Release 2.2.6 (2015-11-13)
---------------------

- Fix not compiling any translations.


Release 2.2.5 (2015-11-9)
-------------------------

- Remove location listener from url controller, only set state from url on init.


Release 2.2.4 (2015-11-9)
---------------------

- Fix region to point transition throwing error on getting data for no region.

- Fix timeseries download button not working, add target= _blank.

- Remove location listenere from url controller, only set url on init.

- Remove beta warning for region aggregation.

- Fix clip path not clipping. Use absolute url to refer to clippath and keep
  track of the url for nxt-d3 instances.


Release 2.2.3 (2015-10-29)
--------------------------

- Show total damage value in template for scenarios.


Release 2.2.2 (2015-10-28)
---------------------

- Fix reference NAP for groundwaterstations and filter, just do not show it.

- Show filter attributes in filter card.

- Do not request timeline data when bounds are not set.

- Fix empty unit label in time-ctx. Pass aggwindow and use filter in graph.

- Fix transitioning empty selection when clicking while loading previous click.

- Fix vibration of click layer when loading data on init.

- Fix empty select box for nested assets, use serial whem code is not available
  and use id when serial is not available either.

- Send boundary_type to server in region selection to be able to not only select
  admin bounds regions but "pumped drainage area", "fixed drainage level area"
  and "polder" as well.


Release 2.2.1 (2015-10-16)
---------------------

- Add autoprefixer to default loaded grunt tasks.

- Split timeseries logic from DataService and omnibox directive into one
  timeseries component with a directive and service as interface. Refactor point
  template to use new timeseries directive.

- Add nestedasset as an omnibox template directive. Parsing the nested JSON in
  the utfgrid and showing the nested assets in a select box.


Release 2.1.1 (2015-10-5)
---------------------

- Fix code messing up wanted attr table. Show default when undefined, null or
  empty string.

- Fix truncate event values.

- Fix recurrence time has unit years.

- Fix overlapping data-menu titles wrap with elipsis.

- Fix scenario download overwriting app url, set target=_blank to force a
  download.

- Fix inconsistency between time labels in search bar and timeline.

- Fix drawing bars from null data.

- Fix getting center of bounds that do not exist yet in digest loop.

- Fix line export, adapt to api change.

- CSV export for line and point use ; seperator instead of ,.

- Use transifex.com/api/2/lizard-client for translations. Push annotated
  and pull translated strings from transifex on grunt:build. Jenkins will keep
  transifex up to date while every release will use the newest strings.

- Annotate waterchain attributes for translation and use translation filter in
  template.

- Create hyperlink elements for urls in getFeatureInfo response.

- Handle new and old landuse labels in filters.

- Download timeseries as csv directly from server by using format=csv.

- Use the current language of portal or url in search results.


Release 2.0.10 (2015-9-29)
---------------------

- Go to detail view when needed.

- Fix graph hover label falling outside of y range of graph.

- Fix ribbon title for compass image.


Release 2.0.9 (2015-9-11)
---------------------

- Allow asset layers to have different name than 'waterchain', as long as 'waterchain' is in the layergroup slug, it should work. Grid layers should be named <layergroup_slug>_grid.

- Fix buttons showing when card is minimized.

- Fix ludicrous rain export button.

- Fix column width of rain statistics.

- Widen time extent to include data from as early as 1900.


Release 2.0.8 (2015-9-4)
---------------------

- Aggregation tool cannot handle paged responses; cap page_size at 100.


Release 2.0.7 (2015-9-3)
---------------------

- Change scenarios page to omnibox.

- Only create a data layer for wms if get_feature_info is true.

- Add username to sentry.

- Send errors from all lizard portals to sentry projects.


Release 2.0.6 (2015-8-13)
---------------------

-


Release 2.0.5 (2015-8-13)
---------------------

- Typo in timeseries bar / line graph template.


Release 2.0.4 (2015-8-13)
---------------------

-


Release 2.0.3 (2015-8-13)
---------------------

- Only station_type = 1 displays as bar chart.


Release 2.0.2 (2015-8-6)
---------------------

- Consume new format of raster-aggregate responses.

- API is now at v2.


Release 2.0.1 (2015-8-6)
---------------------

-


Release 1.5.15 (2015-8-3)
---------------------

- Get raster aggregates for polygons by geometry id instead of WKT polygon.

- Region name **strong** in card title.

- Display area of region in card title for region aggregates.

- Fix baselanguage not an option from url.

- Change region icon to lemon.


Release 1.5.14 (2015-7-10)
---------------------

- Add getFeatureInfo via backend proxy for wms layers.

- Add region aggregation as a fourth aggregation tool. Draw regions and get
  raster aggregations when clicked.

- Add doxx to build task.

- Add angular-gettext for translations.

- Add grunt tasks to extract and compile translations.

- Translate app to English.

- Add initial translation for gettext to Dutch.

- Add functionality to switch language from url. This breaks current urls, the
  first path element is language and all the others have moved one step.

- Use the locale from lizard-bs.js when no language specified on url.


Release 1.5.13 (2015-7-3)
---------------------

- Fix bug wopping spline interpolation bubbles in ts graphs.


Release 1.5.11 (2015-6-16)
---------------------

- Fix bug timeseries name when only one and in csv.

- Fix bug no retina for real.


Release 1.5.10 (2015-6-16)
---------------------

- Fix bug no retina when https or v4 mapbox tile source.

- Fix bug timeseries name and axis labels incorrect fields.


Release 1.5.9 (2015-6-5)
---------------------

- Fix bug changed filter keyword in events api.


Release 1.5.8 (2015-6-1)
---------------------

-


Release 1.5.7 (2015-6-1)
---------------------

-


Release 1.5.6 (2015-6-1)
---------------------

- Fix bug in swapped keys for rain data bar graphs.


Release 1.5.5 (2015-5-29)
---------------------

- Fix appending the extended options to raster-aggregate requests.

- Fix use ng-style instead of dynamic style attribute.


Release 1.5.4 (2015-5-29)
---------------------

- Fix returning the same area aggregation for every utfgrid area.

- Fix appending options of other layers to raster-aggregate requests.

- Fix temporal wms layers not respecting temporal state changes.


Release 1.5.3 (2015-5-27)
---------------------

- Remove unused utils.js.

- Keep at within time extent.

- Fix bug timeseries download include min max.

- Timeline zoom buttons zoom relative to time extent, not relative to temporal.at.

- Prefer temporal to spatial search results.

- Add display_name for pressure pipes.

- Fix bug timeline only draggable from the top.

- Fix bug getting stuck at temporal.start when animating.

- Fix bug not respecting time when adding vector layer.


Release 1.5.2 (2015-5-15)
---------------------

- Adapt to renamed raster endpoint, to raster-aggregates.


Release 1.5.1 (2015-5-12)
---------------------

- Fix bug due to new timeseries response selectedTS was lost in omnibox when
  zooming time.

- Use subset of data for drawing graphs when zooming.

- Refactor box.location to box.searchResults.

- Refactor location-service to search-service.

- Add date parsing to search bar.


Release 1.4.1 (2015-5-1)
---------------------

- Timeline click and zoom are registered on listeneres rect.

- Timeline axis labels are clickable and zoom to label timestamp.

- Geocode while typing.

- Move to first result when hitting enter in search.

- Use google geocoder instead of mapbox.

- Simulate click on precise geocoding results.

- Limit zooming to 24 hours.

- Limit temporal state to zoom limits.

- Round timestamps in animation.

- Seperate concerns between timeline-service and directive.


Release 1.3.8 (2015-4-8)
---------------------

- Fix raster response line graphs, take into account values wrapped in arrays.

- Remove area controller rain aggregation code that throws error.

- Limit zooming of timeline to time limits.

- Fix rrc getData, include callee parameter.

- Fix invisible labels of horizontal stacked barchart.


Release 1.3.7 (2015-4-3)
---------------------

- When clicked add events of the latlng to the events related to an object.

- Ignore null for grahs.


Release 1.3.6 (2015-4-2)
---------------------

- Fix timeseries in box card of previous click.

- Fix label in wrong place of time-ctx when multiple graphs.

- Only show timeseries card when there is timeseries data.

- Round data values on hover in time-ctx graphs.


Release 1.3.5 (2015-3-31)
---------------------

- Fix timeseries selection box width > card width.

- Fix undefined graph width.

- Add card-content to temporal point graphs.


Release 1.3.4 (2015-3-31)
---------------------

- Adapted scenarios to new api response.

- Export timeseries as CSV for data in browser.

- Fix graph hover mismatch because of interpolated data.

- Fix unable press pause button when animating events.

- Fix flipping of start and end date on page reload.

- Dynamic y-value per event and give events enough space for the whole radius
  and stroke.

- Resize graphs in time-ctx when width of window changes.

- Update api request to backend with new filter syntax.

- Fix update stacked bars.

- Truly add retina support.

- Fix undefined announMovedTimeline in time-controller.

- Increase default height of timeline from 30 to 45 pixels.

- Decrease maximum event radius in timeline to prevent clipping.


Release 1.3.3 (2015-3-26)
---------------------

- Fix undefined announMovedTimeline function that moved to UtilService.


Release 1.3.2 (2015-3-26)
---------------------

- Fix refresh data when zooming to layer bounds.

- Fix remove label when not hovering bar; prevents bug with label remaining
  while zooming

- Fix error when removing event layergroup that has not fully loaded yet.

- Fix barwidth issue for events.

- Fix error in line-controller for rain layer but no rain data.

- Fix export data which starts with null.

- Fix login dissappearance for small screens.

- Fix position aggregate events in timeline.

- Fixed event count disparity.

- Dynamic axis labels for area.

- Fix draw and update tickmarks for temporal rasters.

- Fixed event count disparity.

- Dynamic axis labels for area.


Release 1.3.1 (2015-3-19)
---------------------

- Fix 'bolletje'.

- Fix spatial.points.here undefined.

- Add EventAggregationService to timeline drawLines to reduce number of DOM
   elements in timeline.

- Add logarithmic scaling to circle size of events.

- Draw circles in middle ofaggWindow.

- Accomodate color === undefined in aggregate function.

- Refactor drawLines to drawCircles.

- Set pages_size to 25000 to make one big request without hacky page_size=0.

- Add zoom to data bounds for events.

- Added maximum number of timeseries events to prevent browser running out of
  memory.

- Reconnect events per object.

- Fix bar width of events in time context.

- Add data name attribute as graph title.

- Click and hover over graph in time ctx shows data.

- Adapt to new page_size parameter for events.


Release 1.2.27 (2015-3-5)
---------------------

- Move style from d3 to scss.

- Show tickmarks in timeline for available images for dynamic raster stores.

- Add withCredentials to Restangular for ajax calls when on sandbox.

- Create nice button and transition from and to time ctx from timeline.

- Outline graphs with timeline in time ctx.

- Remove listeners to bounds and layergroups in time ctx.

- Nicely stack graphs on top of timeline for 1 to n data layers in time ctx.

- Fill graphs with data for point timeseries, events, rain, and area events.

- Fix tests by staying backwards compatible on layers with no meta object.

- Context aware button to zoom to bounds in layer chooser.

- zoomToBounds function to quickly locate (raster) data.

- Add local cache to utfgridservice so a query can be answered without a map.

- Only set getData state back to false when all calls have been finished.

- Move getTimeseries to Data-service.

- Adapt to new raster reponse for area.

- Remove elevation curve formatter.

- Add translations for `controlled` attribute of weir.

- Remove dashboard selector dropdown.

- Remove halo shadow.

- Fix indentation in rain controller.

- Fix rain export seperators.

- Fix bug with click on map at top 50 px.

- Fix bug with rain card not respecting zoom buttons.

- Remove broadcasts and hard-coupling between graph and timeline.

- Store selected aggregation for events in time ctx.

- Store selected timeseries and move specific code to directive.

- Scenario table without table header and scrollable.

- Add lookup filter for culvert and weir attributes.


Release 1.2.26 (2015-3-5)
---------------------

- Fix indentation in rain controller.

- Fix rain export seperators.

- Fix bug with click on map at top 50 px.


Release 1.2.25 (2015-2-19)
---------------------

- Always pass integer timestamp to timeseries endpoint.

- Dynamic aggregation type for rain timeline data.

- Update release documentation.

- Fix bug with bar size when event.

- Throw error when no backend is up and running.

- Add credentials to UTFGrid requests.

- Add domains for sandbox rewrites.

- Fix bug with bar size when event.

- Renamed current dashboard to 'time'.

- Add new 6-widget-dashboard.

- Add view to state with two-way binding to map and url.


Release 1.2.23 (2015-2-9)
---------------------

- Changed handling of raster API responses to process metadata.

- Make backend domain constant in lizard-nxt module.

- Change CNAME for gh-pages.

- Update installation documentation.


Release 1.2.24 (2015-2-9)
---------------------
- Fixed bug with bar size of events in dashboard graph.


Release 1.2.22 (2015-2-2)
---------------------

- Fix download line intersection for temporal raster data.


Release 1.2.21 (2015-2-2)
---------------------

- Update formatting time label.


Release 1.2.20 (2015-2-2)
---------------------

- Time label updates precision based on aggWindow.

- Restricted max. amount of rows per CSV.

- Added generic CSV export service (currently only for line-mode).

- Kill looking glass button at search box.

- Repair timeline zoom buttons URL and graph updates.

- Add CNAME file for gh-pages subdomain.

- Update grunt sandbox task to copy CNAME to dist folder.

- Add temporal to box.content and draw graph for temporal point data.

- No redraw of temporal raster when nothing relevant changed.

- Use current spatial bounds for animation.

- Make wms request with EPSG:3857 for image overlays and tiled wms.


Release 1.2.19 (2015-1-27)
---------------------

- Fix syncTime.

Release 1.2.18 (2015-1-27)
---------------------

- Fix bug for rain layer.


Release 1.2.17 (2015-1-27)
---------------------

- Fix bug for non-tiled-wms layer. ZVP broken styles.


Release 1.2.16 (2015-1-26)
---------------------

- Change initial temporal extent to -3, +3 hours.


Release 1.2.13 (2015-1-26)
---------------------

- Fix bug with persisten rain bars.

- Fix bug where timeseries card would be hidden when panning/zooming timeline.

- Fix bug with persistent rain bars.

- Fix bug where timeseries card would be hidden when panning/zooming timeline.

- Fix bug with persistent rain bars


Release 1.2.12 (2015-1-23)
---------------------
-


Release 1.2.11 (2015-1-23)
---------------------

- Improve timeseries omnibox card styling.

- Fix (line-) graph sync to timeline.

- Use tiled wms layer when not animating.

- Fix bug with temporalresolution and animation.

- Get colormap per aggWindow for rain.

- Fix radar/basic slug confusion, store slug is now `rain`.

- Rename weir attribute.


Release 1.2.10 (2015-1-22)
---------------------

- Fix scenario bugs.


Release 1.2.9 (2015-1-22)
---------------------

- Fix zoom buttons map and search box.

- Fix timeline bugs.


Release 1.2.8 (2015-1-22)
---------------------

-


Release 1.2.7 (2015-1-22)
---------------------

- Added groundwaterstations.

- Bigger clusters of size one.

- Conditionally hide timeseries select box if only 1 series.

Release 1.2.3-1.2.6 (2015-1-19)
-------------------------------
- Bugfixes for scenarios. Header title etc


Release 1.2.2 (2015-1-19)
-------------------------

- Limit timeline min and max zoom.

- Baselayergroups now share a single button in datamenu.

- Dashboard button moved to omnibox.

- Timeline visibility toggle.

- Timeline start end labels zapped.

- Simplified layergroup-menu (rm colors/minimaps)

- Cluster events to get better performance.

- Add stuff for demo branch to be released on gh-pages

- Add result scenarios to front-end.

- Fixed bug where API response "message" was treated as "data".

- Improved behaviour of timeline zoom.


Release 1.2.1 (2015-1-8)
------------------------

- Add ability to show histograms as barchart.

- Zapped patches for display_name vs name.

- Beta dashboard implementation for events.


Release 1.1.6 (2015-1-7)
------------------------

- Fix 'TODO' label for source in discrete raster point click.


Release 1.1.5 (2015-1-7)
------------------------

- Fix category 'Overig' in hori. stacked bar charts

- Fix client side handling of discrete rasters.


Release 1.1.3 (2014-12-30)
--------------------------

- Fix 'Cannot read property 'lng' of undefined'.

- Fix 'this._map is null'.

- Fix 'Attempted to add layer undefined while it was already part of the map'


Release 1.0.2 (2014-12-16)
--------------------------

- Help button.

Release 1.1.2 (2014-12-24)
--------------------------

- handle API response for discrete rasters (same format for point/area mode)

- Limit extent 1970 - 2016

- Fix zoomToNow.

- Pass layer options through all services.

- Seperated data-menu from map component.


Release 1.1.1 (2014-12-23)
--------------------------

- timeline: it's "netto width" is made available through UtilService.

- timeline: zoom buttons working.

- Omnibox rain graph syncs x-axis to timeline.

- Grunt release script.

- Show whether the app is getting data from server in menu ribbon.

- Conditional play button.

- Rain recurrence time is optional.

- Clock in the middle.

- Removed unused images.

- Raster animation on day images.

Release 1.1.0 (2014-12-17)
--------------------------

- Force cursor behaviour in point, line and area mode.

- Clean up dependencies.

- Store global state in seperate module.

- Split map from data.

- Update Angular coding guidelines.

- Rain aggregation: gebiedsgemiddelde neerslag in omnibox

- Time extent from 2010.

- UTFGrid aggregation: get all structures for spatial extent.

- Event aggregate service.

- Bar chart supports stacked bars.

- Event radius has logarithmic scale.

- Event circle stroke/fill now get same transparency.

- Single-line omnibox cards have same height as searchbar.

- Line-tool has distinct cursor (crosshair).

- Improved timeline controls: buttons no longer overlap timeline itself.

- Restructured file directory.

- Hide timeseries card when toggling waterchain off.

- Zap console.logs in utilservice

- User name interpolation is now done with ng-bind also for big screens

- CSS is now preprocessed with SASS, fmbo of structure and clarity.

- Minimize cards based on screen size and size of cards.


Release 1.0.2 (2014-12-16)
--------------------------

- Help button


Release 1.0.0 (2014-12-01)
---------------------------

- 1.0.0 release.

Release 1.0rc3 (2014-12-01)
---------------------------

- Fix initial temporal extent: [now - 6 days] <---> [now + 1 day]

- Fixate max range for temporal extent.

- Fix name / display_name discrepancy in cards.

- Seperate card rrc.

- RRC template renders message if rrc returns message.

- Fix bug for undefined utf grid layer.

- Fix navbar login width, and z-index for responsive platforms.

- Fonts in selectors, input etc


Release 1.0rc2 (2014-11-28)
---------------------------

- Fix date export rain.csv.


Release 1.0rc1 (2014-11-28)
---------------------------

- Fixed aggWindow snapping in all cases, always.

- Prettier zoom buttons in timeline.

- Fixed onload error accessing layers before availability.

- fixate minimum width for rain bars

- Fix opacity slider in IE.

- Shorter time label in time line.

- Update ylabel for timeseries graph.

- Fix bug with date parsing from url in IE.

- IE fix for search bar.

- Escape and x-button in search box reset box, points and remove points from
  url.


Release 0.2b17 (2014-11-27)
---------------------------

- Fix pumpstation and channel new entity types.

- Point clicks now have proper alignment for raster response.


Release 0.2b16 (2014-11-26)
---------------------------

- Fix timeline svg margin bug.

- Fix rain area aggregation shows up in box.

- Fixed bug where clippath of landuse graph is associated with elevation graph.

- Fixed snapping of aggWindow.

- Fixed resolving of getData for utf and vector layers.

- Fixed timeseries name and labels with hack.

- Fixed bug with search and hitting spacebar.

- Internet Explorer 9 and lower gets error message.

- Timeline does not interfere with initial point/line request with a
  pre-existing layerSlug request

- Timeline shows events on startup.


Release 0.2b15 (2014-11-24)
---------------------------

- Bars end at the provided value from the api.

- X labels come from the backend again.

- Added ability to animate multiple rasters with different timeSteps.

- TimeStep and time between frames are dependant on temporalresolution of
  layergroups.

- Layegroups return promises when syncing to time. Animation only progresses
  when promises are resolved.

- Changed slug of ahn2 elevation wms layer.

- Y axes are scaled correctly, by filtering nulls.

Release 0.2b12 (2014-11-17)
---------------------------

- Timeline axis displays start and end of timeState in bold.

- Various visual updates on the timeline.

Release 0.2b11 (2014-11-12)
---------------------------

- Transition on events in timeline.

- Height of future indicator has transition.

- Timeline doesn't throw error when nodata is received from rain.

- Events series in timeline are colored.

- Event series can be differentiated by color.

- Measuring stations show timeseries with bar chart.

- Space starts/pauses animation.

- Animation when buffering shows loading circle.

Release 0.2b10 (2014-11-06)
---------------------------

- Refactored timeline.

- Respect load leaflet layers according to their loadorder.

- Fix point data for interval and ratio data.

- Vector data is synced with time

Release 0.2b9 (2014-10-30)
--------------------------

- Fix for double data with tiled vector layers.

- Layer logic lives in its own class.

- Double click performs rescale.

- Clicks in the data menu wait 300 ms for a doubleclick.

- Layergroups have an opacity slider that sets opacity on all leaflet layers.

- Point and line give visual feedback on the map when loading and recieving data.

- Images for structures added to omnibox.

- Added semver bumper.

Release 0.2b8
-------------

- Vector data is summarized in box.

- Scope.box.content now follows a uniform data structure.

- Timeseries are back.

- Vectors (events, or whatever) are now stored in vector service.

- Vectors are received through tiling mechanism.

- Vectors are drawn by leaflet.

- Clicks on vectors are delegated to Angular in stead of through obscure click handlers.

Release 0.2b5
-------------

- Bug fix object attributes.

- Bug fix brush.

- Increase westerschelde resolution.


Release 0.2b4
-------------

- Add rain per month aggregation.

- Rain CSVs now get distinct columns for date + time.

- implement temporal vector directive/layer.

- Rain bars are drawn and removed one by one.

- Converted land use donut to horizontal bar.

- Refactor map directive into map service.

- Animate intersection with dynamic raster data.

- Add jsdoc-conf.json, configuration file for jsdoc.

- Intersection tool shows generic functionality for all 3-or-more-d layers.

Release 0.1
-----------

- Layer chooser is now a directive and has a background-image.

- All clicks on the map result all data available to that location.

- ExtentAggregat is the default card displaying an extent summary of
  all active data layers.

- Layers are mentioned in slug of URL.

- DRY up HTML for cards.

- Events with start and end as line in timeline.

- Events circle radius is logarithmically scaled.

- Include timeState in url hash.

- Events with start and end as line in timeline.

- Events circles on map now don't increase with every redraw.

- Events with start and end as line in timeline.

- Cumulative rain for spatial extent in timeline.

- Event aggregate table in object cards (Performance Indicator).

- Event aggregate table for eventseries (Performance Indicator).

- Simplified omnibox graphs.

- Cumulative rain in card.

- Add rain animation.

- Moved animation logic to timeline controller.

- Cleanup javascript code (d3-wrapper.js and common/ folder).

- Refactored client to get events from API instead of local geojson files.

- Click on timeline to get raster images.

- Use diferent style for the elevation map and rescale when moved.

- Add some quality cards to all entities except: [orifice, channel, csection, flda and csurface].

- Loading utf layers only when the visible layer is already loaded.

- Add object click feedback.

- Impervious surface highlighting tool.

- Fixes timeline brush bugs.

- Animation fast-forward and step-back functionality.

- Timeline redesign.

- Animation for rain images and events.

- Timeline with events.

- Rain images from regenradar.

- Bugfixes for elevation curve.

- Rain data can be requested from the API and the front end.

- Rain and timeseries are coupled with the temporal Extent.

- Removed angular-resource as dependency, replaced by Restangular.

- Raster layers from raster.lizard.net/wms.

- Refactor aggregation UI: aggregated box with controls to toggle timeline alerts.

- Cleanup of depricated client side javascript code.

- Added unit tests for timeline.

- Added coverage, junit and jshint reports (in `qa/`) for jenkins.

- JSHint cleanup.

- Gruntfile cleanup.

- Got tests to run.
