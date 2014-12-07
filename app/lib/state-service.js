/**
 * Lizard-client global state object.
 */
angular.module('lizard-nxt')
  .service('State', ['DataService', 'UtilService', 'dataLayers',
    function (DataService, UtilService, dataLayers) {

    var _context = 'map';
    var VALUES = ['map', 'db'];
    Object.defineProperty(this, 'context', {
      get: function () { return _context; },
      set: function (context) {
        if (VALUES.indexOf(context) > -1) {
          _context = context;
        } else {
          throw new Error("Attemped to assign an illegal value ('"
            + context
            + "') to state.context. Only ["
            + VALUES.join(',')
            + "] are accepted values."
          );
        }
      }
    })

    // State of data layer groups
    var _layerGroups = Object.keys(dataLayers);

    this.layerGroups: {};
    Object.defineProperty(this.layerGroups, 'all', {
      value: _layerGroups,
      write: false,
    });
    Object.defineProperty(this.layerGroups, 'active', {
      get: function () {
        return _layerGroups.filter(function (layerGroup) {
          return DataService.layerGroups[layerGroup].isActive();
        });
      }
      set: function (layerGroups) {
        var _active = [];
        angular.forEach(_layerGroups, function (_layerGroup){
          if (layergroups.indexOf(_layergroup) !== -1) {
            _active.push(_layergroup);
          }
        });
        return _active;
      }
    })
    Object.defineProperty(this.layerGroups, 'inactive', {})


    // Box
    this.box = {
      content: {}, // The data currently displayed in  the box
      mouseLoc: [] // To draw 'bolletje' on elevation profile
    };

    var _type = 'point'; // Default box type
    var VALUES = ["point", "line", "area"];
    Object.defineProperty(this.box, 'type', {
      get: function () { return _type; },
      set: function (type) {
        if (VALUES.indexOf(type) > -1) {
          _type = type;
        } else {
          throw new Error("Attemped to assign an illegal value ('"
            + type
            + "') to state.box.type. Only ["
            + VALUES.join(',')
            + "] are accepted values."
          );
        }
        UtilService.addNewStyle(
          "#map * {cursor:" + (n === "line" ? "crosshair" : "") + ";}"
        );
      }
    });

    // Spatial
    this.spatial = {
      here: {};
      points = []; // History of here for drawing and creating line and polygons
      bounds = {};
      userHere = {}; // Geographical location of the users mouse
      mapMoving = false;
    };

    // TIME MODEL
    var now = Date.now(),
        hour = 60 * 60 * 1000,
        day = 24 * hour,
        MIN_TIME_FOR_EXTENT = (new Date(2014, 0, 0, 0, 0, 0, 0)).getTime(),
        MAX_TIME_FOR_EXTENT = (new Date(2015, 0, 0, 0, 0, 0, 0)).getTime();

    this.temporal = {
      aggWindow: 1000 * 60 * 5,
      buffering: false,
      resolution: null,
      playing: false,
    };

    var _start = now - 6 * day;
    Object.defineProperty(this.temporal, 'start', {
      get: function () { return _start; },
      set: function (start) {
        start > MIN_TIME_FOR_EXTENT
          ? _start = start
          : _start = MIN_TIME_FOR_EXTENT;
      }
    });

    var _end = now + day;
    Object.defineProperty(this.temporal, 'end', {
      get: function () { return _end; },
      set: function (end) {
        end < MAX_TIME_FOR_EXTENT
          ? _end = end
          : _end = MAX_TIME_FOR_EXTENT;
      }
    });

    var _at = Math.round(now - 2.5 * day);
    Object.defineProperty(this.temporal, 'at', {
      get: function () { return _at; },
      set: function (at) { _at = at; }
    });

    this.temporal.aggWindow = UtilService.getAggWindow(
      $scope.timeState.start,
      $scope.timeState.end,
      window.innerWidth
    );

  }]);