/**
 * Lizard-client global state object.
 */
angular.module('global-state')
  .service('State', ['dataLayers', 'UtilService',
    function (dataLayers, UtilService) {

    var state = {};

    /**
     * returns a function that returns a string representation of the provided
     * attribute of the state. When the state. does not exist, it returns a
     * function that returns "undefined". Useful to $watch the state.
     */
    state.toString = function (stateStr) {
      return function () {
        var property = state;
        angular.forEach(stateStr.split('.'), function (accessor) {
          if (property) {
            property = property[accessor];
          }
        });
        if (typeof property === 'string') {
          return property;
        } else {
          return JSON.stringify(property);
        }
      };
    };

    // Context. State.context returns 'map' or 'db', it can only be set with
    // either one of those values.
    var _context = ''; // Set on init from url or defaults to map.
    var CONTEXT_VALUES = ['map', 'dashboard', 'scenarios'];
    Object.defineProperty(state, 'context', {
      get: function () { return _context; },
      set: function (context) {
        if (CONTEXT_VALUES.indexOf(context) > -1) {
          _context = context;
        } else {
          throw new Error("Attemped to assign an illegal value ('"
            + context
            + "') to state.context. Only ["
            + CONTEXT_VALUES.join(',')
            + "] are accepted values."
          );
        }
      },
      enumerable: true
    });

    // Default language.
    state.language = 'nl';

    // State of data layer groups, stores slugs of all layergroups and the
    // active layergroups.
    state.layers = {
      active: [], // slugs of actives with type prefix, set and get by
                  // dataservice.
      assets: [],
      rasters: [],
      wms: [],
      eventseries: [],
      annotations: []
    };

    // slug of active baselayer, watched by baselayers directive. It is not
    // enumarable to any iteratees only encounter arrays.
    Object.defineProperty(state.layers, 'baselayer', {
      enumerable: false,
      writable: true,
      value: 'topography'
    });

    var getLayerSlugs = function (stateLayers) {
      var slugs = ['baselayer' + '$' + stateLayers.baselayer];
      _.forEach(stateLayers, function (layers, type) {
        layers.forEach(function (layer) {
          slugs.push(type + '$' + layer.slug);
        });
      });
      return slugs;
    };

    var setActiveLayers = function (layerSlugs) {
      layerSlugs.forEach(function (layerSlug) {

        var type = layerSlug.split('$')[0];
        var slug = layerSlug.split('$')[1];

        if (type === 'baselayer') { state.layers.baselayer = slug; }

        else if (state.layers[type]) {
          var layer = _.pick(state.layers[type], {slug: slug});

          if (layer.slug) { layer.active = true; }

          else {
            state.layers[type].push({slug: slug, active: true});
          }
        }

      });
    };

    // List of slugs of active layers, two-way.
    Object.defineProperty(state.layers, 'active', {
      get: function () {
        return getLayerSlugs(state.layers);
      },
      set: setActiveLayers,
      enumerable: false
    });

    // All layers, read only.
    Object.defineProperty(state.layers, 'all', {
      get: function () {
        var layers = [];
        _.forEach(state.layers, function (type) {
           layers.push(type);
        });
        return layers;
      },
      enumerable: false
    });

    // Box
    state.box = {};

    var _type = 'point'; // Default box type
    var TYPE_VALUES = ["point", "line", "region", "area", "multi-point"];
    Object.defineProperty(state.box, 'type', {
      get: function () { return _type; },
      set: function (type) {
        if (TYPE_VALUES.indexOf(type) > -1) {
          _type = type;
        } else {
          throw new Error("Attemped to assign an illegal value ('"
            + type
            + "') to state.box.type. Only ["
            + TYPE_VALUES.join(',')
            + "] are accepted values."
          );
        }
      },
      enumerable: true
    });

    // Spatial
    state.spatial = {
      bounds: { // leaflet bounds object, initialized with a validity check
                // function.
        isValid: function () { return false; }
      },
      view: {lat: 0, lng: 0, zoom: 0}, // { lat: <int>, lng:<int>, zoom:<int> }
      userHere: {}, // Geographical location of the users mouse only set by
                    // map-directive when box type is 'line'
      mapMoving: false
    };

    // there is one selected feature which is not being described here.
    // and is being set in MapDirective (in the _mouseMove function).
    // This is only relevant for drawing an intersection line in the map.
    // The location and the distance of the location to the first point of the
    // is being calculated and set on mouseOnLine for the graph.
    state.selected = {
      assets: [], // hydra-core asset id <entity>$<id>,
                  // is defined in DataService use state.selected.asset.addAsset
                  // to add and state.selected.assetremoveAsset to remove
                  // asset, or reset by calling state.selected.reset()
      geometries: [], // geojson with points, lines, polygons. Same as asset,
                      // is redefined in dataservice. use addGeometry and
                      // removegeometry on state.selected.geometries to add or
                      // remove individual geometries or use reset function.
      timeseries: [], // {<uuid>, <active>, <order>, <color>}
                      // Redefined in timeseriesService. mirrored asynchronously
                      // by timeseriesService.timeseries. Array contains all
                      // timeseries of all assets in a flat list.
      reset: function () {
        // Selected items
        state.selected.assets = [];
        state.selected.geometries = [];
        state.selected.timeseries = [];
      }
    };

    state.selected.reset();

    // Temporal
    var now = Date.now(),
        INITIAL_START_FOR_EXTENT = now - 2 * UtilService.day,
        INITIAL_END_FOR_EXTENT = now + 3 * UtilService.hour;

    state.temporal = {
      at: now,
      buffering: false,
      timelineMoving: false,
      playing: false,
      start: null, // defined below
      end: null, // defined below
      relative: true // relative or absolut offset.
    };

    Object.defineProperty(state.temporal, 'aggWindow', {

      get: function () {

        var drawingWidth = 320;
        if (state.context === 'dashboard') {
          drawingWidth = angular.element('.dashboard-wrapper').width();
        }

        return UtilService.getAggWindow(
          state.temporal.start,
          state.temporal.end,
          drawingWidth
        );
      }
    });

    // State.temporal.start must be higher than MIN_TIME_FOR_EXTENT
    var _start = INITIAL_START_FOR_EXTENT;
    Object.defineProperty(state.temporal, 'start', {
      get: function () { return _start; },
      set: function (start) {
        _start = UtilService.getMinTime(start);
        state.temporal.at = _moveAtInTemporalExtent(state.temporal);
      },
      enumerable: true
    });

    // State.temporal.end must be lower than MAX_TIME_FOR_EXTENT
    var _end = INITIAL_END_FOR_EXTENT;
    Object.defineProperty(state.temporal, 'end', {
      get: function () { return _end; },
      set: function (end) {
        _end = UtilService.getMaxTime(end);
        state.temporal.at = _moveAtInTemporalExtent(state.temporal);
      },
      enumerable: true
    });

    /**
     * Checks given temporal state object whether `at` is within extent. If not
     * returns rounded `at` at start or end of time extent depending on
     * location of original `at`
     *
     * @param  {object} ts temporal state
     * @return {int}    at in ms from epoch.
     */
    var _moveAtInTemporalExtent = function (ts) {
      var _at = ts.at;
      if ((ts.at + ts.aggWindow) > ts.end) {
        _at = UtilService.roundTimestamp(
          ts.end,
          ts.aggWindow,
          true
        ) - ts.aggWindow;
      } else if (ts.at < ts.start) {
        _at = UtilService.roundTimestamp(
          ts.start,
          ts.aggWindow,
          true // round up.
        );
      }
      return _at;
    };

    return state;
  }]);
