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
    var _context = 'map'; // The default
    var CONTEXT_VALUES = ['map', 'time', 'dashboard', 'scenarios'];
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
      }
    });

    // State of data layer groups, stores slugs of all layergroups and the
    // active layergroups.
    state.layerGroups = {
      all: [], // Immutable representation of all layergroups
      active: [],
      isLoading: null, // Either gettingData or syncingTime
      gettingData: false, // Making server requests through DataService
      timeIsSyncing: false // Getting new layers and so on
    };

    // Combination of data and time syncing
    Object.defineProperty(state.layerGroups, 'isLoading', {
      get: function () {
        return state.layerGroups.timeIsSyncing || state.layerGroups.gettingData;
      }
    });

    // Box
    state.box = {};

    var _type = 'point'; // Default box type
    var TYPE_VALUES = ["point", "line", "area"];
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
      }
    });

    // Spatial
    state.spatial = {
      here: {},
      points: [], // History of here for drawing and creating line and polygons
      bounds: {},
      view: {}, // { lat: <int>, lng:<int>, zoom:<int> }
      userHere: {}, // Geographical location of the users mouse only set by
                    // map-directive when box type is 'line'
      mapMoving: false
    };

    // Temporal
    var now = Date.now(),
        hour = 60 * 60 * 1000,
        day = 24 * hour,
        INITIAL_START_FOR_EXTENT = now - 3 * hour,
        INITIAL_END_FOR_EXTENT = now + 3 * hour;

    state.temporal = {
      at: now,
      aggWindow: 1000 * 60 * 5,  // 5 minutes
      buffering: false,
      timelineMoving: false,
      playing: false,
      start: null, // defined below
      end: null // defined below
    };

    // State.temporal.start must be higher than MIN_TIME_FOR_EXTENT
    var _start = INITIAL_START_FOR_EXTENT;
    Object.defineProperty(state.temporal, 'start', {
      get: function () { return _start; },
      set: function (start) {
        _start = UtilService.getMinTime(start);
        state.temporal.at = _moveAtInTemporalExtent(state.temporal);
      }
    });

    // State.temporal.end must be lower than MAX_TIME_FOR_EXTENT
    var _end = INITIAL_END_FOR_EXTENT;
    Object.defineProperty(state.temporal, 'end', {
      get: function () { return _end; },
      set: function (end) {
        _end = UtilService.getMaxTime(end);
        state.temporal.at = _moveAtInTemporalExtent(state.temporal);
      }
    });

    /**
     * Checks givens temporla state object whether at is within extent. If not
     * returns an adapted at, nicely rounded, to the closest part of the extent.
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
