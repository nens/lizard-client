/**
 * Lizard-client global state object. Uses getter and setters.
 */
angular.module('lizard-nxt')
  .service('State', [function () {

    // Spatial
    this.spatial = {
      here: {};
      points = []; // History of here for drawing and creating line and polygons
      changedAt = Date.now();
      movedAt = Date.now();
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
      changedZoom: Date.now(),
      zoomEnded: null,
      aggWindow: 1000 * 60 * 5,
      animation: {
        playing: false,
        enabled: false,
      }
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

    // Data layer groups
    this.data = {}

    // Box
    this.box = {
      showCards: false,// Only used for search results
      type: 'point', // Default box type
      //type: undefined, // Should this be set via the hashGetterSetter????
      content: {}, // Inconsistently used to store data to display in box
      changed: Date.now(),
      mouseLoc: [] // Used to draw 'bolletje' on elevation profile
    };

    this.context = '';

  }]);