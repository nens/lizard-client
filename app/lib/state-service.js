/**
 * Lizard-client global state object.
 */
angular.module('lizard-nxt')
  .service('State', ['DataService', 'UtilService', 'dataLayers',
    function (DataService, UtilService, dataLayers) {

    var _context = 'map';
    var CONTEXT_VALUES = ['map', 'db'];
    Object.defineProperty(this, 'context', {
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

    // State of data layer groups
    var _layerGroups = Object.keys(dataLayers);

    this.layerGroups = {};
    Object.defineProperty(this.layerGroups, 'all', {
      value: _layerGroups,
      write: false,
    });
    Object.defineProperty(this.layerGroups, 'active', {
      get: function () {
        return _layerGroups.filter(function (layerGroup) {
          return DataService.layerGroups[layerGroup].isActive();
        });
      },
      set: function (layerGroups) {
        var _active = [];
        angular.forEach(_layerGroups, function (_layerGroup) {
          if (layerGroups.indexOf(_layerGroup) !== -1) {
            _active.push(_layerGroup);
          }
        });
        return _active;
      }
    });

    // Box
    this.box = {};

    var _type = 'point'; // Default box type
    var TYPE_VALUES = ["point", "line", "area"];
    Object.defineProperty(this.box, 'type', {
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
    this.spatial = {
      here: {},
      points: [], // History of here for drawing and creating line and polygons
      bounds: {},
      userHere: {}, // Geographical location of the users mouse
      mapMoving: false
    };

    // TIME MODEL
    var now = Date.now(),
        hour = 60 * 60 * 1000,
        day = 24 * hour,
        MIN_TIME_FOR_EXTENT = (new Date(2014, 0, 0, 0, 0, 0, 0)).getTime(),
        MAX_TIME_FOR_EXTENT = (new Date(2015, 0, 0, 0, 0, 0, 0)).getTime();

    this.temporal = {
      at: Math.round(now - 2.5 * day),
      aggWindow: 1000 * 60 * 5,
      buffering: false,
      timelineMoving: false,
      resolution: null,
      playing: false,
    };

    var _start = now - 6 * day;
    Object.defineProperty(this.temporal, 'start', {
      get: function () { return _start; },
      set: function (start) {
        _start = Math.max(start, MIN_TIME_FOR_EXTENT);
        this.changedZoom = !this.changedZoom;
      }
    });

    var _end = now + day;
    Object.defineProperty(this.temporal, 'end', {
      get: function () { return _end; },
      set: function (end) {
        _end = Math.min(end, MAX_TIME_FOR_EXTENT);
        this.changedZoom = !this.changedZoom;
      }
    });

    this.temporal.aggWindow = UtilService.getAggWindow(
      this.temporal.start,
      this.temporal.end,
      window.innerWidth
    );

  }]);