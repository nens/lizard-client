Changelog of lizard-nxt client
==============================

unreleased
----------

- implement temporal vector directive/layer

- Rain bars are drawn and removed one by one

- Converted land use donut to horizontal bar

- Refactor map directive into map service.

- Animate intersection with dynamic raster data.

- Add jsdoc-conf.json, configuration file for jsdoc.

- Intersection tool shows generic functionality for all 3-or-more-d layers.

Release 0.1
-----------

- Layer chooser is now a directive and has a background-image.

- All clicks on the map result all data available to that location

- ExtentAggregat is the default card displaying an extent summary of
  all active data layers

- Layers are mentioned in slug of URL

- DRY up HTML for cards

- Events with start and end as line in timeline

- Events circle radius is logarithmically scaled.

- Include timeState in url hash

- Events with start and end as line in timeline

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

- Add some quality cards to all entities except: [orifice, channel, csection, flda and csurface]

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

- Rain data can be requested from the API and the front end

- Rain and timeseries are coupled with the temporal Extent

- Removed angular-resource as dependency, replaced by Restangular

- Raster layers from raster.lizard.net/wms

- Refactor aggregation UI: aggregated box with controls to toggle timeline alerts

- Cleanup of depricated client side javascript code

- Added unit tests for timeline.

- Added coverage, junit and jshint reports (in `qa/`) for jenkins.

- JSHint cleanup.

- Gruntfile cleanup.

- Got tests to run.
