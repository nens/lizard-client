Changelog of lizard-nxt client
==============================

Unreleased (1.3.5) (XXXX-XX-XX)
-------------------------------
-


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
