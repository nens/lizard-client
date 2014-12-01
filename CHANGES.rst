Changelog of lizard-nxt client
==============================

Unreleased ()
-------------

- Fix name / display_name discrepancy in cards.

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
