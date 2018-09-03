/**
 * Lizard-client global state object.
 */
angular.module('global-state').service('State',
['UtilService', 'UrlService', 'gettextCatalog', '$http',
function (UtilService, UrlService, gettextCatalog, $http) {

  var CURRENT_STATE_VERSION = 2;
  /* State version change log -- if something about State changes,
     update the version number and document below. Makes it possible
     to see which state version a favourite was saved with.

  1 - First version number, after merging the "improved geom state"
      PR.  Way to recognize that a favourite was saved by the new
      client or the old one.
      Code only for supporting this version is marked 'XXXV1'.

  2 - Selections removed, ChartCompositionService introduced to store
      the state of dashboard charts. Selections from favourites with
      version 1 are translated in FavouritesService.  */

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

  var setActiveLayers = function (layerSlugs) {
    _.forEach(state.layers, { active: false }); 
    layerSlugs.forEach(function (layerSlug) {
      var type = layerSlug.split('$')[0];
      var uuid = layerSlug.split('$')[1];
      var layer = _.find(state.layers, {uuid: uuid, type: type});

      if (layer) {
        layer.active = true;
      } else {
        state.layers.push({uuid: uuid, type: type, active: true});
      }
    });
  };

  var state = {
    VERSION: CURRENT_STATE_VERSION
  };

  // Current language.
  state.language = null;
  // slug of active baselayer, watched by baselayers directive. It is not
  // enumarable iteratees only encounter arrays.
  state.baselayer = null;

  state.annotations = {present: false, active: false};

  // Collection of layers
  state.layers = [];

  // Box
  state.box = {};

  // Spatial
  state.spatial = {
    bounds: {
      // Leaflet bounds object, initialized with a validity check function.
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

  // hydra-core asset id <entity>$<id>,
  // is defined in DataService use state.asset.addAsset
  // to add and state.asset.removeAsset to remove
  // asset, or reset by calling state.resetObjects()
  state.assets = [];

  // Keys: asset keys (e.g. measuringstation$687), values: objects like
  // {timeseries: <timeseriesuuid>}. Used to track which things are selected
  // on the *map* omnibox.
  state.selectedForAssets = {};

  // geojson with points, lines, polygons. Same as
  // asset, is redefined in dataservice. use addGeometry and
  // removegeometry on state.geometries to add or
  // remove individual geometries or use reset function.
  state.geometries = [];
  state.temporal = {};  // Given values in resetState();

  /**
   * returns a function that returns a string representation of the provided
   * attribute of the state. When the state. does not exist, it returns a
   * function that returns "undefined". Useful to $watch the state.
   *
   * NOTE: this was used to watch for state changes. Do not use this anymore.
   * Instead bind a state property to the scope of your directive and use a
   * watch or watchCollection as intended.
   * https://docs.angularjs.org/api/ng/type/$rootScope.Scope
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

  // State.context is a property and restricted to a few values.
  var _context = 'map'; // Set on init from url or defaults to map.
  // var CONTEXT_VALUES = ['map', 'scenarios', 'dashboard'];
  var CONTEXT_VALUES = ['map', 'scenarios', 'charts'];
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

  // State.language is a property that calls gettextCatalog.
  Object.defineProperty(state, 'language', {
    get: gettextCatalog.getCurrentLanguage.bind(gettextCatalog),
    set: function (language) {
      if (gettextCatalog.strings[language]) {
        gettextCatalog.setCurrentLanguage(language);
        $http.defaults.headers.common["Accept-Language"] = language;
      }
    },
    enumerable: true
  });

  // State.layers.active is a calculated property.
  Object.defineProperty(state.layers, 'active', {
    get: function () {
      var actives = [];
      _.forEach(state.layers, function (layer) {
        if (layer.active) {
          actives.push(layer.type + '$' + layer.uuid);
        }
      });
      return actives;
    },
    set: setActiveLayers,
    enumerable: false
  });

  // State.box.type is a property that is restricted to a few values.
  var _type = 'point'; // Default box type
  var TYPE_VALUES = ["point", "line", "region", "multi-point"];
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

  // State.temporal.aggWindow is a calculated read only property.
  Object.defineProperty(state.temporal, 'aggWindow', {
    get: function () {
      var drawingWidth = 320;
      if (state.context === 'charts') {
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
  var _start = state.temporal.at - 2 * UtilService.day;
  Object.defineProperty(state.temporal, 'start', {
    get: function () {
      return _start;
    },
    set: function (start) {
      _start = UtilService.getMinTime(start);
      state.temporal.at = _moveAtInTemporalExtent(state.temporal);
    },
    enumerable: true
  });

  // State.temporal.end must be lower than MAX_TIME_FOR_EXTENT
  var _end = state.temporal.at + 3 * UtilService.hour;
  Object.defineProperty(state.temporal, 'end', {
    get: function () { return _end; },
    set: function (end) {
      _end = UtilService.getMaxTime(end);
      state.temporal.at = _moveAtInTemporalExtent(state.temporal);
    },
    enumerable: true
  });

  state.resetState = function resetState() {
    // Because of the defined properties, don't assign new objects
    // to variables, but mutate the existing ones.
    state.context = 'map';
    state.language = UrlService.getDataForState().language ||'nl';
    state.baselayer = 'topography';
    state.annotations.present = false;
    state.annotations.active = false;
    state.box.type = 'point';

    state.layers.length = 0;

    // DO NOT Reset the spatial view or bounds; they are watched and will soon also reset
    // spatial.bounds, even if that one is loaded from some favourite.
    /* state.spatial.view.lat = 0;
     * state.spatial.view.lng = 0;
     * state.spatial.view.zoom = 0;
     * state.spatial.bounds = {
     *   isValid: function() { return false; }
     * };
     */
    state.spatial.userHere = {};
    state.spatial.mapMoving = false;

    state.assets.length = 0;
    state.geometries.length = 0;

    state.temporal.at = Date.now();
    state.temporal.buffering = false;
    state.temporal.timelineMoving = false;
    state.temporal.playing = false;
    state.temporal.start = state.temporal.at - 2 * UtilService.day;
    state.temporal.end = state.temporal.at + 3 * UtilService.hour;
    state.temporal.relative = true;
    state.temporal.showingTemporalData = false;
  };

  state.resetState();

  var getLayerSlugs = function (stateLayers) {
    var slugs = [];
    _.forEach(stateLayers, function (layers, type) {
      layers.forEach(function (layer) {
        slugs.push(type + '$' + layer.uuid);
      });
    });
    return slugs;
  };

  state.resetObjects = function () {
    // Make arrays empty by setting their length. Don't assign a new list, because
    // there may be variables elsewhere that still hold a reference to the old one.
    state.assets.length = 0;
    state.geometries.length = 0;
  };

  state.applyUrlToState = function (urlState) {
    // Get state information from the URL and update the state using it.
    if (urlState.language) { state.language = urlState.language; }
    if (urlState.baselayer) { state.baselayer = urlState.baselayer; }
    if (urlState.context) { state.context = urlState.context; }
    if (urlState.boxType) { state.box.type = urlState.boxType; }
    state.annotations.active = urlState.annotationsActive;

    var view = urlState.view;
    if (view) {
      state.spatial.view.lat = view.lat;
      state.spatial.view.lng = view.lng;
      state.spatial.view.zoom = view.zoom;
    }

    var temporal = urlState.temporal;
    if (temporal) {
      if (typeof temporal.start !== 'undefined') {
        state.temporal.start = temporal.start;
      }
      if (typeof temporal.end !== 'undefined') {
        state.temporal.end = temporal.end;
      }
    }

    if (urlState.activeLayers) {
      setActiveLayers(urlState.activeLayers);
    }

    if (urlState.geometries) {
      urlState.geometries.forEach(function (geometry) {
        state.geometries.addGeometry(geometry);
      });
    }

    if (urlState.assets) {
      urlState.assets.forEach(function (asset) {
        state.assets.addAsset(asset);
      });
    }
  };

  state.isRainyLayer = function (layer) {
    return layer.slug === 'rain' || layer.slug.indexOf('harmonie') !== -1;
  };

  state.getLayerByUuid = function (uuid) {
    return _.find(state.layers, {uuid: uuid});
  };

  state.shortenUUID = function (uuid) {
    var SHORT_UUID_LENGTH = 7;
    return uuid.length > SHORT_UUID_LENGTH
      ? uuid.slice(0, SHORT_UUID_LENGTH)
      : uuid;
  };

  state.findLayer = function (uuid) {
    var shortUUID = state.shortenUUID(uuid),
        stateLayer = _.find(state.layers, { uuid: shortUUID });
    if (!stateLayer) {
      console.error("[E] Couldn't find stateLayer with UUID:", shortUUID);
    } else {
      return stateLayer;
    }
  };

  return state;
}]);
