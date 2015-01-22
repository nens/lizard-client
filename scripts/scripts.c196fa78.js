
function isDefined(value) {
  return typeof value !== 'undefined';
}

function tryDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    // Ignore any invalid uri component
  }
}

function encodeUriQuery(val, pctEncodeSpaces) {
  return encodeURIComponent(val)
            .replace(/%40/gi, '@')
            .replace(/%3A/gi, ':')
            .replace(/%24/g, '$')
            .replace(/%2C/gi, ',')
            .replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
}

// Why don't we put this in the UtilService itself?
function parseKeyValue(keyValue) {
  var obj = {}, key_value, key;
  angular.forEach((keyValue || "").split('&'), function (keyValue) {
    if (keyValue) {
      key_value = keyValue.split('=');
      key = tryDecodeURIComponent(key_value[0]);
      if (angular.isDefined(key)) {
        var val = angular.isDefined(key_value[1]) ? tryDecodeURIComponent(key_value[1]) : true;
        if (!obj[key]) {
          obj[key] = val;
        } else if (angular.isArray(obj[key])) {
          obj[key].push(val);
        } else {
          obj[key] = [obj[key], val];
        }
      }
    }
  });
  return obj;
}

function toKeyValue(obj) {
  var parts = [];
  angular.forEach(obj, function (value, key) {
    if (angular.isArray(value)) {
      angular.forEach(value, function (arrayValue) {
        parts.push(encodeUriQuery(key, true) +
                   (arrayValue === true ? '' : '=' + encodeUriQuery(arrayValue, true)));
      });
    } else {
      parts.push(encodeUriQuery(key, true) +
               (value === true ? '' : '=' + encodeUriQuery(value, true)));
    }
  });
  return parts.length ? parts.join('&') : '';
}


'use strict';

/**
 * Setup Raven if available.
 * Raven is responsible for logging to https://sentry.lizard.net
 */
if (window.RavenEnvironment) {
  window.Raven.config(window.RavenEnvironment,
  {
    // limits logging to staging and prd
    whitelistUrls: [/integration\.nxt\.lizard\.net/,
                    /nxt\.lizard\.net/,
                    /staging\.nxt\.lizard\.net/]
  }).install();
}

/**
 * Initialise angular.module('lizard-nxt')
 *
 */
angular.module("lizard-nxt", [
  'data-menu',
  'map',
  'omnibox',
  'restangular',
  'dashboard',
  'scenarios',
  'user-menu',
  'global-state',
  'ngSanitize',
  'ngCsv'
])
// Decorator for ngExceptionHandler to log exceptions to sentry
  .config(function ($provide) {
  $provide.decorator("$exceptionHandler", function ($delegate) {
      return function (exception, cause) {
          $delegate(exception, cause);
          window.Raven.captureException(exception, {
            extra: {cause: cause}
          });
        };
    });
});

/**
 * Change default angular tags to prevent collision with Django tags.
 */
angular.module('lizard-nxt')
  .config(function ($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
});

/**
 * Set url fragment behavior to HTML5 mode (without hash in url).
 */
angular.module('lizard-nxt')
  .config(function ($locationProvider) {
  // We want to release to gh-pages for demo purposes or whatever
  // But github.io doesn't rewrite the urls beautifully like we do.
  var html5Mode = (window.location.host !== 'nens.github.io');
  $locationProvider.html5Mode(html5Mode);
});

/**
 * @name user
 * @memberOf app
 * @description User and auth stuff
 */
angular.module('lizard-nxt')
  .constant('user', window.user);

/**
 * @name versioning
 * @memberOf app
 * @description User and auth stuff
 */
angular.module('lizard-nxt')
  .constant('versioning', window.versioning);


/**
 *
 * @name MasterController
 * @class MasterCtrl
 * @memberOf app
 *
 * @summary Master controller
 *
 * @description Binds logic and attributes to the global $scope. Keep
 *              this clean and put stuff in specific component controllers
 *              if it is not global.
 *
 */
angular.module('lizard-nxt')
  .controller('MasterCtrl',

  ['$scope',
   '$controller',
   'CabinetService',
   'UtilService',
   'ClickFeedbackService',
   'user',
   'versioning',
   'State',
   'MapService',

  function ($scope,
            $controller,
            CabinetService,
            UtilService,
            ClickFeedbackService,
            user,
            versioning,
            State,
            MapService) {

  $scope.user = user;
  $scope.versioning = versioning;
  $scope.tooltips = CabinetService.tooltips;

  // CONTEXT

  /**
   * Switch between contexts.
   *
   * @param {string} context - Context name to switch to
   */
  $scope.switchContext = function (context) {
    State.context = context;
  };

  /*
   * Set context on scope.
   */
  $scope.$watch(State.toString('context'), function (n, o) {
    if (n === o) { return true; }
    $scope.context = State.context;
  });

  // initialise context.
  $scope.context = State.context;

  // END CONTEXT

  // KEYPRESS

  // If escape is pressed close box
  // NOTE: This fires the watches too often
  $scope.keyPress = function ($event) {

    if ($event.target.nodeName === "INPUT" &&
      ($event.which !== 27 && $event.which !== 13
       && $event.which !== 32)) {
      return;
    }

    // pressed ESC
    if ($event.which === 27) {

      State.box.type = "point";
      State.spatial.here = undefined;
      State.spatial.points = [];
      ClickFeedbackService.emptyClickLayer(MapService);

      // This does NOT work, thnx to Angular scoping:
      // $scope.geoquery = "";
      //
      // ...circumventing-angular-weirdness teknique:
      document.querySelector("#searchboxinput").value = "";
    }
    // TODO: move
    // // play pause timeline with Space.
    // if ($event.which === 32) {
    //   $scope.timeState.playPauseAnimation();
    // }

  };

  $scope.toggleVersionVisibility = function () {
    $('.navbar-version').toggle();
  };

  UtilService.preventOldIEUsage();

  // catch window.load event
  window.addEventListener("load", function () {
    window.loaded = true;
    $scope.$apply(function () {
      $controller('UrlController', {$scope: $scope});
    });
  });


}]);

'use strict';

angular.module('lizard-nxt')
  .service("CabinetService", ["$q", "Restangular",
  function ($q, Restangular) {

  var termSearchResource,
      bboxSearchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups,
      timeseriesLocationObjectResource,
      timeseriesResource,
      flowResource,
      events;

  // for the wizard demo's
  if (window.location.host === 'nens.github.io') {
    Restangular.setBaseUrl('https://nxt.lizard.net/');
  }
  Restangular.setRequestSuffix('?page_size=0');
  geocodeResource = Restangular.one('api/v1/geocode/');
  reverseGeocodeResource = Restangular.one('api/v1/reversegeocode/');
  timeseriesResource = Restangular.one('api/v1/timeseries/');
  events = Restangular.one('api/v1/events/');

  /**
   * Raster resource, last stop to the server
   * @param  {promise} q             a promise to cancel previous requests
   *                                 if none is given a local 'abortGet' is used.
   *                                 At the next request without a promise, the
   *                                 abortGet is cancelled.
   * @return {RestangularResource}  a gettable resource
   */
  var abortGet;
  var rasterResource = function (q) {
    var localPromise = q ? q : abortGet;
    if (localPromise === abortGet) {
      if (abortGet) {
        abortGet.resolve();
      }
      abortGet = $q.defer();
      localPromise = abortGet;
    }
    return Restangular
      .one('api/v1/rasters/')
      .withHttpConfig({timeout: localPromise.promise});
  };

  var tooltips = {
    login: "Inloggen",
    logout: "Uitloggen",
    profile: "Profiel aanpassen",
    version: "Dubbelklik voor de Lizard versie",
    openMenu: "Datamenu openen",
    closeMenu: "Datamenu sluiten",
    transparency: "Transparantie aanpassen",
    pointTool: "Puntselectie",
    lineTool: "Lijnselectie",
    areaTool: "Scherm selectie",
    resetQuery: "Resultaatvenster sluiten",
    search: "Zoeken",
    zoomInMap: "Zoom in op de kaart",
    zoomOutMap: "Zoom uit op de kaart",
    zoomInTimeline: "Zoom in op de tijdlijn",
    goToNow: "Ga naar het heden op de tijdlijn",
    zoomOutTimeline: "Zoom uit op de tijdlijn",
    startAnim: "Start de animatie",
    stopAnim: "Stop de animatie",
    timelineStart: "Het begin van de huidige tijdlijn",
    timelineAt:"Het 'nu' op de tijdlijn",
    timelineEnd: "Het einde van de huidige tijdlijn"
  };

  return {
    //eventTypes: eventTypes,
    events: events,
    tooltips: tooltips,
    geocode: geocodeResource,
    raster: rasterResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    panZoom: null,
  };
}]);

/**
 * @ngdoc service
 * @class UtilService
 * @name UtilService
 * @summary Generic util functions.
 * @description Generic util functions.
 */
angular.module('lizard-nxt')
  .service("UtilService", ["NxtD3", function (NxtD3) {

  /**
   * @function roundTimestamp
   * @memberOf UtilService
   * @summary Round javascript timestamp to nearest coefficient.
   *
   * @description For example, if you want to round timestamp to the nearest 5
   * minutes, coefficient = 1000 * 60 * 5 = 30000.
   *
   * @param {integer} timestamp - javascript timestamp in ms.
   * @param {integer} coefficient - coefficient to round to in ms.
   * @param {boolean} up - true if you want to round instead of floor.
   * offset.
   * @returns {integer} roundedTimestamp - timestamp rounded to nearest
   * coefficient.
   */
  this.roundTimestamp = function (timestamp, coefficient, up) {
    var format;

    if (up) {
      timestamp += coefficient / 2;
    }
    if (coefficient === 2635200000) { // One month
      format = NxtD3.prototype._localeFormatter.nl_NL.timeFormat("%m/01/%Y");
      return new Date(format(new Date(timestamp))).getTime();
    } else if (coefficient === 86400000) { // One day
      format = NxtD3.prototype._localeFormatter.nl_NL.timeFormat("%m/%d/%Y");
      return new Date(format(new Date(timestamp))).getTime();
    }
    var roundedTimestamp = parseInt(timestamp / coefficient, 10) * coefficient;

    return roundedTimestamp;
  };


  /**
   * @function fixTouch
   * @memberOf UtilService
   * @summary sets x and y for touch event.
   * @description webkit has a bug with touches.
   * this fixes the x and y coordinates of the touch.
   */
  this.fixTouch = function (touch) {
    var winPageX = window.pageXOffset,
        winPageY = window.pageYOffset,
        x = touch.clientX,
        y = touch.clientY;

    if (touch.pageY === 0 && Math.floor(y) > Math.floor(touch.pageY) ||
        touch.pageX === 0 && Math.floor(x) > Math.floor(touch.pageX)) {
      // iOS4 clientX/clientY have the value that should have been
      // in pageX/pageY. While pageX/page/ have the value 0
      x = x - winPageX;
      y = y - winPageY;
    } else if (y < (touch.pageY - winPageY) || x < (touch.pageX - winPageX)) {
      // Some Android browsers have totally bogus values for clientX/Y
      // when scrolling/zooming a page. Detectable since clientX/clientY
      // should never be smaller than pageX/pageY minus page scroll
      x = touch.pageX - winPageX;
      y = touch.pageY - winPageY;
    }

    return {
        clientX:    x,
        clientY:    y
      };
  };


  /**
   * @function getAggWindow
   * @memberOf UtilService
   *
   * @summary return aggregation window.
   *
   * @desc Returns aggWindow. Either five minutes, an hour or a day, should
   * lead to a minimum of three pixels within the drawing width.
   *
   * @param  {int} start    start of rainseries.
   * @param  {int} stop     end of rainseries.
   * @param  {int} drawingWidth size of graph in px.
   * @return {int} aggWindow in ms.
   */
  this.getAggWindow = function (start, stop, drawingWidth) {

    // TODO: Called both by omnibox and timeline, should be called only by
    // timeline, while omnibox subsequently syncs to timeState.aggWindow

    var aggWindow;
    var MIN_PX = 4; // Minimum width of a bar
    // Available zoomlevels
    var zoomLvls = {fiveMinutes: 300000,
                    hour: 3600000,
                    day: 86400000,
                    month: 2635200000}; // Month equals 30.5 days
    // ms per pixel
    var msPerPx = (stop - start) / drawingWidth;
    for (var zoomLvl in zoomLvls) {
      aggWindow = zoomLvls[zoomLvl];
      if (aggWindow > MIN_PX * msPerPx) {
        break; // If zoomlevel is sufficient to get enough width in the bars
      }
    }

    return aggWindow;
  };


  /**
   * @function fadeCurrentCards
   * @memberOf UtilService
   *
   * @summary Fade out (in) currently (in-)visible cards.
   *
   * @param {boolean} fadeIn - An Angular scope s.t.
   * scope.mapState.mapMoving is defined.
   */
  this.fadeCurrentCards = function (scope) {

    var cards = d3.selectAll(".card");

    if (!scope.mapState.mapMoving) {
      // card comes back instantaniously
      cards
        .style("opacity", 1);
    } else {
      // card fades away into transparancy, after a delay, but only if
      // the map is still moving after that delay
      setTimeout(function () {
        if (scope.mapState.mapMoving) {
          cards
            .transition(100)
            .style("opacity", 0.2);
        } else {
          cards
            .style("opacity", 1);
        }
      }, 700);
    }
  };

  /**
   * @function metersToDegs
   * @memberOf UtilService
   *
   * @summary Takes meters converts to radians, then converts degrees.
   *
   * @param  {float} meters
   * @return {float} degrees
   */
  this.metersToDegs = function (meters) {
    return (meters / 1000 / 6371) * 180 / Math.PI;
  };


  /**
   * @function createDataForTimeState
   * @memberOf UtilService
   *
   * @summary Creates a subset data object for a specific timeState.
   *
   * @param  {array} data      array of shape:
   *                           [
   *                             [x0, [y0_1, y0_2, ..., y0_n]],
   *                             [x1, [y1_1, y1_2, ..., y1_n]],
   *                             ...
   *                             [xm, [ym_1, ym_2, ..., ym_n]]
   *                           ]
   * @param  {object} timeState nxt timeState object
   * @return {array}           array (for timestep 1) of shape:
   *                           [[x0, y0_1], [x1, y1_1], ...]
   */
  this.createDataForTimeState = function (data, timeState) {
    var interval = timeState.end - timeState.start;
    var cur = timeState.at - timeState.start;
    var i = Math.round(data[0][1].length * cur / interval);
    var dataForTimeState = [];
    angular.forEach(data, function (value) {
      dataForTimeState.push([value[0], value[1][i]]);
    });
    return dataForTimeState;
  };


  /**
   * @function serveToOldIE
   * @memberOf UtilService
   * @description Check whether the client uses IE10+/non-IE browser
   *   (return false) OR that she uses an older IE version (return true)
   */
  this.serveToOldIE = function () {

    function getInternetExplorerVersion() {
      // Returns the version of Internet Explorer or -1
      // (indicating the use of another browser).

      var rv = -1, // Return value assumes failure.
          ua = navigator.userAgent,
          re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");

      if (re.exec(ua) !== null) {
        rv = parseFloat(RegExp.$1);
      }
      return rv;
    }
    var version = getInternetExplorerVersion();
    return version !== -1 && version < 10;
  };


  var checkForLine = function (geom) {
    if (geom.length > 1) {
      angular.forEach(geom, function (value) {
        if (!(value instanceof L.LatLng)) {
          return false;
        }
      });
      return true;
    }
  };


  /**
   * @function geomToWkt
   * @memberOf UtilService
   */
  this.geomToWkt = function (geom) {
    if (geom instanceof L.LatLng) {
      // geom is a L.LatLng object
      return "POINT(" + geom.lng + " " + geom.lat + ")";
    } else if (checkForLine(geom)) {
      // geom represents a line
      var coords = [];
      angular.forEach(geom, function (latLng) {
        coords.push(latLng.lng + " " + latLng.lat);
      });
      return "LINESTRING(" + coords.join(',') + ")";
    } else {
      // geom is a L.Bounds object
      return "POLYGON(("
            + geom.getWest() + " " + geom.getSouth() + ", "
            + geom.getEast() + " " + geom.getSouth() + ", "
            + geom.getEast() + " " + geom.getNorth() + ", "
            + geom.getWest() + " " + geom.getNorth() + ", "
            + geom.getWest() + " " + geom.getSouth()
            + "))";
    }
  };


  /**
   * @function buildString
   * @memberof UtilService
   * @description Glues all of it's arguments to a single string
   */
  this.buildString = function () {
    var i, result = "";
    for (i = 0; i < arguments.length; i++) {
      result += arguments[i];
    }
    return result;
  };


  /**
   * @function all
   * @memberof UtilService
   * @description - Checks whether ALL elements of the input satisfy the predicate
   * @param {arr} - An enumerable/iterable datastructure, e.g. Array
   * @param {predicate_} - A predicate, e.g. 'even': function (x) { x % 2 === 0 };
   * @return {boolean}
   */
  this.all = function (arr, predicate_) {
    var i,
        result = true,
        predicate = predicate_ || function (x) { return !!x; };
    for (i = 0; i < arr.length; i++) {
      result = result && predicate(arr[i]);
    }
    return result;
  };


  /**
   * @function any
   * @memberof UtilService
   * @description - Checks whether ANY element of the input satisfies the
   *   predicate
   * @param {arr} - An enumerable/iterable datastructure, e.g. Array
   * @param {predicate_} - A predicate, e.g. 'even':
   *   function (x) { x % 2 === 0 };
   * @return {boolean}
   */
  this.any = function (arr, predicate_) {
    var i,
        result = false,
        predicate = predicate_ || function (x) { return !!x; };
    for (i = 0; i < arr.length; i++) {
      result = result || predicate(arr[i]);
    }
    return result;
  };


  /**
   * @function
   * @memberOf UtilService
   * @description - Checks whether API response from the raster store has enough
   *                (non-null) data to actually put it on the scope.
   * @param {Object[]} response - An API response
   * @return {boolean}
   */
  this.isSufficientlyRichData = function (data) {

    if (data === undefined) {
      return false;

    } else if (data === 'null') {
      // backend did not return valid data.. log as ERROR?
      return false;

    } else if (this.nullOrNestedNull(data)) {
      // kill: null AND [null] AND [[null]] etc
      return false;

    } else if (data.constructor === Array) {

      if (data.length === 0) {
        // kill: []
        return false;

      } else if (this.all(data, function (x) { return x === null; })) {

        // kill: [null, null, ..., null]
        return false;

      } else if (data[0].constructor === Array) {

        if (data[0] === []) {
          return false;

        } else if (data[0].length === 1 && data[0][0] !== null) {
          return true;

        } else if (data[0].length > 1) {

          if (data[0][0].constructor === Array) {

            // kill: [[x0, [null]], [x1, [null]], ..., [xn, [null]]]
            return !this.all(data, function (elem) {
              return elem[1].length === 1 && elem[1][0] === null;
            });

          } else {

            // kill: [[x0, null], [x1, null], ..., [xn, null]]
            return !this.all(data, function (elem) {
              return elem[1] === null;
            });
          }
        }
      }
    }
    return true;
  };


  /**
   * @function
   * @memberOf UtilService
   * @description - checks whether passed in argument is null or nested null,
                    e.g: null, [null], [[null]] etc
   * @param {anything}
   * @return {boolean}
   */
  this.nullOrNestedNull = function (x) {

    if (x === null) {
      return true;

    } else if (x.constructor === Array && x.length === 1) {
      return this.nullOrNestedNull(x[0]);

    } else {
      return false;
    }
  };


  this.preventOldIEUsage = function () {
    if (this.serveToOldIE()) {
      document.querySelector("#dark-overlay").style.display = "block";
      document.querySelector("#mymodal").style.display = "block";
      // explicitly HIDE the layerMenu
      document.querySelector(".layer-switcher-wrapper").style.display = "none";
      // explicitly setZindex of a few items. This should NOT be in main.css
      // breaks functionality:
      var node = document.createElement('style');
      node.innerHTML = '#timeline, #searchbox, .container-fluid,'
        + '.navbar, #omnibox, .layer-menu-container,'
        + '.ribbon {'
        + ' z-index: 0;'
        + '}';
      document.body.appendChild(node);
    }
  };


  /**
   * @description - Deduce the wanted geometry-type from the passed in geomOpts
   * @param {object} geomOpts - the options.geom object
   * @return {string} - "POINT" | "LINE" | "AREA" | throw new Error!
   *
   * NB! In the foreseeable future, we need to take care of non-rectangle
   *     polygons, and we'll need to adjust this code accordingly.
   *     When will then be now? soon.
   */
  this.getGeomType = function (geomOpts) {

    if (geomOpts instanceof L.LatLng) {
      return "POINT";

    } else if (geomOpts._southWest && geomOpts._northEast) {
      return "AREA";

    } else if (geomOpts.length === 2
      && geomOpts[0] instanceof L.LatLng
      && geomOpts[1] instanceof L.LatLng) {
      return "LINE";

    } else {
      throw new Error(
        "getGeomType could not deduce a valid geometry type from the passed in arg: 'geomOpts' =", geomOpts
      );
    }
  };


  /**
   * @function
   * @description - Count all keys for an object (we can't do this vanilla.js style in Angular template)
   * @param {object} obj - The object for which we want to know the amount of keys.
   * @return {integer} - The amount of keys.
   */
  this.countKeys = function (obj) {
    return obj === undefined ? 0 : Object.keys(obj).length;
  };


  /**
   * @function
   * @description Get correct icon for structure
   */
  this.getIconClass = function (str) {
    switch (str) {
    case 'pumpstation':
      return 'icon-pumpstation-diesel';
    case 'bridge':
      return 'icon-bridge';
    case 'bridge-draw':
      return 'icon-bridge';
    case 'bridge-fixed':
      return 'icon-bridge';
    default:
      return 'icon-' + str;
    }
  };


  /* @description - Convert lin to log scale, given the following 3 args.
   * @param {number} value - the value to convert
   * @param {number} minValue - the start of the scale
   * @param {number} maxValue - the end of the scale
   * @return {number} - The converted value
   */
  this.lin2log = function (value, minValue, maxValue) {
    var scale = d3.scale.log()
      .domain([minValue, maxValue])
      .range([minValue, maxValue]);
    return scale(value);
  };


  /**
   * @description - This add a <style> tag + it's contents to the <head> of the
   *                page. Adding more will iteratively subsitute the most recent
   *                addition.
   * @param {string} newStyle - A string representing the to-be-added CSS
   * @return {void}
   */
  this.addNewStyle = function (newStyle) {
    var styleElement = document.getElementById('styles_js');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.id = 'styles_js';
      document.getElementsByTagName('head')[0].appendChild(styleElement);
    }
    styleElement.innerHTML = "";
    styleElement.appendChild(document.createTextNode(newStyle));
  };


  /*
   * @description - Convert string ending in px to value expressed in pixels,
   *                it denotes.
   * @param {string} str - The string to be converted.
   */
  this.pxToInt = function (str) {
    try {
      return parseInt(str.replace("px", ""));
    } catch (e) {
      throw new Error("Could not extract integer from string: '" + str + "'");
    }
  };


  /**
   * @function
   * @description - Get amount of Km^2 in the current spatial extent
   *                (bottom-limit = 1)
   * @param {latLngBounds} leafletBounds - A leaflet bounds object denoting the
   *                                       current spatial extent.
   * @return {number} - A number denoting the extent's corresponding perimeter
   *                   (expressed in Km^2)
   */
  this.extent2kilometers = function (leafletBounds) {

    var northWest = L.latLng({
          lat: leafletBounds._southWest.lat,
          lng: leafletBounds._northEast.lng
        }),
        southEast = L.latLng({
          lat: leafletBounds._northEast.lat,
          lng: leafletBounds._southWest.lng
        }),
        latDistance = leafletBounds._southWest.distanceTo(southEast) / 1000,
        lngDistance = leafletBounds._northEast.distanceTo(northWest) / 1000;

    // On high zoomlevels, we limit the area to 1km^2 since that's the
    // spatial resolution ("pixel") for radar data in the rasterstore.
    return Math.max(1, latDistance * lngDistance);
  };

  /*
   * @function
   * @description wrapper around lodash.union function
   * which works better than our own implementation..
   * Could be more efficient to call from api in a batch
   * instead of tiled/geojson stuff.
   */
  this.union = _.union;

  /*
   * @function
   * @description - return the average rain per square kilometer, given:
   * @param {obj[]} data - the raw data
   * @param {obj} bounds- leaflet bounds object, the current spatial extent
   * @param {obj} timeState - the app's timeState
   * @return {number || undefined}
   */
  this.getFilteredRainDataPerKM = function (data, bounds, timeState) {

    if (!data) { return; }

    var i,
        currentTimestamp,
        currentVal,
        aggWindowStart = timeState.at,
        aggWindowEnd = aggWindowStart + timeState.aggWindow,
        squareKilometers = this.extent2kilometers(bounds),
        DECIMAL_RESOLUTION = 100;

    for (i = 0; i < data.length; i++) {
      currentTimestamp = data[i][0];
      currentVal = data[i][1];
      if (currentTimestamp > aggWindowStart && currentTimestamp <= aggWindowEnd) {
        return  Math.round(
                  (currentVal / squareKilometers) * DECIMAL_RESOLUTION
                ) / DECIMAL_RESOLUTION || "0.00";
      }
    }
  };

  // Add comparator to sort lists on multiple properties to D3.
  (function () {
    d3.comparator = function () {
      var cmps = [], accessors = [];

      var comparator = function (a, b) {
        var i = -1,
            n = cmps.length,
            result;
        while (++i < n) {
          result = cmps[i](accessors[i](a), accessors[i](b));
          if (result !== 0) return result;
        }
        return 0;
      };

      comparator.order = function (cmp, accessor) {
        cmps.push(cmp);
        accessors.push(accessor || identity);
        return comparator;
      };

      return comparator;
    };

    function identity(d) { return d; }
  })();

  this.MIN_TIME = (new Date("Jan 01, 1970")).getTime();
  this.MAX_TIME = (new Date()).getTime() + 3 * 60 * 60 * 1000;
  this.TIMELINE_LEFT_MARGIN = 60;
  this.TIMELINE_RIGHT_MARGIN = 40;

  this.getMinTime = function (currentTime) {
    return Math.max(this.MIN_TIME, currentTime);
  };

  this.getMaxTime = function (currentTime) {
    return Math.min(this.MAX_TIME, currentTime);
  };

  this.getCurrentWidth = function () {
    return window.innerWidth - (
      this.TIMELINE_LEFT_MARGIN + this.TIMELINE_RIGHT_MARGIN
    );
  };

  this.hexColorToDecimalTriple = function (rgbString) {

    var rInt, gInt, bInt;

    if (rgbString.charAt(0) === "#")
      rgbString = rgbString.substring(1, rgbString.length);

    if (rgbString.length === 3) {
      rInt = parseInt(rgbString.charAt(0) + rgbString.charAt(0), 16);
      gInt = parseInt(rgbString.charAt(1) + rgbString.charAt(1), 16);
      bInt = parseInt(rgbString.charAt(2) + rgbString.charAt(2), 16);

    } else if (rgbString.length === 6) {
      rInt = parseInt(rgbString.substring(0, 2), 16);
      gInt = parseInt(rgbString.substring(2, 4), 16);
      bInt = parseInt(rgbString.substring(4, 6), 16);

    } else {
      throw new Error("This is not a valid color-string: '" + rgbString + "'");
    }

    return [rInt, gInt, bInt];
  };

  this.decimalTripleToHexColor = function (rgbTriple) {

    if (rgbTriple && rgbTriple.length === 3) {
      var rgbString = "#",
          currentHexString;
      rgbTriple.forEach(function (elem) {
        currentHexString = elem.toString(16);
        if (currentHexString.length === 1) {
          currentHexString = "0" + currentHexString;
        }
        rgbString += currentHexString;
      });
      return rgbString;

    } else {
      throw new Error("This aint a valid triple to convert into rgbString: " + rgbTriple);
    }
  };
}]);

/**
 * Service to handle utf grid requests.
 */
angular.module('lizard-nxt')
  .service('UtfGridService', ['$q', '$rootScope', 'UtilService',

  function ($q, $rootScope, UtilService) {

    var getData = function (nonLeafLayer, options) {

      var leafLayer = nonLeafLayer && nonLeafLayer._leafletLayer,
          geomType = UtilService.getGeomType(options.geom),
          deferred = $q.defer(),
          e = { latlng: options.geom },
          response;

      if (options.geom === undefined || geomType === "LINE") {
        deferred.reject();
        return deferred.promise;
      }

      response = _getResponseForGeomType(leafLayer, geomType, e, options.geom);
      if (!window.loaded
        || leafLayer.isLoading
        || !leafLayer._map
        || !leafLayer._map.hasLayer(leafLayer)
      ) {
        _getDataFromUTFAsynchronous(nonLeafLayer, e, deferred, geomType, options.geom);
      } else {
        deferred.resolve(response.data);
      }

      return deferred.promise;
    };

    var _getDataFromUTFAsynchronous = function (nonLeafLayer, e, deferred, geomType, geomOpts) {
      var response, leafLayer = nonLeafLayer._leafletLayer;
      leafLayer.on('load', function () {
        response = _getResponseForGeomType(leafLayer, geomType, e, geomOpts);
        if ($rootScope.$$phase) {
          deferred.resolve(response.data);
        } else {
          $rootScope.$apply(function () {
            deferred.resolve(response.data);
          });
        }
      });
    };

    var _getResponseForGeomType = function (leafLayer, geomType, e, geomOpts) {
      switch (geomType) {
      case 'POINT':
        return leafLayer._objectForEvent(e);
      case "LINE":
        return undefined;
      case "AREA":
        return _groupStructuresByEntityName(
          leafLayer.getUniqueStructuresForExtent(),
          geomOpts
        );
      default:
        throw new Error(
          "UtfGridService._getResponseForGeomType called with invalid arg 'geomType', which happened to be:",
          geomType
        );
      }
    };

    var _isWithinExtent = function (structureGeom, leafletBounds) {

      switch (structureGeom.type) {
        case "Point":
          return leafletBounds.contains(L.latLng(
            structureGeom.coordinates[1],
            structureGeom.coordinates[0]
          ));

        case "LineString":

          // For now (15-01-2015), don't take into account structures with a geom
          // type other than POINT. Since this will probably be reverted some time
          // in the foreseeable future, we simply comment the relevant code and
          // return false.

          // var lineStart = L.latLng(
          //       structureGeom.coordinates[0][1],
          //       structureGeom.coordinates[0][0]
          //     ),
          //     lineEnd = L.latLng(
          //       structureGeom.coordinates[1][1],
          //       structureGeom.coordinates[1][0]
          //     );

          // TODO: Fix detection of lines that overlap the extent, but that do
          // not start nor end within the extent. It negligable for now.
          //return leafletBounds.contains(lineStart) || leafletBounds.contains(lineEnd);

          return false;

        default:
          throw new Error("Did not find valid geom type:", structureGeom.type);
      }
    };

    var _groupStructuresByEntityName = function (structures, geomOpts) {

      var uniqueId,
          currentEntityName,
          structure,
          structureGeom,
          leafletBounds = L.latLngBounds(geomOpts._southWest, geomOpts._northEast),
          groupedStructures = { data: {} };

      for (uniqueId in structures.data) {

        structure = structures.data[uniqueId];
        structureGeom = JSON.parse(structure.geom);

        if (!_isWithinExtent(structureGeom, leafletBounds)) {
          continue;
        }

        currentEntityName = structure.entity_name;
        groupedStructures.data[currentEntityName]
          = groupedStructures.data[currentEntityName] || {};
        groupedStructures.data[currentEntityName][uniqueId] = structure;
      }
      return groupedStructures;
    };

    return { getData: getData };
  }
]);

/**
 * Service to handle raster requests.
 */
angular.module('lizard-nxt')
  .service("RasterService", ["Restangular",
                             "UtilService",
                             "CabinetService",
                             "$q",
  function (Restangular, UtilService, CabinetService, $q) {

  var intensityData,
      cancelers = {};

  var getData = function (layer, options) {

    // TODO: get this from somewhere
    var GRAPH_WIDTH = UtilService.getCurrentWidth();

    var srs = 'EPSG:4326',
        agg = options.agg || '',
        wkt = UtilService.geomToWkt(options.geom),
        startString,
        endString,
        aggWindow;

    if (options.start && options.end) {
      startString = new Date(options.start).toISOString().split('.')[0];
      endString = new Date(options.end).toISOString().split('.')[0];
    }

    aggWindow = options.aggWindow || UtilService.getAggWindow(options.start,
      options.end, GRAPH_WIDTH);

    var canceler;
    // getData can have own deferrer to prevent conflicts
    if (options.deferrer) {
      var deferSlug = options.deferrer.origin;
      canceler = options.deferrer.deferred;
      if (cancelers[options.deferrer.origin]) {
        cancelers[options.deferrer.origin].resolve();
      }
      cancelers[options.deferrer.origin] = canceler;
    }
    // if it doesn't have a deferrer in the options
    // use the layer slug..
      else {
      if (cancelers[layer.slug]) {
        cancelers[layer.slug].resolve();
      }

      canceler = cancelers[layer.slug] = $q.defer();
    }

    return CabinetService.raster(canceler).get({
      raster_names: layer.slug,
      geom: wkt,
      srs: srs,
      start: startString,
      stop: endString,
      agg: agg,
      styles: options.styles,
      window: aggWindow
    });
  };

  /**
   * Build the bounding box given an imageBounds
   */
  var _buildBbox = function (imgBounds) {
    return [imgBounds[0][1], imgBounds[1][0]].toString() +
      ',' + [imgBounds[1][1], imgBounds[0][0]].toString();
  };

  var buildURLforWMS = function (wmsLayer, store) {
    var layerName = store || wmsLayer.slug;

    var imgBounds = [
      [wmsLayer.bounds.north, wmsLayer.bounds.west],
      [wmsLayer.bounds.south, wmsLayer.bounds.east]
    ],
    opts = wmsLayer.options,
    result = wmsLayer.url
      + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&FORMAT=image%2Fpng'
      + '&SRS=EPSG%3A4326&LAYERS=' + layerName
      + '&BBOX=' + _buildBbox(imgBounds);


    angular.forEach(opts, function (v, k) {
      result += UtilService.buildString('&', k.toUpperCase(), "=", v);
    });

    // key TIME needs to come last, so we can subsequently append it's value
    // for every frame in the animation:
    result += '&TIME=';

    return result;
  };

  var handleElevationCurve = function (data) {
    var datarow,
        i,
        formatted = [];

    for (i in data[0]) {
      datarow = [data[0][i], data[1][i]];
      formatted.push(datarow);
    }
    return formatted;
  };

  var getMinTimeBetweenFrames = function (layerGroup) {

    if (layerGroup.slug === 'rain') {
      return 100;
    } else {
      return 1000;
    }

  };

  return {
    getMinTimeBetweenFrames: getMinTimeBetweenFrames,
    buildURLforWMS: buildURLforWMS,
    getData: getData,
    handleElevationCurve: handleElevationCurve
  };

}]);

'use strict';

/**
 * @ngdoc service
 * @class VectorService
 * @memberof app
 * @name VectorService
 * @summary Receives and returns vector data, as a service (or VDaaS).
 * @description VectorService is responsible for retreiving, storing
 * and exposing vector typed data.
 *
 */

angular.module('lizard-nxt')
  .service('VectorService', ['$q',
                             '$rootScope',
                             'LeafletService',
                             'UtilService',
                             'CabinetService',
  function ($q, $rootScope, LeafletService, UtilService, CabinetService) {

    /**
     * @function
     * @description filters geojson array on spatial bounds.
     * @param  {L.LatLngBounds} spatial
     * @param  {featureArray}   sourceArray
     * @return {filteredSet}    filtered set of features.
     */
    var filterSpatial = function (sourceArray, spatial) {
      var filteredSet = [];
      var query = spatial instanceof LeafletService.LatLngBounds ? 'contains' : 'equals';
      sourceArray.forEach(function (feature) {
        var withinBounds;
        // if (feature.geometry.type === "Polygon") {
        //   var maxLat = feature.geometry.coordinates[0][0][0],
        //       minLat = feature.geometry.coordinates[0][0][0],
        //       minLon = feature.geometry.coordinates[0][0][1],
        //       maxLon = feature.geometry.coordinates[0][0][1];
        //   window.feature = feature
        //   feature.geometry.coordinates[0].forEach(function (coordinates) {
        //     maxLon = Math.max(coordinates[1], maxLon);
        //     maxLat = Math.max(coordinates[0], maxLat);
        //     minLon = Math.min(coordinates[1], minLon);
        //     minLat = Math.min(coordinates[0], minLat);
        //   });
        //   // if as much as one point is visible in extent draw it.
        //   withinBounds = (
        //     spatial.contains(new LeafletService.LatLng(maxLat, maxLon)) ||
        //     spatial.contains(new LeafletService.LatLng(maxLat, minLon)) ||
        //     spatial.contains(new LeafletService.LatLng(minLat, maxLon)) ||
        //     spatial.contains(new LeafletService.LatLng(minLat, minLon))
        //     )
        // } else if (feature.geometry.type === "MultiPolygon") {
        //   // fuckall
        // } else
        if (feature.geometry.type === "Point") {
          var latLng = new LeafletService.LatLng(
            feature.geometry.coordinates[1],
            feature.geometry.coordinates[0]
            );
          withinBounds = spatial[query](latLng);
        }

        if (withinBounds) {
          filteredSet.push(feature);
        }
      });
      return filteredSet;
    };

    /**
     * @description - Checks whether a single feature must be drawn given
     *                a certain timeState.
     */
    var isInTempExtent = function (feature, temporal) {
      var eventStartBeforeTLStart = false,
          eventStartAfterTLStart = false,
          eventEndBeforeTLStart = false,
          eventEndAfterTLStart = false,
          eventEndBeforeTLEnd = false;

      if (feature.properties) { feature = feature.properties; }

      if (temporal.start) {
        eventStartBeforeTLStart
          = feature.timestamp_start < temporal.start;
        eventStartAfterTLStart
          = !eventStartBeforeTLStart;
        eventEndBeforeTLStart
          = feature.timestamp_end < temporal.start;
        eventEndAfterTLStart
          = !eventEndBeforeTLStart;
      }

      if (temporal.end) {
        eventEndBeforeTLEnd
          = feature.timestamp_end < temporal.end;
      }

      var result;
      if (eventStartBeforeTLStart
          && eventEndAfterTLStart) { result = true; }
      else if (
                (temporal.start === undefined || eventStartAfterTLStart)
                && (temporal.end === undefined || eventEndBeforeTLEnd)
              )
              { result = true; }
      else {
        result = false;
      }

      return result;
    };

    /**
     * @function
     * @description filters geojson array on temporal bounds.
     * @param  {object}      start end object
     * @param  {feature[]}   sourceArray
     * @return {filteredSet} filtered set of features.
     */
    var filterTemporal = function (sourceArray, temporal) {
      return sourceArray.filter(function (feature) {
        return isInTempExtent(feature, temporal);
      });
    };

    /**
     * @description filters data on time and spatial extent
     * @param  {L.LatLngBounds} spatial  Leaflet Bounds object
     * @param  {object}         temporal object with start and end in epoch
     *                          timestamp
     * @return {filteredSet}    Array with points within extent.
     */
    var filterSet = function (sourceArray, spatial, temporal) {
      if (!spatial && !temporal) { return sourceArray; }

      var filteredSet = [];

      // First filter spatially.
      if (spatial instanceof LeafletService.LatLngBounds
        || spatial instanceof LeafletService.LatLng) {
        filteredSet = filterSpatial(sourceArray, spatial);
      } else if (spatial === undefined) {
        filteredSet = sourceArray;
      } else if (spatial instanceof Array
        && spatial[0] instanceof LeafletService.LatLng) {
        // TODO: implement line intersect with vector data
        filteredSet = [];
      } else {
        throw new Error(
          spatial + "is an invalid geometry to query VectorService");
      }

      // Further refine spatially filtered by temporal filter.
      if (temporal.hasOwnProperty('start') || temporal.hasOwnProperty('end')) {
        filteredSet = filterTemporal(filteredSet, temporal);
      } else if (temporal === undefined) {
        return filteredSet;
      } else {
        throw new Error(temporal + "is an invalid time to query VectorService");
      }

      return filteredSet;
    };

    var vectorLayers = {};

    /**
     * @memberof app.VectorService
     * @function
     * @description gets data from backend
     * @param  {layer} layer as defined by layer-service
     * @param  {object} geomortime  geometry or time that it needs to get
     *                  (e.g. bboxs)
     * @param  {object} time  start, stop object
     * @return {promise}
     */
    var getData = function (nonLeafLayer, options) {
      var deferred = $q.defer(),
          layerSlug, layer;

      // leaflet knows nothing, so sends slug and leaflayer
      if (typeof nonLeafLayer === 'string') {
        layerSlug = nonLeafLayer;
      } else {
        layerSlug = nonLeafLayer.slug;
      }

      if (!vectorLayers[layerSlug] || vectorLayers[layerSlug].isLoading) {
        getDataAsync(layerSlug, layer, options, deferred);
      } else {
        var set = filterSet(vectorLayers[layerSlug].data,
        options.geom, {
          start: options.start,
          end: options.end
        });

        deferred.resolve(set);
      }

      return deferred.promise;
    };

    /**
     * @description Triggers resolve callback on loaded data.
     * @param {layer}
     * @param {options}
     * @param {promise}
     */
    var getDataAsync = function (layerSlug, layer, options, deferred) {
      if (!vectorLayers[layerSlug]) {

        vectorLayers[layerSlug] = {
          data: [],
          isLoading: true,
          promise: {}
        };

        vectorLayers[layerSlug].promise = CabinetService.events
        .get({'event_series__layer__slug': layerSlug}).then(function (response) {
          vectorLayers[layerSlug].isLoading = false;
          setData(layerSlug, response.features, 1);
        });

      }

      vectorLayers[layerSlug].promise.then(function () {
        deferred.resolve(filterSet(vectorLayers[layerSlug].data,
          options.geom, {
            start: options.start,
            end: options.end
          }
        ));
      });

    };

    /**
     * @description redefines data if zoom level changed
     */
    var replaceData = function (layerSlug, data, zoom) {
      vectorLayers[layerSlug] = {
          data: [],
          zoom: zoom
        };
      vectorLayers[layerSlug].data = vectorLayers[layerSlug].data.concat(data);
    };

    /**
     * @description gets unique values and tosses duplicates
     * part of PostGis.js (ಠ_ಠ)
     */
    var getUnion = function (arr1, arr2) {
      return UtilService.union(arr1, arr2);
    };

    /**
     * @description appends data if zoom level hasn't changed
     *
     */
    var setData = function (layerSlug, data, zoom) {
      if (vectorLayers.hasOwnProperty(layerSlug)
        && vectorLayers[layerSlug].zoom === zoom) {
        vectorLayers[layerSlug].data = getUnion(
          vectorLayers[layerSlug].data, data);
      } else {
        replaceData.apply(this, arguments);
      }
    };

    return {
      getData: getData,
      setData: setData,
      isInTempExtent: isInTempExtent
    };
  }
]);

/**
 * @name NxtD3
 * @class angular.module('lizard-nxt')
  .NxtD3
 * @memberOf app
 *
 * @summary Service to create and update common d3 elements.
 *
 * @description Inject "NxtD3Service" and either extend this service
 * by calling: Child.prototype = Object.create(NxtD3Service.prototype) as
 * in the higher level graph and timeline services or use these methods
 * directly by calling NxtD3Service.<method>(<args>).
 */
angular.module('lizard-nxt')
  .factory("NxtD3", [function () {

  var createCanvas, createElementForAxis, resizeCanvas;

  /**
   * @constructor
   * @memberOf angular.module('lizard-nxt')
  .NxtD3
   *
   * @param {object} element    svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   * @param {int} xDomainStart  unix-time; start of wanted domain
   * @param {int} xDomainEnd    unix-time; end of wanted domain
   */
  function NxtD3(element, dimensions, xDomainStart, xDomainEnd) {
    this.dimensions = angular.copy(dimensions);
    this._xDomainStart = xDomainStart;
    this._xDomainEnd = xDomainEnd;
    this._svg = createCanvas(element, this.dimensions);
  }

  NxtD3.prototype = {

    constructor: NxtD3,

    /**
     * @attribute
     * @memberOf angular.module('lizard-nxt')
     * @description        The duration of transitions in ms. Use(d)
     *                     throughout the graphs and timeline.
     */
    transTime: 120,

    /**
     * @attribute
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     * @description        Locales. Used in the axes. Currently only Dutch
     *                     is supported (and d3's default english/US en_US).
     */
    _localeFormatter: {
      'nl_NL': d3.locale({
        "decimal": ",",
        "thousands": ".",
        "grouping": [3],
        "currency": ["€", ""],
        "dateTime": "%a %b %e %X %Y",
        "date": "%d-%m-%Y",
        "time": "%H:%M:%S",
        "periods": ["AM", "PM"],
        "days": ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"],
        "shortDays": ["zo", "ma", "di", "wo", "do", "vr", "za"],
        "months": ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
        "shortMonths": ["jan", "feb", "mar", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"]
      })
    },


    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @description Creates or modifies a clippath and features-group
     *              to the svg. Feature-group is to draw the features
     *              in, clippath is to prevent drawing outside this
     *              area.
     * @return {object} svg with clip-area and feature-group
     */
    _createDrawingArea: function () {
      var width = NxtD3.prototype._getWidth(this.dimensions),
      height = NxtD3.prototype._getHeight(this.dimensions);
      // Add clippath to limit the drawing area to inside the graph
      // See: http://bost.ocks.org/mike/path/
      //
      // NOTE: we append the height to the clippath to prevent assocating a
      // clippath with the wrong rect element. What used to happen was: the
      // elevation graph gets clipped by the clippath of the horizontalstack.
      var clip = this._svg.select('g').select("defs");
      if (!clip[0][0]) {
        this._svg.select('g').append('defs').append("svg:clipPath")
          .attr("id", "clip" + height)
          .append("svg:rect")
          .attr("id", "clip-rect")
          .attr("x", "0")
          .attr("y", 0 - 2)
          .attr("width", width)
          // give some space to draw full stroke-width.
          .attr("height", height + 4);
      }
      // Put the data in this group
      var g = this._svg.select('g').select('g');
      if (!g[0][0]) {
        g = this._svg.select('g').append('g');
      }
      g.attr("clip-path", "url(#clip" + height + ")")
        .attr('id', 'feature-group');
      return this._svg;
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} svg        d3 selection of an svg.
     * @param {object} dimensions object containing, width, height and
     *                            an object containing top,
     *                            bottom, left and right padding.
     *                            All values in px.
     * @param {array} data        Array of data objects.
     * @param {int-or-string} key key to the values for the scale and
     *                            axis in the data element
     * @param {object} options    options object that will be passed
     *                            to the d3 scale and axis.
     * @param {boolean} y         Determines whether to return a y scale.
     * @description Computes and returns maxmin, scale and axis.
     * @return {object} containing maxmin, d3 scale and d3 axis.
     */
    _createD3Objects: function (data, key, options, y) {

      // Computes and returns maxmin scale and axis
      var width = this._getWidth(this.dimensions),
          height = this._getHeight(this.dimensions),
          d3Objects = {},
          // y range runs from height till zero, x domain from 0 to width.
          range;

      if (y) {
        range = { max: 0, min: height };
        d3Objects.maxMin = this._maxMin(data, key);
      } else {
        range = { min: 0, max: width };
        d3Objects.maxMin = (this._xDomainStart && this._xDomainEnd)
          ? { min: this._xDomainStart, max: this._xDomainEnd }
          : this._maxMin(data, key);
      }
      d3Objects.scale = this._makeScale(d3Objects.maxMin, range, options);
      d3Objects.axis = this._makeAxis(d3Objects.scale, options);
      return d3Objects;
    },


    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} dimensions object containing, width, height and
     *                            an object containing top,
     *                            bottom, left and right padding.
     *                            All values in px.
     * @description Resizes the canvas and the updates the drawing
     *              area. Does not resize the elements drawn on the
     *              canvas.
     */
    resize: function (dimensions) {
      this.dimensions = angular.copy(dimensions);
      this._svg = resizeCanvas(this._svg, this.dimensions);
      this._svg = this._createDrawingArea(this._svg, this.dimensions);
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {array} data        Array of data objects.
     * @param {int-or-string} key key to the value in the array or object.
     * @description returns the maximum and minimum
     * @return {object} containing the max and min
     */
    _maxMin: function (data, key) {
      // min max of d3 does not filter nulls for some reason
      // y axis is way off sometimes.
      var filtered = data.filter(function (d) { return !isNaN(parseFloat(d[key])); });
      var max = d3.max(filtered, function (d) {
              return Number(d[key]);
            });

      var min = d3.min(filtered, function (d) {
              return Number(d[key]);
            });
      return {
        max: max,
        min: min
      };
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} minMax object containing the max and min
     * @param {object} range object contaning from where to where
     *                       the scale runs.
     * @param {object} options object what kind of scale to return
     * @description returns a d3 scale
     * @return {object} d3 scale
     */
    _makeScale: function (minMax, range, options) {
      // Instantiate a d3 scale based on min max and
      // width and height of plot
      var scale;
      if (options.scale === 'time') {
        scale = d3.time.scale()
          .domain([new Date(minMax.min), new Date(minMax.max)])
          .range([range.min, range.max]);
      } else if (options.scale === "ordinal") {
        scale = d3.scale.ordinal()
          .domain(function (d) {
            return d3.set(d.properties.event_sub_type).values();
          })
          .range(options.colors[8]);
      } else if (options.scale === "linear") {
        scale = d3.scale.linear()
          .domain([minMax.min, minMax.max])
          .range([range.min, range.max]);
      } else {
        throw new Error(options.scale + ' is not a valid d3 scale');
      }
      return scale;
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} scale d3 scale
     * @param {object} options object containing the orientation
     *                         (bottom/left/right/top) and optionally
     *                         an overwrite for the default ticks (5).
     * @description returns a d3 axis
     * @return {object} d3 axis
     */
    _makeAxis: function (scale, options) {
      // Make an axis for d3 based on a scale
      var decimalCount,
          axis = d3.svg.axis()
            .scale(scale)
            .orient(options.orientation);
      if (options.ticks) {
        axis.ticks(options.ticks);
      } else {
        axis.ticks(5);
      }
      if (scale.domain()[0] instanceof Date) {
        var tickFormat = this._localeFormatter.nl_NL.timeFormat.multi([
          ["%H:%M", function (d) { return d.getMinutes(); }],
          ["%H:%M", function (d) { return d.getHours(); }],
          ["%a %d", function (d) { return d.getDay() && d.getDate() !== 1; }],
          ["%b %d", function (d) { return d.getDate() !== 1; }],
          ["%B", function (d) { return d.getMonth(); }],
          ["%Y", function () { return true; }]
        ]);
        axis.tickFormat(tickFormat);
      } else {
        if (options.tickFormat) {
          axis.tickFormat(options.tickFormat);
        } else {
          var domainDiff = scale.domain()[1] - scale.domain()[0];
          if (domainDiff < 0.5) {
            axis.tickFormat(function (d) {
              return d3.format(".2f")(d);
            });
          } else if (domainDiff < 5.0) {
            axis.tickFormat(function (d) {
              return d3.format(".1f")(d);
            });
          } else {
            axis.tickFormat(
              this._localeFormatter.nl_NL.numberFormat()
            );
          }
        }
      }
      return axis;
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} svg  d3 selection of svg
     * @param {object} axis d3 axis
     * @param {object} dimensions object containing dimensions.
     * @param {boolean} y to draw y-axis or not (x-axis).
     * @param {int} duration if specified, transitions the drawing.
     * @description Creates axis group if necessary and draws
     *              axis.
     */
    _drawAxes: function (svg, axis, dimensions, y, duration) {
      if (typeof(y) !== 'boolean') { throw new Error('Invalid input: y is not a boolean'); }
      var id = y === true ? 'yaxis': 'xaxis';
      var axisEl = svg.select('g').select('#' + id);
      if (!axisEl[0][0]) {
        axisEl = createElementForAxis(svg, id, dimensions, y);
      }
      if (duration) {
        axisEl
          .transition()
          .duration(duration)
          .call(axis);
      } else {
        axisEl
          .call(axis);
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} dimensions object containing dimensions
     * @description Deducts the left and right padding to get
     *              the actual width of the drawing area
     * @return {int} width
     */
    _getWidth: function (dimensions) {
      return dimensions.width -
        dimensions.padding.left -
        dimensions.padding.right;
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} dimensions object containing dimensions
     * @description Deducts the bottom padding to get
     *              the actual height of the drawing area
     * @return {int} height
     */
    _getHeight: function (dimensions) {
      return dimensions.height -
        dimensions.padding.bottom;
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {object} xy object containing y.scales and x.scale.
     * @param {object} keys object containing y.key and x.key.
     * @description returns a line definition for the provided scales.
     * @return {object} line
     */
    _createLine: function (xy, keys) {
      return d3.svg.line().interpolate('basis')
        .y(function (d) {
          return xy.y.scale(d[keys.y]);
        })
        .x(function (d) {
          return xy.x.scale(d[keys.x]);
        })
        // interrupt the line when no data
        .defined(function (d) { return !isNaN(parseFloat(d[keys.y])); });
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .NxtD3
     *
     * @param {int} now timestamp from epoch in ms
     * @param {object} scale d3 scale for time
     * @description draws a line.
     */
    _drawNow: function (now, scale) {
      var height = this._getHeight(this.dimensions);
      var x = scale(now);
      var nowIndicator = this._svg.select('g').select('#feature-group').select('.now-indicator');

      if (!nowIndicator[0][0]) {
        nowIndicator = this._svg.select('g').select('#feature-group').append('line')
          .attr('class', 'now-indicator')
          .style("stroke", "#c0392b") // pommegranate
          .style("stroke-width", 2)
          // create without transition
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', height)
          .attr('y2', 0);
      }
      nowIndicator.transition().duration(2 * this.transTime)
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', height)
        .attr('y2', 0);
    }
  };


  /**
   * Creates a svg canvas for drawing,
   *
   * @param  {object} svg element to create canvas.
   * @param  {object} dimensions  object containing, width, height and an
   *                              object containing top,
   *                              bottom, left and right padding. All
   *                              values in px.
   * @return {object} svg         svg.
   */
  createCanvas = function (element, dimensions) {

    var width = NxtD3.prototype._getWidth(dimensions),
        height = NxtD3.prototype._getHeight(dimensions),
        svg = d3.select(element);

    // Create the svg as big as the dimensions
    svg.attr('width', dimensions.width)
      .attr('height', dimensions.height)
      // Create a drawing group that is shifted left side padding to the right
      .append("g")
        .attr("transform", "translate(" + dimensions.padding.left + ", " + dimensions.padding.top + ")")
        // Add rect element to attach listeners
        .append('rect')
          .attr('id', 'listeners')
          .attr('width', width)
          .attr('height', height);
    return svg;
  };

  resizeCanvas = function (svg, dimensions) {
    var width = NxtD3.prototype._getWidth(dimensions),
    height = NxtD3.prototype._getHeight(dimensions);
    // Create the svg as big as the dimensions
    svg.attr('width', dimensions.width)
      .attr('height', dimensions.height)
      // Create a drawing group that is shifted left side padding to the right
      .select("g")
        .attr("transform", "translate(" + dimensions.padding.left + ", " + dimensions.padding.top + ")");
    return svg;
  };

  createElementForAxis = function (svg, id, dimensions, y) {
    var className = y ? 'y axis': 'x axis',
    transform = y ? 0: NxtD3.prototype._getHeight(dimensions);
    return svg.select('g').append('g')
      .attr('class', className)
      .attr('id', id)
      .attr("transform", "translate(0 ," + transform + ")");
  };

  return NxtD3;

}]);


/**
 * Service to draw click feedback.
 */
angular.module('lizard-nxt')
  .service('ClickFeedbackService', ['$rootScope', 'LeafletService',
  function ($rootScope, LeafletService) {
    var ClickLayer = function () {

      /**
       * @description Removes clicklayer, adds a new one.
       *              Clicklayer has a default color, opacity
       *              and a way to transform points.
       * @param {object} mapState
       */
      this.emptyClickLayer = function (mapState) {
        clearInterval(this._vibration);

        if (this.clickLayer) {
          mapState.removeLeafletLayer(this.clickLayer);
        }

        this.clickLayer = LeafletService.geoJson(null, {
          style: function (feature) {
            return {
              name: 'click',
              clickable: true,
              color: '#c0392b',
              stroke: '#c0392b',
              opacity: 0.8,
              'stroke-opacity': 0.8,
              radius: getRadius(feature),
            };
          }
        });

        var self = this;
        // Explain leaflet to draw points as circlemarkers.
        this.clickLayer.options.pointToLayer = function (feature, latlng) {
          var circleMarker = L.circleMarker(latlng, {
            radius: 0,
            weight: self.strokeWidth,
            fill: false,
            zIndexOffset: 1000,
            clickable: true
          });
          self._circleMarker = circleMarker;
          return circleMarker;
        };

        // Hack to make click on the clicklayer bubble down to the map it is
        // part of.
        this.clickLayer.on('click', function (e) {
            this._map.fire('click', e);
          }
        );

        mapState.addLeafletLayer(this.clickLayer);
      };

      /**
       * Returns the svg as a d3 selection of leaflet layer.
       *
       * @param  {object} layer
       * @return {object} the svg of the leaflet object layer
       */
      this._getSelection = function (layer) {
        // Due to some leaflet obscurity you have to get the first item with an
        // unknown key.
        var _layers = layer._layers;
        var selection;
        for (var key in _layers) {
          selection = d3.select(_layers[key]._container);
          break;
        }
        return selection;
      };

      /**
       * @description add data to the clicklayer
       */
      this.drawFeature = function (geojson) {
        this.strokeWidth = 5;
        this.clickLayer.addData(geojson);
      };

      /**
       * @function drawLineElement
       * @memberof clickFeedbackService
       * @summary Draws a line between the given points.
       * @description Draws a line between `first` and `second`. If `first` or
       * `second` don't exist, return. If `dashed` is `true`, draw a dashed
       * line.
       *
       * @param  {L.LatLng} first - start of the line
       * @param  {L.LatLng} second - end of the line
       * @param  {boolean} dashed - when true draws a dashed line
       */
      this.drawLineElement = function (first, second, dashed) {

        if (first === undefined || second === undefined) {
          return;
        }

        this.strokeWidth = 2;

        var geojsonFeature = { "type": "Feature" };
        geojsonFeature.geometry = {
          "type": "LineString",
          "coordinates": [[first.lng, first.lat], [second.lng, second.lat]]
        };
        this.clickLayer.options.style = {
          color: '#c0392b',
          weight: this.strokeWidth,
          opacity: 1,
          smoothFactor: 1
        };
        if (dashed) {
          this.clickLayer.options.style.dashArray = "5, 5";
        }
        this.clickLayer.addData(geojsonFeature);
      };

      /**
       * @description vibrates the features in the clickLayer.
       */
      this.vibrateFeatures = function () {
        var sel = this._selection = this._getSelection(this.clickLayer);
        clearInterval(this._vibration);
        var vibrate = this.vibrate;
        var self = this;
        this._vibration = setInterval(
          function () { vibrate.call(self, sel, false); }, 400);
      };

      /**
       * @describtion Vibrate the features in the clicklayer once.
       *
       * @param  {geojson} geojson if provided draws the features in
       *                           the geojson, vibrates it and removes it.
       */
      this.vibrateOnce = function (geojson) {
        var sel = this._selection = this._getSelection(this.clickLayer);
        var remove = false;
        if (geojson) {
          this.clickLayer.addData(geojson);
          sel = this._selection = this._getSelection(this.clickLayer);
          remove = true;
        }
        this.vibrate(sel, remove);
      };

      /**
       * @description add a locationMarker as a leaflet marker with
       *              a leaflet divIcon. Overwrites the pointTolayer
       *              of the clicklayer.
       * @param {object} mapState nxt mapState
       * @param {L.latLng} latLng location of marker
       */
      this.addLocationMarker = function (mapState, latLng) {
        var divIcon = L.divIcon({
          className: 'selected',
          iconAnchor: [10, 48],
          html: '<svg width=20 height=48><path d="M10,16'
            + 'c-5.523 0-10 4.477-10 10 0 10 10 22 10 22'
            + 's10-12 10-22c0-5.523-4.477-10-10-10z M10,32'
            + ' c-3.314 0-6-2.686-6-6s2.686-6 6-6 6 2.686'
            + ' 6 6-2.686 6-6 6z"></path></svg>'
        });

        this.clickLayer.options.pointToLayer = function (feature, latlng) {
          return L.marker(latlng, {
            icon: divIcon,
            clickable: true
          });
        };

      };

      /**
       * @descriptions vibretes a selection.paths by varying the stroke-width
       * @param  {d3 selection} sel selection contaning a path.
       * @param  {boolean} remove to remove or not. When true, stroke-widh
       *                          is set to 0 at the end the vibration.
       */
      this.vibrate = function (sel, remove) {
        var width = this.strokeWidth;

        sel.selectAll("path")
          .classed("vibrator", true)
          .attr("stroke-width", function () { return width * 2; })
          .transition().duration(200)
          .attr("stroke-width", function () { return width * 3; })
          .transition().duration(200)
          .attr("stroke-width", function () { return remove ? 0 : width; });
      };

      /**
       * @description returns specific radius for water-objects coming from
       *              the utfGrid
       * @param  {geojson feature} feature containing the entity_name of the
       *                           water-object
       * @return {int}             radius
       */
      var getRadius = function (feature) {
        var entityName = feature.properties.entity_name,
            entityType = feature.properties.type;
        var radius = feature.properties.radius || 0;
        if (entityName) {
          radius = 12;
          if (entityName === "pumpstation" && entityType !== "Rioolgemaal") {
            radius =  13;
          } else if (entityType === "Rioolgemaal" || entityName === "weir") {
            radius =  11;
          } else if (entityName === "bridge" || entityName === "manhole") {
            radius =  14;
          }
        }
        return radius;
      };

    };

    var clickLayer = new ClickLayer(),
        emptyClickLayer,
        drawCircle,
        drawArrow,
        drawLine,
        drawGeometry,
        startVibration,
        vibrateOnce;


    /**
     * @description empties the clicklayer.
     */
    emptyClickLayer = function (mapState) {
      clickLayer.emptyClickLayer(mapState);
    };

    /**
     * Draws visible feedback on the map after a click.
     *
     * Removes possible click feedback layer and creates a new clickLayer
     * containing a circle.
     *
     * @param {object} latLng Leaflet object specifying the latitude
     * and longitude of a click
     */
    drawCircle = function (mapState, latlng) {
      clickLayer.emptyClickLayer(mapState);
      var geometry = {
        "type": "Point",
        "coordinates":
          [latlng.lng, latlng.lat]
      };
      clickLayer.drawFeature(geometry);
    };

    drawGeometry = function (mapState, geometry, entityName) {
      clickLayer.drawFeature(geometry);
    };

    /**
     * @function drawArrow
     * @memberof ClickFeedbackService
     * @summary Draws an arrow at latLng.
     * @description Draws arrow at specified location to indicate click. Used
     * to indicate location of rain graph. Returns void if latLng doesn't exist.
     *
     * @param {object} mapState - the mapState object, which assumes the key
     *   'here' to be defined.
     */
    drawArrow = function (mapState, latLng) {

      if (latLng === undefined) {
        return;
      }

      clickLayer.emptyClickLayer(mapState);
      var geometry = {
        "type": "Point",
        "coordinates": [latLng.lng, latLng.lat]
      };
      clickLayer.addLocationMarker(mapState, latLng);
      clickLayer.drawFeature(geometry);
    };

    drawLine = function (first, second, dashed) {
      clickLayer.drawLineElement(first, second, dashed);
    };

    startVibration = function () {
      clickLayer.vibrateFeatures();
    };

    vibrateOnce = function (geojson) {
      clickLayer.vibrateOnce(geojson);
    };

    return {
      emptyClickLayer: emptyClickLayer,
      drawArrow: drawArrow,
      drawCircle: drawCircle,
      drawGeometry: drawGeometry,
      startVibration: startVibration,
      drawLine: drawLine,
      vibrateOnce: vibrateOnce
    };
  }
]);

/**
 * Service to handle timeseries retrieval.
 */
angular.module('lizard-nxt')
  .service("TimeseriesService", ['CabinetService',
    function (CabinetService) {
    var getTimeseries = function (id, timeState) {
      return CabinetService.timeseries.get({
        object: id,
        start: timeState.start,
        end: timeState.end
      });
    };

    return {
      getTimeseries: getTimeseries
    };
  }

]);



/**
 * @ngdoc service
 * @class EventAggregateService
 * @name EventAggregateService
 * @summary Event aggregation functions.
 * @description Functions to aggregate event series over time with d3
 */
angular.module('lizard-nxt')
  .service("EventAggregateService", ["UtilService", function (UtilService) {

    var that = this; // the mind's a terrible thing to taste 8)

    this.colorScales = {};
    this.colorMaps = {};
    this.categoryIndex = {};

    /**
     * @function getColorMap
     * @summary Helper function to get colormap from outside this module.
     * @description Helper function to get colormap from outside this module.
     *
     * @param {string} baseColor - hex color string.
     * @returns {object} colormap.
     */
    this.getColorMap = function (baseColor) {
      return that.colorMaps[baseColor];
    };

    /**
     * @function timeCatComparator
     * @summary comparator function to use for javascript array sort.
     *
     * @description Sorts arrays of object on properties timestamp and category
     */
    var timeCatComparator = d3.comparator()
      .order(d3.ascending, function (d) { return d.timestamp; })
      .order(d3.ascending, function (d) { return d.category; });

    /**
     * @function _buildColorScale
     * @summary Build color scale based on base color and number of classes.
     * @description Build color scale based on base color.
     *
     * @param {string} baseColor - hex color string.
     * @param {integer} numClasses - number of classes to build.
     * @returns {array[]} list of hex colors.
     */
    var _buildColorScale = function (baseColor, numClasses) {

      var MAX_CATS = 7;
      numClasses = Math.min(numClasses, MAX_CATS);

      var i,
          derivedColors = [],
          baseColorTriple = UtilService.hexColorToDecimalTriple(baseColor),
          shifts = _.map([0, 1, 2], function (i) {
            return Math.round((255 - baseColorTriple[i]) / numClasses);
          });

      _.each(_.range(numClasses), function (i) {
        derivedColors.push(_.map([0, 1, 2], function (j) {
          return baseColorTriple[j] + i * shifts[j];
        }));
      });

      return derivedColors.map(UtilService.decimalTripleToHexColor);
    };

    /**
     * @function _getColor
     * @summary helper function to get color for category
     *
     * @param {string} categoryName  - Name of the current category.
     * @param {string} baseColor     - Hex color.
     * @returns {string} HTML HEX color code.
     */
    var _getColor = function (

      categoryName,
      baseColor

      ) {

      // if colorscale doesn't exist yet, build a new one plus a new colormap.
      if (!that.colorScales.hasOwnProperty(baseColor)) {
        that.colorScales[baseColor] = _buildColorScale(baseColor, 7);
        that.colorMaps[baseColor] = {};
        that.categoryIndex[baseColor] = 0;
      }

      // if entry for categoryName doesn't exist yet, make one and assign a
      // color from colorscale.
      if (!that.colorMaps[baseColor].hasOwnProperty(categoryName)) {
        that.colorMaps[baseColor][categoryName] =
          that.colorScales[baseColor][that.categoryIndex[baseColor]++];
      }

      return that.colorMaps[baseColor][categoryName];
    };

    /**
     * @function _getValue
     * @summary helper function to get value property of geojson feature.
     *
     * @param {object} d - geojson feature.
     * @returns {float} value field of properties.
     */
    var _getValue = function (d) {return parseFloat(d.properties.value); };

    /**
     * @function _getTimeIntervalDats
     * @summary helper function to get difference between timestamp_end and
     * timestamp_start
     *
     * @param {object} d - geojson feature.
     * @returns {integer} time interval in days.
     */
    var _getTimeIntervalDays = function (d) {
      return (d.properties.timestamp_end - d.properties.timestamp_start) /
              1000 / 60 / 60 / 24;
    };

    /**
     * @function aggregate
     * @memberOf EventAggregateService
     * @summary Aggregates list of geojson features by category.
     *
     * @description Uses d3.nest() to aggregate lists of geojson events by
     * interval and category, additionaly returns average duration of events
     * when timestamp_start and timestamp_end are set.
     *
     * When the `value` property of a feature is a `float` or `int`, additional
     * statistics are calculated: min, max, sum, mean,
     *
     * If data is empty returns empty array.
     *
     * @param {object[]} data - list of event geojson features.
     * @param {integer} aggWindow - aggregation window in ms.
     * @param {string} baseColor - hex color.
     * @returns {array} - array of objects with keys
     *   for ordinal en nominal:
     *     timestamp, category, count, mean_duration
     *
     *   for ratio and interval:
     *     timestamp, mean, min, max,
     *
     */
    this.aggregate = function (data, aggWindow, baseColor) {

      if (data.length === 0) {
        return [];
      }

      var isString = isNaN(parseFloat(data[0].properties.value)),
          nestedData = {},
          aggregatedArray = [];

      // if value is string, data is nominal or ordinal, calculate counts
      // per cateogry
      if (isString) {

        nestedData = d3.nest()
          .key(function (d) {
            return UtilService.roundTimestamp(d.properties.timestamp_start,
                                              aggWindow);
          })
          .key(function (d) {return d.properties.category; })
          .rollup(function (leaves) {
            var stats = {
              "count": leaves.length,
              "mean_duration": d3.mean(leaves, _getTimeIntervalDays)
            };
            return stats;
          })
          .map(data, d3.map);

        // rewrite d3 nested map to array of flat objects
        nestedData
          .forEach(function (timestamp, value) {
            var tmpObj;
            value.forEach(function (category, value) {
              tmpObj = {timestamp: timestamp,
                        category: category,
                        mean_duration: value.mean_duration,
                        color: _getColor(category,
                                         baseColor),
                        count: value.count};
              aggregatedArray.push(tmpObj);
            });
          }
        );

        // sort array by timestamp and category
        aggregatedArray.sort(timeCatComparator);
      } else {

        nestedData = d3.nest()
          .key(function (d) {
            return UtilService.roundTimestamp(d.properties.timestamp_start,
                                              aggWindow);
          })
          .rollup(function (leaves) {
            var stats = {
              count: leaves.length,
              min: d3.min(leaves, _getValue),
              max: d3.max(leaves, _getValue),
              mean: d3.mean(leaves, _getValue),
              median: d3.median(leaves, _getValue),
              sum: d3.sum(leaves, _getValue),
              mean_duration: d3.mean(leaves, _getTimeIntervalDays),
            };

            return stats;
          })
          .map(data, d3.map);

        // rewrite d3 nested map to array of flat objects
        nestedData
          .forEach(function (timestamp, value) {
            var tmpObj = {
              color: baseColor,
              timestamp: timestamp,
              mean_duration: value.mean_duration,
              min: value.min,
              max: value.max,
              mean: value.mean,
              median: value.median,
              sum: value.sum,
              count: value.count
            };
            aggregatedArray.push(tmpObj);
          }
        );
      }

      return aggregatedArray;
    };

  }]);

'use strict';

/**
 * Lizard-nxt filters
 *
 * Overview
 * ========
 *
 * Defines custom filters
 *
 */

/**
 * Filter to order objects instead of angulars orderBy
 * that only orders array
 */
angular.module('lizard-nxt')
  .filter('orderObjectBy', function () {
  return function (items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function (item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if (reverse) { filtered.reverse(); }
    return filtered;
  };
});


/**
 * Returns a rounded number or a '...' based on input type.
 *
 * @param {string} input to round or convert to dash, can be string or number
 * @param {number} optional decimals to round the number to
 * @return {string} when input is a number: returns a number
 * rounded to specified decimals else returns '-'
 */
angular.module('lizard-nxt')
  .filter('niceNumberOrEllipsis', function () {
  return function (input, decimals) {
    var out;
    if (typeof(input) === 'number') {
      var factor = 1;
      if (decimals) {
        factor = Math.pow(10, decimals);
      }
      out = Math.round(input * factor) / factor;
    } else {
      out = '...';
    }
    return out;
  };
});

// lookups: manhole

angular.module('lizard-nxt')
  .filter('lookupManholeShape', function () {
  return function (input) {
    var out;
    switch (input) {
    case '0.0':
      out = 'vierkant';
      break;
    case '1.0':
      out = 'rond';
      break;
    case '2.0':
      out = 'rechthoekig';
      break;
    default:
      out = 'Afwijkende vorm';
    }
    return out;
  };
});

angular.module('lizard-nxt')
  .filter('lookupManholeMaterial', function () {
  return function (input) {
    var out;
    out = '...';
    return out;
  };
});


// lookups: levee

angular.module('lizard-nxt')
  .filter('lookupLeveeType', function () {
  return function (input) {
    var out;
    switch (input) {
    case 1:
      out = 'Primair';
      break;
    case 2:
      out = 'Regionaal';
      break;
    case 3:
      out = 'c-type';
      break;
    default:
      out = 'Afwijkend type';
    }
    return out;
  };
});

angular.module('lizard-nxt')
  .filter('lookupLeveeReferencePointType', function () {
  return function (input) {
    var out;
    switch (input) {
    case 1:
      out = 'Dijkpaal';
      break;
    case 2:
      out = 'Virtueel';
      break;
    default:
      out = 'Afwijkend type';
    }
    return out;
  };
});


angular.module('lizard-nxt')
  .filter('allowedFlowDirection', function () {
  return function (input) {
    var out;
    if (input !== null && input !== undefined) {
      out = input;
    } else {
      out = '...';
    }
    return out;
  };
});


angular.module('lizard-nxt')
  .filter('lookupPumpStationType', function () {
  return function (input) {
      switch (input) {
      case 'HOUSEHOLD':
        return 'Drukgemaal';
      case 'SEWER':
        return 'Rioolgemaal';
      case 'TRANSPORT':
        return 'Transportgemaal';
      case 'UNDER':
        return 'Onderbemaling';
      case 'POLDER':
        return 'Poldergemaal';
      case 'BOSOM':
        return 'Boezemgemaal';
      case 'OTHER':
        return 'Gemaaltype afwijkend';
      default:
        return 'Gemaaltype onbekend';
      }
    };
});

angular.module('lizard-nxt')
  .filter('lookupPipeType', function () {
  return function (input) {
    var out;
    switch (input) {
    case '00':
      out = 'Gemengde leiding';
      break;
    case '01':
      out = 'Regenwaterleiding';
      break;
    case '02':
      out = 'Vuilwaterleiding';
      break;
    case '03':
      out = 'Transportleiding';
      break;
    case '04':
      out = 'Overstortleiding';
      break;
    case '05':
      out = 'Zinker';
      break;
    case '06':
      out = 'Bergingsleiding';
      break;
    case '07':
      out = 'Berg-/Bezinkleiding';
      break;
    default:
      out = 'Leidingtype afwijkend';
    }
    return out;
  };
});

angular.module('lizard-nxt')
  .filter('lookupPipeShape', function () {
  return function (input) {
    var out;
    switch (input) {
    case '0.0':
      out = 'rond';
      break;
    case '1.0':
      out = 'eivorm';
      break;
    case '2.0':
      out = 'rechthoek';
      break;
    case '4.0':
      out = 'vierkant';
      break;
    default:
      out = 'Vorm afwijkend';
    }
    return out;
  };
});

angular.module('lizard-nxt')
  .filter('lookupPressurePipeType', function () {
  return function (input) {
    var out;
    switch (input) {
    case '1':
      out = 'Drukriolering';
      break;
    case '2':
      out = 'Persleiding';
      break;
    case '3':
      out = 'Pers-/transportleiding';
      break;
    default:
      out = 'Persleidingtype afwijkend';
    }
    return out;
  };
});

angular.module('lizard-nxt')
  .filter('pipeMaterialOrEllipsis', function () {
  return function (input) {
    var out;
    switch (input) {
    case '0.0':
      out = 'beton';
      break;
    case '1.0':
      out = 'PVC';
      break;
    case '2.0':
      out = 'gres';
      break;
    default:
      out = 'Materiaal afwijkend';
    }
    return out;
  };
});

angular.module('lizard-nxt')
  .filter('aggWinToYLabel', function () {
  return function (input) {
    var out;
    switch (input) {
    case 300000:
      out = 'mm / 5 min';
      break;
    case 3600000:
      out = 'mm / uur';
      break;
    case 86400000:
      out = 'mm / dag';
      break;
    case 2635200000:
      out = 'mm / maand';
      break;
    default:
      out = '...';
    }
    return out;
  };
});

/**
 * Truncates a string to have no more than maxLength characters.
 * Used in the righthand menu for truncating lengthy layer names.
 *
 * @param {integer} maxLength - Length at which string gets truncated.
 * @return {string} The truncated layer name
 */
angular.module('lizard-nxt')
  .filter('truncate', function () {

  return function (input, maxLength) {

    var MAX_LENGTH = maxLength || 20;

    if (input.length > MAX_LENGTH) {
      return input.slice(0, MAX_LENGTH - 3) + "...";

    } else {
      return input;
    }
  };
});

/**
 * For the n timeseries related to a structure, remove the ones with an
 * insufficient amount of measurements to be able draw a graph.
 *
 * @param {Object[]} A list of timeseries
 * @return  {Object[]} A list of timeseries with sufficient data
 */
angular.module('lizard-nxt')
  .filter('rmSingleDatumTimeseries', function () {

  return function (input) {
    var result = [];
    angular.forEach(input, function (datum) {
      if (datum.events.length > 1) { result.push(datum); }
    });
    return result;
  };
});


angular.module('lizard-nxt')
  .filter('objectTitle', function () {

  return function (input) {

    return {
      'bridge': 'Brug',
      'channel': 'Watergang',
      'channel_Boezem': 'Boezemkanaal',
      'channel_Primair': 'Primaire watergang',
      'crossprofile': 'Kruisprofiel',
      'culvert': 'Duiker',
      'groundwaterstation': 'Grondwaterstation',
      'manhole': 'Put',
      'measuringstation': 'Meetstation',
      'orifice': 'Doorlaat',
      'outlet': 'Uitlaat',
      'overflow': 'Overstort',
      'pipe': 'Rioolleiding',
      'pumpstation': 'Gemaal',
      'weir': 'Stuw',
      'pressurepipe': 'Persleiding',
      'sluice': 'Sluis',
      'wastewatertreatmentplant': 'Rioolwaterzuiveringsinstallatie',
      'levee': 'Kering',
      'leveereferencepoint': 'Referentiepunt kering'
    }[input] || input;
  };

});

angular.module('lizard-nxt')
  .filter('discreteRasterType', function () {
  return function (input) {
    return input.match(/^.*-.*-.*$/g)
      ? input.split(' - ')[2]
      : input; // return full label for non-verbose labeling (e.g 'soil')
  };
});

angular.module('lizard-nxt')
  .filter('discreteRasterSource', function () {
  return function (input) {
    return input.match(/^.*-.*-.*$/g)
      ? input.split(' - ')[1]
      : ""; // if no source is given, return empty string
  };
});


/**
 * @ngdoc service
 * @class LeafletService
 * @memberof app
 * @name LeafletService
 * @description Trivial wrapper for global Leaflet object.
 *
 * Perhaps in the future this can be done with CommonJS style requires.
 */
angular.module('lizard-nxt')
  .service('LeafletService', [function () {
  if (L) {
    // Leaflet global variable to speed up vector layer,
    // see: http://leafletjs.com/reference.html#path-canvas
    window.L_PREFER_CANVAS = true;

    // Set max margin of latLng.equals method. This way
    // the vectorservice is able to return the features
    // within 0.0001 degree of the click.
    L.LatLng.MAX_MARGIN = 0.0001;

    return L;
  } else {
    throw new Error('Leaflet can not be found');
  }
}]);

/*
 Copyright (c) 2012, Smartrak, David Leaver
 Leaflet.utfgrid is an open-source JavaScript library that provides utfgrid interaction on leaflet powered maps.
 https://github.com/danzel/Leaflet.utfgrid
*/
(function (window, undefined) {

  L.Util.ajax = function (url, cb) {
    // the following is from JavaScript: The Definitive Guide
    // and https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/Using_XMLHttpRequest_in_IE6
    if (window.XMLHttpRequest === undefined) {
      window.XMLHttpRequest = function () {
        /*global ActiveXObject:true */
        try {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        catch  (e) {
            throw new Error("XMLHttpRequest is not supported");
        }
      };
    }
    var response, request = new XMLHttpRequest();
    request.open("GET", url, true); // async
    // request.open("GET", url, false); // sync
    request.onreadystatechange = function () {
      /*jshint evil: true */
      if (request.readyState === 4 && request.status === 200) {
        if (window.JSON) {
            response = JSON.parse(request.responseText);
        } else {
            response = eval("(" + request.responseText + ")");
        }
        cb(response);
      }
    };
    request.send();
  };


  L.UtfGrid = L.Class.extend({

    includes: L.Mixin.Events,
    options: {
      subdomains: 'abc',

      minZoom: 0,
      maxZoom: 18,
      tileSize: 256,

      resolution: 4,

      useJsonP: true,
      pointerCursor: true
    },

    //The thing the mouse is currently on
    _mouseOn: null,

    isLoading: false,

    initialize: function (url, options) {
      L.Util.setOptions(this, options);

      this._url = url;
      this._cache = {};
      // We keep track of the tiles which are at least partially within
      // the current spatial extent.
      this._extentCache = {};

      //Find a unique id in window we can use for our callbacks
      //Required for jsonP
      var i = 0;
      while (window['lu' + i]) {
          i++;
      }
      this._windowKey = 'lu' + i;
      window[this._windowKey] = {};

      var subdomains = this.options.subdomains;
      if (typeof this.options.subdomains === 'string') {
          this.options.subdomains = subdomains.split('');
      }
    },

    onAdd: function (map) {
      this._map = map;
      this._container = this._map._container;

      this._update();

      var zoom = this._map.getZoom();

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
        return;
      }

      map.on('click', this._click, this);
      map.on('mousemove', this._move, this);
      map.on('moveend', this._update, this);

      this._tileLoaded(); // Check whether more tiles need loading
    },

    onRemove: function () {
      this._map.off('click', this._click, this);
      this._map.off('mousemove', this._move, this);
      this._map.off('moveend', this._update, this);
      // I am free, I'm free at last
      this._cache = {};
      if (this.options.pointerCursor) {
        this._container.style.cursor = '';
      }
    },

    _click: function (e) {
      this.fire('click', this._objectForEvent(e));
    },
    _move: function (e) {
      var on = this._objectForEvent(e);

      if (on.data !== this._mouseOn) {
        if (this._mouseOn) {
          this.fire('mouseout', { latlng: e.latlng, data: this._mouseOn });
          if (this.options.pointerCursor) {
            this._container.style.cursor = '';
          }
        }
        if (on.data) {
          this.fire('mouseover', on);
          if (this.options.pointerCursor) {
            this._container.style.cursor = 'pointer';
          }
        }

        this._mouseOn = on.data;
      } else if (on.data) {
        this.fire('mousemove', on);
      }
    },

    _objectForEvent: function (e) {

      var map = this._map;
      if (!map) {
        // This layer has not been not added to the map yet
        return { latlng: e.latlng, data: null };
      }

      var point = map.project(e.latlng),
        tileSize = this.options.tileSize,
        resolution = this.options.resolution,
        x = Math.floor(point.x / tileSize),
        y = Math.floor(point.y / tileSize),
        gridX = Math.floor((point.x - (x * tileSize)) / resolution),
        gridY = Math.floor((point.y - (y * tileSize)) / resolution),
          max = map.options.crs.scale(map.getZoom()) / tileSize;

      x = (x + max) % max;
      y = (y + max) % max;

      var data = this._cache[map.getZoom() + '_' + x + '_' + y];
      if (!data) {
        return { latlng: e.latlng, data: null };
      }

      var idx = this._utfDecode(data.grid[gridY].charCodeAt(gridX)),
        key = data.keys[idx],
        result = data.data[key];

      if (!data.data.hasOwnProperty(key)) {
        result = null;
      }

      return { latlng: e.latlng, data: result};
    },

    //Load up all required json grid files
    //TODO: Load from center etc
    _update: function () {

      var bounds = this._map.getPixelBounds(),
          zoom = this._map.getZoom(),
          tileSize = this.options.tileSize;

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
        return;
      }

      var nwTilePoint = new L.Point(
            Math.floor(bounds.min.x / tileSize),
            Math.floor(bounds.min.y / tileSize)
          ),
          seTilePoint = new L.Point(
            Math.floor(bounds.max.x / tileSize),
            Math.floor(bounds.max.y / tileSize)
          ),
          max = this._map.options.crs.scale(zoom) / tileSize;

      this._extentCache = {}; // empty the _extentCache

      //Load all required ones
      for (var x = nwTilePoint.x; x <= seTilePoint.x; x++) {
        for (var y = nwTilePoint.y; y <= seTilePoint.y; y++) {

          var xw = (x + max) % max, yw = (y + max) % max;
          var key = zoom + '_' + xw + '_' + yw;

          if (!this._cache.hasOwnProperty(key)) {
            // We prepare the new tiles that are to be rendered:
            this._cache[key] = null;
            this._extentCache[key] = null;
            this._loadTile(zoom, xw, yw);
          } else {
            // We keep the old tiles that are still rendered:
            this._extentCache[key] = this._cache[key];
          }
        }
      }
    },

    _tileLoaded: function () {
      var isLoading = false;
      for (var i in this._cache) {
        if (this._cache[i] === null) { isLoading = true; }
      }
      this.isLoading = isLoading;
      if (!this.isLoading) { this.fireEvent('load'); }
    },

    _loadTile: function (zoom, x, y) {
      var url = L.Util.template(this._url, L.Util.extend({
        s: L.TileLayer.prototype._getSubdomain.call(this, { x: x, y: y }),
        z: zoom,
        x: x,
        y: y
      }, this.options));

      var key = zoom + '_' + x + '_' + y;

      this.isLoading = true;

      var self = this;

      L.Util.ajax(url, function (data) {
        self._cache[key] = data;
        self._extentCache[key] = data;
        self._tileLoaded();
      });
    },

    _utfDecode: function (c) {
      if (c >= 93) {
        c--;
      }
      if (c >= 35) {
        c--;
      }
      return c - 32;
    },

    _getUniqueStructureId: function (structureData) {
      try {
        return structureData.entity_name + "$" + structureData.id;
      } catch (e) {
        throw new Error("Tried to derive a unique structure ID from incomplete data: its not gonna w0rk. Error 'e' =", e);
      }
    },

    getUniqueStructuresForExtent: function () {

      var tile,
          tileSlug,
          uniqueStructures = { data: {} };

      for (tileSlug in this._extentCache) {
        tile = this._extentCache[tileSlug];
        if (tile && tile.data) {

          var datum,
              datumSlug,
              structureKey;

          for (datumSlug in tile.data) {
            datum = tile.data[datumSlug];
            structureKey = this._getUniqueStructureId(datum);
            if (!uniqueStructures.data[structureKey])
            {
              uniqueStructures.data[structureKey] = datum;
            }
          }
        }
      }
      return uniqueStructures;
    }
  });

  L.utfGrid = function (url, options) {
    return new L.UtfGrid(url, options);
  };

}(this));

'use strict';

/**
 * @ngdoc service
 * @name LeafletVectorService
 * @description
 * # LeafletVector
 * Creates a Tiled Layer for retrieving and drawing vector data.
 */
angular.module('lizard-nxt')
  .service('LeafletVectorService', ["LeafletService", "VectorService", "UtilService",
      function (LeafletService, VectorService, UtilService) {

  var MarkerClusterLayer = LeafletService.MarkerClusterGroup.extend({

    /**
     * @function
     * @description adds functionality to original Add function
     * of Leaflet.
     */
    onAdd: function (map) {
      LeafletService.MarkerClusterGroup.prototype.onAdd.call(this, map);

      this._map = map;

      this.addMarker = this.addLayer;
      this.removeMarker = this.removeLayer;
      this.hasMarker = this.hasLayer;

      var color = this.options.color,
          layer = this;

      VectorService.getData(this.options.slug, {})
      .then(function (response) {
        layer.markers = [];

        var pxSize = 10,
            marker;

        var icon = L.divIcon({
          iconAnchor: [pxSize, pxSize],
          html: '<svg height="' + (pxSize * 2) + '" width="' + (pxSize * 2)
                + '">'
                + '<circle cx="' + pxSize + '" cy="' + pxSize
                + '" r="' + pxSize + '" fill-opacity="0.4" fill="'
                + color + '" />'
                + '<circle cx="' + pxSize + '" cy="' + pxSize + '" r="'
                + (pxSize - 2) + '" fill-opacity="1" fill="'
                + color + '" />'
                + '<text x="' + pxSize + '" y="' + (pxSize + 5)
                + '" style="text-anchor: middle; fill: white;">'
                + 1 + '</text>'
                + '</svg>'
        });


        response.forEach(function (f) {
          marker = L.marker(
            [f.geometry.coordinates[1], f.geometry.coordinates[0]],
            {
              icon: icon,
              timestamp_start: f.properties.timestamp_start,
              timestamp_end: f.properties.timestamp_end
            });
          layer.addMarker(marker);
          layer.markers.push(marker);
        });

        layer.syncTime();
      });

      // simulate click on map instead of this event;
      var fireMapClick = function (e) {
        layer._map.fire('click', {
          latlng: e.latlng,
        });
      };

      this.on('clusterclick', function (e) {
        fireMapClick(e);
      });

      this.on('click', function (e) {
        fireMapClick(e);
      });

    },


    /**
     * @function
     * @description Remove geojson sublayer
     * plus call original onremove event
     * @param {object} instance of Leaflet.Map
     */
    onRemove: function (map) {
      LeafletService.MarkerClusterGroup.prototype.onRemove.call(this, map);
      this.markers.forEach(function (marker) { this.removeMarker(marker); }, this);
      this.markers = [];
    },

    /**
     * @function
     * @description Implements opacity handler like other TileLayers
     * @params {float} amount of opacity between 0 and 1.
     */
    setOpacity: function (opacity) {
      // TODO: figure out why it is possible to call setOpacity while there is
      // no geojsonlayer.
      if (this.geojsonLayer) {
        this.geojsonLayer.setStyle({
          opacity: opacity,
          fillOpacity: opacity
        });
      }
    },

    /**
     * @function
     * @description sync the time
     */
    syncTime: function (timeState) {
      if (timeState) {
        this.timeState = timeState;
      }

      if (this.markers && this.markers.length > 0) {
        var start = this.timeState.playing ? this.timeState.at : this.timeState.start,
            end = this.timeState.playing
            ? this.timeState.at + this.timeState.aggWindow
            : this.timeState.end,
          markerTimeObject,
          mustRemoveMarker;

        this.markers.forEach(function (marker) {

          markerTimeObject = {
            timestamp_start: marker.options.timestamp_start,
            timestamp_end: marker.options.timestamp_end
          };

          mustRemoveMarker = !VectorService.isInTempExtent(markerTimeObject, {start: start, end: end});
          if (this.hasMarker(marker) && mustRemoveMarker) {
            this.removeMarker(marker);
          } else if (!this.hasMarker(marker) && !mustRemoveMarker) {
            this.addMarker(marker);
          }
        }, this);
      }

    },
  });

  return MarkerClusterLayer;

}]);

angular.module("global-state", []);


/**
 * @name dataLayers
 * @memberOf app
 * @description Contains the dataLayers set by the server. Used by the
 *              map-directive and layer-chooser directive to build layer
 *              groups.
 */
angular.module('global-state')
  .constant('dataLayers', window.data_layers);

/**
 * @name dataBounds
 * @memberOf app
 * @description Contains the bounds of the data set by the server at load
 */
angular.module('global-state')
  .constant('dataBounds', window.data_bounds);

/**
 * Lizard-client global state object.
 */
angular.module('global-state')
  .service('State', ['dataLayers',
    function (dataLayers) {

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
    var CONTEXT_VALUES = ['map', 'db', 'scenarios'];
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
      syncingTime: false // Getting new layers and so on
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
      zoom: {},
      userHere: {}, // Geographical location of the users mouse only set by
                    // map-directive when box type is 'line'
      mapMoving: false
    };

    // Temporal
    var now = Date.now(),
        hour = 60 * 60 * 1000,
        day = 24 * hour,
        MIN_TIME_FOR_EXTENT = (new Date(2010, 0, 0, 0, 0, 0, 0)).getTime(),
        MAX_TIME_FOR_EXTENT = (new Date(2015, 0, 0, 0, 0, 0, 0)).getTime();

    state.temporal = {
      at: Math.round(now - 2.5 * day),
      aggWindow: 1000 * 60 * 5,
      buffering: false,
      timelineMoving: false,
      resolution: null,
      playing: false,
      start: null, // defined below
      end: null // defined below
    };

    // State.temporal.start must be higher than MIN_TIME_FOR_EXTENT
    var _start = now - 6 * day;
    Object.defineProperty(state.temporal, 'start', {
      get: function () { return _start; },
      set: function (start) { _start = start; }
    });

    // State.temporal.end must be lower than MAX_TIME_FOR_EXTENT
    var _end = now + day;
    Object.defineProperty(state.temporal, 'end', {
      get: function () { return _end; },
      set: function (end) { _end = end; }
    });

    return state;
  }]);

angular.module('data-menu', [
  'global-state'
]);
//layer-directive.js

angular.module('data-menu')
  .directive("layerChooser", [function () {

  var link = function (scope) {

    // Scope gets the mapState layerGroup, here we create a new layerGroup which
    // goes into its own NxtMap to always be turned on
    scope.showOpacitySlider = true;
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/layer-chooser.html',
    restrict: 'E',
  };
}]);

'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtLayer
 * Factory in the lizard-nxt.
 */
angular.module('data-menu')
  .factory('NxtLayer', ['$q', function ($q) {

      /*
       * @constructor
       * @memberOf app.Layer
       * @description Instantiates a layer with non-readable and
       *              non-configurable properties
       * @param  {object} layer definition as coming from the server.
       * @param  {object} temporal resolution from the parent layergroup.
       */
      function NxtLayer(layer, temporalResolution) {
        Object.defineProperty(this, 'slug', {
          value: layer.slug,
          writable: false,
        });
        Object.defineProperty(this, 'type', {
          value: layer.type,
          writable: false,
        });
        Object.defineProperty(this, 'format', {
          value: layer.format,
          writable: false,
        });
        Object.defineProperty(this, 'minZoom', {
          value: layer.min_zoom,
          writable: false,
        });
        Object.defineProperty(this, 'maxZoom', {
          value: layer.max_zoom,
          writable: false,
        });
        Object.defineProperty(this, 'url', {
          value: layer.url,
          // on github.io it needs to be prepended to nxt.lizard.net
          writable: (window.location.host === 'nens.github.io'),
        });
        // Physical time in millieseconds between frames.
        Object.defineProperty(this, '_temporalResolution', {
          value: temporalResolution,
          writable: true,
        });
        Object.defineProperty(this, 'bounds', {
          value: layer.bounds,
          writable: false,
        });
        Object.defineProperty(this, 'color', {
          value: layer.color,
          writable: false,
        });
        Object.defineProperty(this, 'aggregationType', {
          value: layer.aggregation_type,
          writable: false,
        });
        Object.defineProperty(this, 'scale', {
          value: layer.scale,
          writable: false,
        });
        Object.defineProperty(this, 'quantity', {
          value: layer.quantity,
          writable: false,
        });
        Object.defineProperty(this, 'unit', {
          value: layer.unit,
          writable: false,
        });
        Object.defineProperty(this, 'zIndex', {
          value: layer.z_index,
          writable: false,
        });
        Object.defineProperty(this, 'tiled', {
          value: layer.tiled,
          writable: false,
        });
        Object.defineProperty(this, 'options', {
          value: layer.options,
          writable: false,
        });
        Object.defineProperty(this, 'rescalable', {
          value: layer.rescalable,
          writable: false,
        });
        Object.defineProperty(this, 'loadOrder', {
          value: layer.load_order,
          writable: false,
        });

        // this allows for the demo's to be run from github.io
        if (this.url.indexOf('api/v1') > -1 &&
            window.location.host === 'nens.github.io') {
          this.url = "https://nxt.lizard.net/".concat(this.url);
        }


      }

      return NxtLayer;

    }
  ]);

'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtDataLayer
 * Factory in the lizard-nxt.
 */
angular.module('data-menu')
  .factory('NxtDataLayer', ['$q', '$injector', 'NxtLayer',
  function ($q, $injector, NxtLayer) {

      var SERVICES = {
        Store: 'RasterService',
        Vector: 'VectorService',
        UTFGrid: 'UtfGridService'
      };

      function NxtDataLayer(layer) {
        NxtLayer.call(this, layer);

        this._service = $injector.get(SERVICES[this.format]);
      }

      NxtDataLayer.prototype = Object.create(NxtLayer.prototype, {

        constructor: NxtDataLayer,

       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer can return data (Store and vector).
        * @param lgSlug slug of the layer.
        * @param options options object with geom and time.
        * @param deferred the defer to resolve when getting data.
        */
        getData: {
          value: function (lgSlug, options, deferred) {
            if (options.type && options.type !== this.type) { return; }
            return this._buildPromise(lgSlug, options, deferred, this._service);
          }
        },

       /**
        * @function
        * @memberOf app.Layer
        * @description creates a promise for the given layer and the provided
        *              service. The service should have a getData function that
        *              returns a promise that is resolved when data is recieved.
        * @param lg layerGroup slug to include in the response.
        * @param layer nxtLayer definition.
        * @param options options containing geometry or time.
        * @param deffered deffered to notify when service.getData resolves.
        * @param wantedService Service to getData from.
        */
        _buildPromise: {
          value: function (lgSlug, options, deferred, wantedService) {

            var aggType = this.aggregationType,
                color = this.color,
                scale = this.scale,
                slug = this.slug,
                summary = this.summary,
                format = this.format,
                type = this.type,
                quantity = this.quantity,
                unit = this.unit;

            var buildSuccesCallback = function (data) {
              deferred.notify({
                color: color,
                data: data,
                format: format,
                layerGroupSlug: lgSlug,
                layerSlug: slug,
                aggType: aggType,
                summary: summary,
                scale: scale,
                quantity: quantity,
                unit: unit
              });
            };

            var buildErrorCallback = function (msg) {
              deferred.notify({
                data:  null,
                type: type,
                layerGroupSlug: lgSlug,
                layerSlug: slug
              });
            };

            options = options || {};

            // Pass layer options to the services making the request.
            // RasterServices uses this to add options.styles.
            angular.extend(options, this.options);
            options.agg = this.aggregationType;

            return wantedService.getData(this, options)
              .then(buildSuccesCallback, buildErrorCallback);
          }
        }

      });

      return NxtDataLayer;

    }
  ]);


/**
 * @ngdoc service
 * @class LayerGroup
 * @memberof app
 * @name LayerGroup
 * @summary LayerGroup abstracts the notion of layers out of the app.
 * @description Only layergroups are approachable, from the outside world LayerGroup
 *              defines a group of layers which are loaded at initialization of the
 *              page. They can be toggled on/off and queried for data. Layergroup
 *              draws all its layers and returns data for all layers.
 */
angular.module('data-menu')
  .factory('DataLayerGroup', [
  'NxtLayer', 'NxtDataLayer', 'UtilService', '$q', '$http',
  function (NxtLayer, NxtDataLayer, UtilService, $q, $http) {

    /*
     * @constructor
     * @memberOf app.LayerGroup
     * @description Instantiates a layerGroup with non-readable and
     *              non-configurable properties
     * @param  {object} layergroup definition as coming from the server
     */
    function LayerGroup(layerGroup, callbackFns) {
      Object.defineProperty(this, 'temporal', {
        value: layerGroup.temporal,
        writable: false,
      });
      Object.defineProperty(this, 'temporalResolution', {
        value: layerGroup.temporal_resolution,
        writable: false,
      });
      Object.defineProperty(this, 'name', {
        value: layerGroup.name,
        writable: false,
      });
      Object.defineProperty(this, 'order', {
        value: layerGroup.order,
        writable: false,
      });
      Object.defineProperty(this, 'baselayer', {
        value: layerGroup.baselayer,
        writable: false,
      });
      Object.defineProperty(this, 'slug', {
        value: layerGroup.slug,
        writable: false,
      });
      Object.defineProperty(this, 'defaultActive', {
        value: layerGroup.active,
        writable: false,
      });
      Object.defineProperty(this, '_dataLayers', {
        value: [],
        writable: true,
      });
      Object.defineProperty(this, 'mapLayers', {
        value: [],
        writable: true,
      });
      Object.defineProperty(this, '_opacity', {
        value: layerGroup.opacity,
        writable: true,
      });
      Object.defineProperty(this, '_active', {
        value: false,
        writable: true,
      });

      this.instantiateLayers(layerGroup.layers, layerGroup.temporal_resolution);

    }

    LayerGroup.prototype = {

      constructor: LayerGroup,

      instantiateLayers: function (layers, tempRes) {
        // Instantiate a Layer for every servserside layer of
        // the layergroup. There are layers that are drawn on the
        // map by the map-servie that go in mapLayers, layers that
        // are just used for data purposes are put in dataLayers
        // and layers that do both.
        angular.forEach(layers, function (layer) {
          if (layer.format === 'UTFGrid'
            || layer.format === 'Vector') {
            var nxtLayer = new NxtDataLayer(layer, tempRes);
            this._dataLayers.push(nxtLayer);
            this.mapLayers.push(nxtLayer);
          }
          else if (layer.format === 'Store') {
            this._dataLayers.push(new NxtDataLayer(layer, tempRes));
          }
          else if (layer.format === 'TMS'
            || layer.format === 'WMS') {
            this.mapLayers.push(new NxtLayer(layer, tempRes));
          }
        }, this);
      },

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description toggles a layergroup on the given map.
      * @param  {object} map Leaflet map to toggle this layer on
      */
      toggle: function (map) {
        this._active = !this._active;
        if (this.callbackFns && this.callbackFns.onToggleLayerGroup) {
          this.callbackFns.onToggleLayerGroup(this);
        }
      },

      /**
       * Returns true if the current layerGroup (i.e. "this") is active and false
       * otherwise.
       */
      isActive: function () {
        return this._active;
      },

      /**
       * Returns true iff the current layerGroup (i.e. "this") has only layers
       * with format 'Vector'.
       */
      isEventLayerGroup: function () {
        return this.mapLayers.every(function (mapLayer) {
          return mapLayer.format === 'Vector';
        });
      },

      getColorForEventLayerGroup: function () {
        return this.mapLayers[0].color;
      },

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description Returns a promise that notifies with data for every layer
      *              of the layergroup that is appplicable (i.e: rain and several
      *              vector layers). It resolves when all data is in.
      * @param  {object} geom latLng object with lat and lng properties or a list of
      *                       such objects.
      * @return  {promise} notifies with data per layer and resolves with value true
      *                    when layergroup was active, or false when layergroup was
      *                    inactive.
      */
      getData: function (options) {
        var lgSlug = this.slug,
            lgActive = this._active,
            deferred = $q.defer(),
            promises = [];

        if (!this._active) {
          deferred.resolve({slug: this.slug, active: this._active});
          return deferred.promise;
        }
        else {
          angular.forEach(this._dataLayers, function (layer) {
            promises.push(layer.getData(lgSlug, options, deferred));
          });
        }

        // Bear with me: the promises from the individual getData's(),
        // notify() the defer from LayerGroup.getData() on resolve.
        // When all the individual promises have resolved, this defer
        // should be resolved. It resolves with 'true' to indicate activity
        // of layer. No need to keep a counter of the individual promises.
        $q.all(promises).then(function () {
          deferred.resolve({
            slug: lgSlug,
            active: lgActive
          });
        });

        return deferred.promise;
      },


      /**
       * @function
       * @memberof app.LayerGroup
       * @param {float} new opacity value
       * @return {void}
       * @description Changes opacity in layers that have
       * an opacity to be set
       */
      setOpacity: function (newOpacity) {
        if (typeof newOpacity !== 'number' ||
            newOpacity < 0 && newOpacity > 1) {
          throw new Error(newOpacity + "is not a valid opacity value, it is"
            + "either of the wrong type or not between 0 and 1");
        }
        this._opacity = newOpacity;
        if (this.callbackFns && this.callbackFns.onOpacityChange) {
          this.callbackFns.onOpacityChange(this);
        }
      },

      /**
       * @function
       * @member app.LayerGroup
       * @return {float} opacity from 0 to 1.
       * @description retrieve opacity from layer
       */
      getOpacity: function () {
        return this._opacity;
      },

      /**
       * calls double click callback function when layergroup item in menu
       * is double clicked. Used by the map to rescale.
       */
      dblClick: function () {
        if (this.callbackFns && this.callbackFns.onDblClick) {
          this.callbackFns.onDblClick(this);
        }
      }

    };

    return LayerGroup;
  }
]);

'use strict';


/**
 * @ngdoc service
 * @class NxtData /
 * @memberof app
 * @name NxtData
 * @requires $q, dataLayers, LayerGroup and State
 * @summary Encapsulates layergroups
 * @description NxtData service encapsulates layergroups from the server side
 *              configuration of layergroups. It enables to perform actions
 *              on all layergroups simultaneously. When provided with a string
 *              representation of the service containing the global map it
 *              it performs these actions on the map from this service, else
 *              it needs a map object when calling toggleLayerGroup and
 *              syncTime.
 */

angular.module('data-menu')
  .service('DataService', ['$q', 'dataLayers', 'DataLayerGroup', 'State',
    function ($q, dataLayers, DataLayerGroup, State) {


      /**
       * @function
       * @memberof app.NxtMapService
       * @param  {object} nonLeafLayer object from database
       * @description Throw in a layer as served from the backend
       */
      var createLayerGroups = function (serverSideLayerGroups) {
        var layerGroups = {};
        angular.forEach(serverSideLayerGroups, function (sslg) {
          layerGroups[sslg.slug] = new DataLayerGroup(sslg);
        });
        return layerGroups;
      };

      // Attributes ////////////////////////////////////////////////////////////

      // Event callbacks are used to performa actions on the map when the
      // state of layergroups changes, may contain a onOpacityChange, OnDblClick
      // and on layerGroupToggled callback functions.
      Object.defineProperty(this, 'eventCallbacks', {
        set: function (newCallBacks) {
          DataLayerGroup.prototype.callbackFns = newCallBacks;
        }
      });

      var layerGroups = createLayerGroups(dataLayers);
      this.layerGroups = layerGroups;
      this.baselayerGroups = _.filter(layerGroups, function (lgValue, lgKey) {
        return lgValue.baselayer;
      });


      // Immutable representation of all layergroups set on State.layerGroups
      Object.defineProperty(State.layerGroups, 'all', {
        value: Object.keys(layerGroups),
        writeable: false,
        configurable: false
      });

      // List of slugs of active layerGroups, two-way.
      var instance = this;
      Object.defineProperty(State.layerGroups, 'active', {
        get: function () {
          return Object.keys(layerGroups).filter(function (layerGroup) {
            return layerGroups[layerGroup].isActive();
          });
        },
        set: function (newActivelayerGroups) {
          angular.forEach(layerGroups, function (_lg, slug) {
            if (newActivelayerGroups.indexOf(slug) !== -1 && !_lg.isActive()) {
              this.toggleLayerGroup(_lg);
            } else if (_lg.isActive()) {
              this.toggleLayerGroup(_lg);
            }
          }, instance);
        }
      });

      this._dataDefers = {};


      // Methods //////////////////////////////////////////////////////////////

      /**
       * @function
       * @memberOf app.NxtMap
       * @description Toggles a layergroup when layergroups should be toggled
       *              takes into account that baselayers should toggle eachother
       * @param  layerGroup layergroup that should be toggled
       */
      this.toggleLayerGroup = function (layerGroup) {
        // turn layer group on
        if (!(layerGroup.baselayer && layerGroup.isActive())) {
          layerGroup.toggle();
        }
        if (layerGroup.baselayer) {
          angular.forEach(this.layerGroups, function (_layerGroup) {
            if (_layerGroup.baselayer
              && _layerGroup.isActive()
              && _layerGroup.slug !== layerGroup.slug
              )
            {
              _layerGroup.toggle();
            }
          });
        }
      };

      /**
       * Gets data from all layergroups.
       *
       * @param  {object} options
       * @param  {str} callee that gets a seperate defer.
       * @return {promise} notifies with data from layergroup and resolves when
       *                            all layergroups returned data.
       */
      this.getData = function (callee, options) {
        this.reject(callee);
        this._dataDefers[callee] = $q.defer();
        var defer = this._dataDefers[callee];
        var promises = [];
        angular.forEach(this.layerGroups, function (layerGroup) {
          promises.push(
            layerGroup.getData(options).then(null, null, function (response) {
              defer.notify(response);
            })
          );
        });
        $q.all(promises).then(function () {
          State.layerGroups.gettingData = false;
          defer.resolve();
        });
        State.layerGroups.gettingData = true;
        return defer.promise;
      };

      /**
       * Rejects call for data and sets loading to false.
       */
      this.reject = function (callee) {
        State.layerGroups.gettingData = false;
        if (this._dataDefers[callee]) {
          this._dataDefers[callee].reject();
        }
      };

      /**
       * @function
       * @memberOf app.NxtMap
       * @description Sets the layergroups to the state they came from the
       *              server. Is called by the urlCtrl when no layergroup
       *              info is found on the server
       */
      this.setLayerGoupsToDefault = function () {
        angular.forEach(this.layerGroups, function (layerGroup) {
          if (layerGroup.defaultActive && !layerGroup.isActive()) {
            this.toggleLayerGroup(layerGroup);
          } else if (!layerGroup.defaultActive && layerGroup.isActive()) {
            this.toggleLayerGroup(layerGroup);
          }
        }, this);
      };

    }
  ]);
/**
 * @ngdoc
 * @class areaCtrl
 * @memberOf app
 * @name areaCtrl
 * @description
 * area is the object which collects different
 * sets of aggregation data. If there is no activeObject,
 * this is the default collection of data to be shown in the
 * client.
 *
 * Contains data of all active layers with an aggregation_type
 *
 */
angular.module('data-menu')
  .controller('DatamenuController', ['$scope', 'DataService', 'State',
    function ($scope, DataService, State) {

      this.layerGroups = DataService.layerGroups;

      this.toggleLayerGroup = DataService.toggleLayerGroup;

      this.box = State.box;

      this.enabled = false;

      this.state = State.layerGroups;
    }
  ]);


'use strict';

/**
 * Data menu directive
 *
 * Overview
 * ========
 *
 * Defines the data menu.
 */
angular.module('data-menu')
  .directive('datamenu', [function () {

    var link = function (scope, element, attrs) {
    };


    return {
      link: link,
      restrict: 'E',
      replace: true,
      templateUrl: 'data-menu/data-menu.html'
    };

  }
]);
'use strict';

/**
 * @ngdoc controller
 * @class UrlController
 * @memberof app
 * @name UrlController
 * @summary Sets and gets the url to the state and vice versa.
 * @description UrlController reacts to $locationChangeSucces to read
 * the url and configure lizard-nxt state accordingly. Writes state
 * changes to url. At initial load of app, url leads. Afterwards the
 * state leads the url.
 */
angular.module('lizard-nxt')
.controller('UrlController', [
  '$scope',
  'LocationGetterSetter',
  'UrlState',
  'dataBounds',
  'DataService',
  'MapService',
  'State',
  '$rootScope',
  'LeafletService',
  function (
    $scope,
    LocationGetterSetter,
    UrlState,
    dataBounds,
    DataService,
    MapService,
    State,
    $rootScope,
    LeafletService
  ) {

    // Configuration object for url state.
    var state = {
      context: { // Locally used name for the state
        value: 'map', // default
        part: 'path', // Part of the url where this state is stored,
        index: 0, // Position of the state in the part
      },
      layerGroups: {
        part: 'path',
        index: 1,
      },
      boxType: {
        part: 'path',
        index: 2,
      },
      geom: {
        part: 'path',
        index: 3,
      },
      mapView: {
        part: 'at',
        index: 0,
      },
      timeState: {
        part: 'at',
        index: 1,
      }
    };

   /**
    * @function
    * @memberOf app.UrlController
    * @summary Enables or disables layerGroups on the basis of the url.
    * @description Takes the layerGroups as defined in the url to turn
    *              layerGroups on afterwards it initializes all other
    *              layerGroups. This is done here so MapService does not turn
    *              on layerGroups which are turned of later by this controller.
    * @param {string} String representation of layerGroups on url
    */
    var enablelayerGroups = function (layerGroupString) {
      if (layerGroupString) {
        // Either layerGroups are on url
        State.layerGroups.active = layerGroupString.split(',');
        // Or layerGroups are not on url, turn default layerGroups on
      } else {
        DataService.setLayerGoupsToDefault();
      }
    };

   /**
    * @function
    * @memberOf app.UrlController
    * @summary Sets the mapView on the url or the url on the mapView
    * @description If mapView as string from the url is a parseable
    *              mapView, the map is set to this view. Else the map
    *              is set to bounds of data as defined by the server.
    * @param {string} String representation of mapView on url
    */
    var enableMapView = function (mapView) {
      var map = LeafletService.map('url-temp-map');
      var fn = function () {
        map.fitBounds(LeafletService.latLngBounds(
          L.latLng(dataBounds.south, dataBounds.east),
          L.latLng(dataBounds.north, dataBounds.west)
        ));
      };

      if (mapView) {
        var view = UrlState.parseMapView(mapView);
        if (view) {
          map.setView(view.latLng, view.zoom, {});
        } else {
          fn();
        }
      } else {
        fn();
      }
      State.spatial.bounds =  map.getBounds();
      State.spatial.zoom =  map.getZoom();
      map.remove();
      var tempMap = document.getElementById('url-temp-map');
      tempMap.parentNode.removeChild(tempMap);
    };

    /**
     * set layer(s) when these change.
     */
    $scope.$watch(State.toString('layerGroups.active'),
      function (n, o) {
        if (n === o) { return true; }
        UrlState.setlayerGroupsUrl(state, State.layerGroups.active);
      }
    );

    /**
     * Set location when map moved.
     */
    $scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      UrlState.setCoordinatesUrl(state,
        State.spatial.bounds.getCenter().lat,
        State.spatial.bounds.getCenter().lng,
        State.spatial.zoom
      );
    });

    /**
     * Set timeState when timeState changed.
     */
    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      if (!State.temporal.timelineMoving) {
        UrlState.setTimeStateUrl(
          state,
          State.temporal.start,
          State.temporal.end
        );
      }
    });

    /*
     * Set boxType when box.type changed
     */
    $scope.$watch(State.toString('box.type'), function (n, old) {
      if (n === old) { return true; }
      LocationGetterSetter.setUrlValue(
        state.boxType.part, state.boxType.index, State.box.type
      );

      if (old === 'point' || old === 'line') {
        // Remove geometry from url
        state.boxType.update = false;
        LocationGetterSetter.setUrlValue(
          state.geom.part, state.geom.index, undefined);
      }
    });

    /*
     * Set context when context changed
     */
    $scope.$watch(State.toString('context'), function (n, old) {
      if (n === old) { return true; }
      state.context.update = false;
      LocationGetterSetter.setUrlValue(
        state.context.part, state.context.index, $scope.context
      );
    });

    /**
     * Set geom when mapState.here changed and box.type is point.
     */
    $scope.$watch(State.toString('spatial.here'), function (n, o) {
      if (n === o || State.box.type !== 'point') { return true; }
      state.geom.update = false;
      UrlState.setgeomUrl(state,
                          State.box.type,
                          State.spatial.here,
                          State.spatial.points);
    });

    /**
     * Set geom when mapState.points changed and box.type is line.
     */
    $scope.$watch(State.toString('spatial.points'), function (n, o) {
      if (n === o || State.box.type !== 'line') { return true; }
      UrlState.setgeomUrl(state,
        State.box.type,
        State.spatial.here,
        State.spatial.points
      );
    });

    /**
     * Listener to update map view when user changes url
     *
     * $locationChangeSucces is broadcasted by angular
     * when the hashSyncHelper in util-service changes the url
     */

    // $locationChangeSuccess is fired once when this controller is initialized.
    // We might move the time, so we set it to true, and the $on
    // $locationChangeSuccess sets it back to false to trigger the the rest of
    // the app to update to the time of the url.
    State.temporal.timelineMoving = true;

    var listener = $scope.$on('$locationChangeSuccess', function (e, oldurl, newurl) {
      var boxType = LocationGetterSetter.getUrlValue(state.boxType.part, state.boxType.index),
        geom = LocationGetterSetter.getUrlValue(state.geom.part, state.geom.index),
        layerGroupsFromURL = LocationGetterSetter.getUrlValue(state.layerGroups.part, state.layerGroups.index),
        mapView = LocationGetterSetter.getUrlValue(state.mapView.part, state.mapView.index),
        time = LocationGetterSetter.getUrlValue(state.timeState.part, state.timeState.index),
        context = LocationGetterSetter.getUrlValue(state.context.part, state.context.index);

      if (context) {
        State.context = context;
      } else {
        LocationGetterSetter.setUrlValue(state.context.part, state.context.index, state.context.value);
      }
      if (boxType) {
        State.box.type = boxType;
      } else {
        LocationGetterSetter.setUrlValue(state.boxType.part, state.boxType.index, State.box.type);
      }
      if (geom) {
        State.spatial = UrlState.parseGeom(State.box.type, geom, State.spatial);
      }
      enablelayerGroups(layerGroupsFromURL);
      enableMapView(mapView);

      if (time) {
        State.temporal = UrlState.parseTimeState(time, State.temporal);
      } else {
        state.timeState.update = false;
        UrlState.setTimeStateUrl(state, State.temporal.start, State.temporal.end);
      }
      State.temporal.timelineMoving = false;

      listener(); // remove this listener
    });

  }
]);


/**
 * @class LocationGetterSetter
 * @memberOf app
 *
 * @summary Lower level service to set $location.
 *
 * @description
 * Provides a setter and getter function to manipulate parts of the url to
 * keep the url synchronised with the actual application state. That way
 * you can use the url to share application state.
 */
angular.module('lizard-nxt')
  .service('LocationGetterSetter', ['$location', function ($location) {

    var _getPath, _getPathParts,

    service = {

     /**
      * @function
      * @memberOf angular.module('lizard-nxt').LocationGetterSetter
      * @description returns the value in the path of url at the specified part
      * @param {str} part, part url looking for currently <path | @>
      * @param {str} index location in the part
      * @return {str} value
      */
      getUrlValue: function (part, index) {
        if (!(part === 'path' || part === 'at')) {
          throw new Error(String(part) + ' is not a supported part of the url');
        }
        var pathParts = _getPathParts(part);
        var value = pathParts[index] === '' ? undefined : pathParts[index];
        return value;
      },

     /**
      * @function
      * @memberOf angular.module('lizard-nxt').LocationGetterSetter
      * @description sets the value in the path of url at the specified part
      * @param {str} part, part url looking for currently <path | @>
      * @param {str} index location in the part
      * @param {str} value
      */
      setUrlValue: function (part, index, value) {
        if (!(part === 'path' || part === 'at')) {
          throw new Error(String(part) + ' is not a supported part of the url');
        }
        if (value && !(typeof(value) === 'string' || typeof(value) === 'number')) {
          throw new Error(String(value) + ' cannot be set on the url');
        }
        var halfPath, otherHalf, parts = _getPathParts(part);
        if (!value && parts.length - 1 === index) {
          parts.splice(index, 1); // remove if no value and index is last one.
        } else {
          parts[index] = value; //replace
        }
        halfPath = parts.join('/');
        if (part === 'path') {
          otherHalf = _getPath('at') ? '@' + _getPath('at') : '';
          $location.path('/' + halfPath + otherHalf);
        } else {
          otherHalf = _getPath('path') ? _getPath('path') + '@' : '@';
          $location.path('/' + otherHalf + halfPath);
        }
      }
    };

   /**
    * @function
    * @memberOf angular.module('lizard-nxt')
  .LocationGetterSetter
    * @description returns the part of the path without first slash.
    * @param {str} part, part url looking for currently <path | @>
    * @return {str} the part the path.
    */
    _getPath = function (part) {

      var paths,
          pathPart,
          path = $location.path();

      paths = path.split('@'); //splits path in two at the @.
      pathPart = paths[part === 'path' ? 0 : 1] || ''; //gets before @ when 'path' after when 'at'
      // we do not want the first slash
      pathPart = part === 'path' ? pathPart.slice(1) : pathPart;
      return pathPart;
    };

   /**
    * @function
    * @memberOf angular.module('lizard-nxt')
  .LocationGetterSetter
    * @description splits the part of the path further in individual values.
    * @param {str} part of the path without first slash.
    * @return {array} the values in the part of the path.
    */
    _getPathParts = function (part) {
      var pathPart = _getPath(part);
      if (!pathPart) { return []; }
      return pathPart.split('/');
    };
    return service;
  }]);


/**
 * @ngdoc service
 * @class UrlState
 * @name UrlState
 * @description Higher level functions to parse and set URL.
 */
angular.module('lizard-nxt')
  .service("UrlState", ["LocationGetterSetter", "UtilService", function (LocationGetterSetter, UtilService) {

    // Amount of decimals of coordinates stored in url.
    var COORD_PRECISION = 4;

    var service = {

     /**
      * @function
      * @memberOf angular.module('lizard-nxt').UrlState
      * @description Sets the points or the here on the url when
      *              respectively point or line is specified as type.
      * @param {object} state config object
      * @param {str} type box.type
      * @param {object} here leaflet LatLng object
      * @param {array} points array of leaflet LatLng objects
      */
      setgeomUrl: function (state, type, here, points) {
        var pointsStr = '';
        if (type === 'line') {
          angular.forEach(points, function (point) {
            pointsStr += point.lat.toFixed(COORD_PRECISION) + ',' + point.lng.toFixed(COORD_PRECISION) + '-';
          });
          pointsStr = pointsStr.substring(0, pointsStr.length - 1);
        } else {
          pointsStr = here === undefined
            ? ''
            : here.lat.toFixed(COORD_PRECISION) + ',' + here.lng.toFixed(COORD_PRECISION);
        }
        LocationGetterSetter.setUrlValue(state.geom.part, state.geom.index, pointsStr);
      },

     /**
      * @function
      * @memberOf angular.module('lizard-nxt')
  .UrlState
      * @description Sets the start and end epoch ms on the url
      * @param {object} state config object
      * @param {int} start time in ms
      * @param {int} end time in ms
      */
      setTimeStateUrl: function (state, start, end) {
        var startDate = new Date(start);
        var endDate = new Date(end);
        var startDateString = startDate.toDateString()
          .slice(4) // Cut off day name
          .split(' ') // Replace spaces by hyphens
          .join(',');
        var endDateString = endDate.toDateString()
          .slice(4) // Cut off day name
          .split(' ') // Replace spaces by hyphens
          .join(',');
        LocationGetterSetter.setUrlValue(
          state.timeState.part,
          state.timeState.index,
          startDateString + '-' + endDateString);
      },

     /**
      * @function
      * @memberOf angular.module('lizard-nxt')
  .UrlState
      * @description Sets the mapView coordinates on the url.
      * @param {object} state config object
      * @param {object} lat leaflet Latitude object
      * @param {object} lng leaflet Lng object
      * @param {int} zoom level
      */
      setCoordinatesUrl: function (state, lat, lng, zoom) {
        var COORD_PRECISION = 4;
        var newHash = [
          lat.toFixed(COORD_PRECISION),
          lng.toFixed(COORD_PRECISION),
          zoom
        ].join(',');
        LocationGetterSetter.setUrlValue(
          state.mapView.part,
          state.mapView.index,
          newHash);
      },

      /**
       * @function
       * @memberOf angular.module('lizard-nxt')
  .UrlState
       * @description Sets the layer slugs on the url.
       * @param {object} state config object
       * @param {object} layerGroups list
       */
      setlayerGroupsUrl: function (state, layerGroups) {
        if (layerGroups === undefined) { return; }
        LocationGetterSetter.setUrlValue(
          state.layerGroups.part,
          state.layerGroups.index,
          layerGroups.toString()
        );
      },
      /**
       * @function
       * @memberOf angular.module('lizard-nxt')
  .UrlState
       * @description Sets the layer slugs on the url.
       * @param  {str} time time value of the url
       * @param  {object} timeState nxt timeState
       * @return {object} nxt timeState
       */
      parseTimeState: function (time, timeState) {
        // Browser independent. IE requires datestrings in a certain format.
        var times = time.replace(/,/g, ' ').split('-');
        var msStartTime = Date.parse(times[0]);
        // bail if time is not parsable, but return timeState
        if (isNaN(msStartTime)) { return timeState; }
        timeState.start = msStartTime;

        var msEndTime = Date.parse(times[1]);
        if (isNaN(msEndTime)) { return timeState; }
        if (msEndTime === timeState.start) {
          msEndTime += 43200000; // half a day
        }
        timeState.end = msEndTime;
        timeState.aggWindow = UtilService.getAggWindow(
          timeState.start,
          timeState.end,
          UtilService.getCurrentWidth()
        );
        var timeAt = timeState.start + (timeState.end - timeState.start) / 2;
        timeState.at = UtilService.roundTimestamp(
          timeAt,
          timeState.aggWindow,
          true
        );
        return timeState;
      },
      /**
       * @function
       * @memberOf angular.module('lizard-nxt')
  .UrlState
       * @description returns the mapview value parsed to
       *              latlonzoom
       * @param  {str} mapView
       * @return {object_or_false} Lat lon zoom object or false
       *                               when not valid.
       */
      parseMapView: function (mapView) {
        var latlonzoom = mapView.split(',');
        if (latlonzoom.length === 3
          && parseFloat(latlonzoom[0])
          && parseFloat(latlonzoom[1])
          && parseFloat(latlonzoom[2])) {
          return {
            latLng: [parseFloat(latlonzoom[0]), parseFloat(latlonzoom[1])],
            zoom: parseFloat(latlonzoom[2]),
            options: {reset: true, animate: true}
          };
        } else {
          return false;
        }
      },
      parseGeom: function (type, geom, mapState) {
        if (type === 'point') {
          var point = geom.split(',');
          if (parseFloat(point[0]) &&
              parseFloat(point[1])) {
            mapState.here = L.latLng(point[0], point[1]);
          }
        } else if (type === 'line') {
          var points = geom.split('-');
          angular.forEach(points, function (pointStr, key) {
            var point = pointStr.split(',');
            if (parseFloat(point[0]) &&
                parseFloat(point[1])) {
              mapState.points[key] = L.latLng(point[0], point[1]);
            }
          });
        }
        return mapState;
      },
      setUrlHashWhenEmpty: function (state, type, mapState, timeState) {

        if (!LocationGetterSetter.getUrlValue(state.context.part, state.context.index)) {
          LocationGetterSetter.setUrlValue(
            state.context.part,
            state.context.index,
            state.context.value);
        }

        if (!LocationGetterSetter.getUrlValue(state.boxType.part, state.boxType.index)) {
          LocationGetterSetter.setUrlValue(
            state.boxType.part,
            state.boxType.index,
            type);
        }
        if (!LocationGetterSetter.getUrlValue(state.layerGroups.part, state.layerGroups.index)) {
          this.setlayerGroupsUrl(mapState.layerGroups);
        }
        if (!LocationGetterSetter.getUrlValue(state.mapView.part, state.mapView.index)) {
          this.setCoordinatesUrl(state,
            mapState.center.lat,
            mapState.center.lng,
            mapState.zoom);
        }
        if (!LocationGetterSetter.getUrlValue(state.timeState.part, state.timeState.index)) {
          this.setTimeStateUrl(state, timeState.start, timeState.end);
        }
      },
      update: function (state) {
        var u = true;
        angular.forEach(state, function (value) {
          if (!value.update) {
            u = false;
          }
        });
        return u;
      }
    };

    return service;

  }
]);

angular.module('map', [
  'global-state',
  'data-menu'
]);

'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 *
 * Non tiled wms layers use a bounding box to make request to a wms for one tile
 * which is displayed as a leaflet image overlay. Nxt-non-tiled-wms-layer is
 * used to create a wms layer that is animatable. When synced to time, it builds
 * a buffer of images, fills the buffer with new images or turns one of the
 * images from the buffer on and start loading a new image in the place of the
 * previous.
 * 
 * Usage: add animation functionality to an instance NxtLayer by using
 * NxtNonTiledWMSLayer.create(<layer>);
 * 
 */
angular.module('map')
.factory('NxtNonTiledWMSLayer', [
  'NxtLayer',
  'LeafletService',
  'RasterService',
  'UtilService',
  '$http',
  '$q',
  function (NxtLayer, LeafletService, RasterService, UtilService, $http, $q) {

      /**
       * @description Adds new imageoverlays.
       * @param  {L.Map} map.
       * @param  {overlays} overlays current overlays to add to.
       * @param  {bounds} bounds   bounds of overlays.
       * @param  {int} buffer   amount of imageOverlays to include.
       * @return {array} array of L.imageOverlays.
       */
      var createImageOverlays = function (map, overlays, bounds, buffer) {
        for (var i = overlays.length - 1; i < buffer; i++) {
          overlays.push(
            addLeafletLayer(map, L.imageOverlay('', bounds))
          );
        }
        return overlays;
      };

      /**
       * @function
       * @memberof app.LayerGroup
       * @param {L.Class} Leaflet layer.
       * @description Adds layer to map
       */
      var addLeafletLayer = function (map, leafletLayer) { // Leaflet NxtLayer
        if (map.hasLayer(leafletLayer)) {
          throw new Error(
            'Attempted to add layer' + leafletLayer._id
            + 'while it was already part of the map'
          );
        } else {
          map.addLayer(leafletLayer);
        }
        return leafletLayer;
      };

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {L.Class} Leaflet map
       * @param  {L.Class} Leaflet layer
       * @description Removes layer from map
       */
      var removeLeafletLayer = function (map, leafletLayer) { // Leaflet NxtLayer
        if (map.hasLayer(leafletLayer)) {
          map.removeLayer(leafletLayer);
        } else {
          throw new Error(
            'Attempted to remove layer' + leafletLayer._id
            + 'while it was NOT part of provided the map'
          );
        }
      };

      var determineImageBounds = function (bounds) {
        var southWest = L.latLng(
          bounds.south,
          bounds.west
        ),
        northEast = L.latLng(
          bounds.north,
          bounds.east
        );
        return L.latLngBounds(southWest, northEast);
      };


      return {
        create: function (layer) {

          // Array of imageoverlays used as buffer.
          Object.defineProperty(layer, '_imageOverlays', {
            value: [],
            writable: true,
          });
          // Base of the image url without the time.
          Object.defineProperty(layer, '_imageUrlBase', {
            value: RasterService.buildURLforWMS(layer),
            writable: true,
          });
          // Formatter used to format a data object.
          Object.defineProperty(layer, '_formatter', {
            value: d3.time.format.utc("%Y-%m-%dT%H:%M:%S"),
            writable: true,
          });
          // Lookup to store which data correspond to which imageOverlay.
          Object.defineProperty(layer, '_frameLookup', {
            value: {},
            writable: true,
          });
          // Length of the buffer, set in the initialization. Ideally the buffer
          // is small to get up to speed fast, for slow connections or high
          // frequent images it should be large. When having a very sparse
          // resolution, animation will also move slowly, so there is no need
          // for a big buffer.
          Object.defineProperty(layer, '_bufferLength', {
            value: layer._temporalResolution >= 3600000 ? 2 : 10,
            writable: true,
          });
          // Geographic bounds of the image.
          Object.defineProperty(layer, '_imageBounds', {
            value: determineImageBounds(layer.bounds),
            writable: true,
          });
          // Number of rasters currently underway.
          Object.defineProperty(layer, '_nLoadingRasters', {
            value: 0,
            writable: true,
          });

          angular.extend(layer, {

            /**
             * @description Adds one imageOverlay with the current time to the map.
             * @return a promise that resolves when the image has loaded. Usefull
             *         for sequential loading of layers.
             */
            add: function (map) {

              var defer = $q.defer(),
                  opacity = this._opacity,
                  date = new Date(this._mkTimeStamp(this.timeState.at)),
                  imageUrl = this._imageUrlBase + this._formatter(date);

              this._imageOverlays = [
                LeafletService.imageOverlay(
                  imageUrl,
                  this._imageBounds,
                  {opacity: opacity}
                )
              ];

              this._addLoadListener(
                this._imageOverlays[0].addTo(map),
                this.timeState.at,
                defer
              );

              return defer.promise;
            },

            /**
             * @summary    Sets the new timeState on the layer. And updates the layer
             *             to the new time.
             *
             * @decription When there are not enough imageOverlays, more overlays
             *             are added to the map. The curent timeState.at is rounded
             *             to the nearest date value present on the wms server. The
             *             currentDate value is used to lookup the index of the
             *             frame in the _frameLookup. The _frameLookup contains all
             *             the dates that are present in the buffer and the index
             *             of the imageoverlay it is stored on:
             *
             *               { <date in ms from epoch> : <index on _imageOverlays> }
             *
             *               length is 0, 1 or _bufferLength.
             *
             *             The date is either: 1. present in the lookup in case the
             *             index is defined or 2. not present in case this frame is
             *             not loaded yet.
             *
             *             When 1. The imageOverlay with index <currentOverlayIndex>
             *             is set to _opacity and the defer is resolved. The image
             *             sources of the _imageOverlays with opacity !== 0 are set
             *             to the next date not in the _frameLookup, the opacity is
             *             set to 0 and the reference is removed from the
             *             _frameLookup. A loadListener adds a new reference to the
             *             _frameLookup when the layer finishes loading a new frame.
             *
             *             When 2. All references are removed and all layers get a
             *             new source. When the new source is different than the one
             *             it currently has, the loadListener is removed and a new
             *             one source and loadlistener are added. When all layers
             *             have loaded, the first layer's opacity is set to _opacity
             *             and the defer is resolved.
             *
             * @parameter timeState nxt object containing current time on at.
             * @parameter map leaflet map to add layers to.
             *
             * @return a promise that resolves when the layer has finished
             *         syncing. It is considered finished when it finishes loading
             *         a new buffer or when it was able to set a new frame from its
             *         buffer.
             */
            syncTime: function (timeState, map) {
              this.timeState = timeState;

              // this only works for stores with different aggregation levels
              // for now this is only for the radar stores
              if (this.slug.split('/')[0] === 'radar') {
                // change image url based on timestate.
                this._imageUrlBase = RasterService.buildURLforWMS(
                    this,
                    this._determineStore(timeState).name
                    );
                this._temporalResolution = this._determineStore(timeState).resolution;
              }

              var defer = $q.defer(),
                  currentDate = this._mkTimeStamp(timeState.at),
                  currentOverlayIndex = this._frameLookup[currentDate];

              if (this._imageOverlays.length < this._bufferLength) {
                // add leaflet layers to fill up the buffer
                this._imageOverlays = createImageOverlays(
                  map,
                  this._imageOverlays,
                  this._imageBounds,
                  this._bufferLength
                );
              }

              if (currentOverlayIndex === undefined) {
                // Ran out of buffered frames
                this._imageOverlays = this._fetchNewFrames(
                  currentDate,
                  this._imageOverlays,
                  defer
                );
              }

              else {
                this._progressFrame(currentOverlayIndex);
                // Done!
                defer.resolve();
              }

              return defer.promise;
            },

            /**
             * @description removes all _imageOverlays from the map. Removes
             *              listeners from the _imageOverlays, the _imageOverlays
             *              from this layer and removes the references to
             *              the _imageOverlays.
             */
            remove: function (map) {
              for (var i in this._imageOverlays) {
                if (map.hasLayer(this._imageOverlays[i])) {
                  this._imageOverlays[i].off('load');
                  map.removeLayer(this._imageOverlays[i]);
                }
              }
              this._imageOverlays = [];
              this._frameLookup = {};
            },

            /**
             * @description sets the provided opacity to the layer and all the
             *              _imageOverlays that have an opacity other than 0. Sets
             *              the opacity to nearly 0 when the provided opacity is
             *              exactly 0 in order to distinguish layers that are off
             *              and layers that have are transparant.
             */
            setOpacity: function (opacity) {
              if (opacity === 0) { opacity = 0.1; }
              this._opacity = opacity;
              angular.forEach(this._frameLookup, function (frameIndex) {
                if (this._imageOverlays[frameIndex].options.opacity !== 0) {
                  this._imageOverlays[frameIndex].setOpacity(this._opacity);
                }
              }, this);
              return;
            },

            /**
             * Local helper that returns a rounded timestamp
             */
            _mkTimeStamp: function (t) {
              var result = UtilService.roundTimestamp(t, this._temporalResolution, false);
              return result;
            },
            
            /**
             * @description based on the temporal window. The time between
             * timestate.start and timestate.end determines which store is to be used.
             * This only works for radar stuff.
             *
             */
            _determineStore: function (timeState) {
              var resolutionHours = (timeState.aggWindow) / 60 / 60 / 1000;

              var aggType = this.slug.split('/');

              if (resolutionHours >= 24) {
                aggType[1] = 'day';
              } else if (resolutionHours >= 1 && resolutionHours < 24) {
                aggType[1] = 'hour';
              } else {
                aggType[1] = '5min';
              }
              var resolutions = {
                '5min': 300000,
                'hour': 3600000,
                'day': 86400000
              }; 

              return {
                name: aggType.join('/'),
                  resolution: resolutions[aggType[1]]
              }

            },


            /**
             * @description Removes old frame by looking for a frame that has an
             *              opacity that is not 0 and setting it to 0, deleting it
             *              from the lookup and replacing the image source. NewFrame
             *              is turned on by setting opacity to _opacity.
             * @param {int} currentOverlayIndex index of the overlay in
             *              _imageOverlays.
             */
            _progressFrame: function (currentOverlayIndex) {
              angular.forEach(this._frameLookup, function (frameIndex, key) {

                if (this._imageOverlays[frameIndex].options.opacity !== 0
                  && frameIndex !== currentOverlayIndex) {
                  // Delete the old overlay from the lookup, it is gone.
                  delete this._frameLookup[key];
                  this._replaceUrlFromFrame(frameIndex);
                }
              }, this);

              var newFrame = this._imageOverlays[currentOverlayIndex];
              // Turn on new frame
              newFrame.setOpacity(this._opacity);
            },

            /**
             * @description Replaces the image source of the provided frame. Turns
             *              frame off by setting opacity to 0. When new url is
             *              different from previous, removes loadlistener, replaces
             *              url and adds new loadlistener. When new url is the same
             *              puts the old one back in the frameLookup and turns it
             *              back on when thge first of the list. When defer is
             *              provided passes it on the loadlistener that resolves it
             *              whenn all layers finished loading.
             * @param {int} currentOverlayIndex index of the overlay in
             * @param {defer} defer <optional> gets resolved when image is loaded
             *                      and _nLoadingRasters === 0.
             */
            _replaceUrlFromFrame: function (frameIndex, defer) {
              var url = this._imageUrlBase + this._formatter(new Date(this._nxtDate));
              var frame = this._imageOverlays[frameIndex];
              frame.off('load');
              frame.setOpacity(0);
              if (url !== frame._url) {
                this._addLoadListener(frame, this._nxtDate, defer);
                frame.setUrl(url);
              }
              else {
                var index = this._imageOverlays.indexOf(frame);
                this._frameLookup[this._nxtDate] = index;
                if (index === 0) {
                  this._imageOverlays[0].setOpacity(this._opacity);
                }
              }
              this._nxtDate += this._temporalResolution;
            },

            /**
             * @description Removes all references, sets _nLoadingRasters to 0. And
             *              calls replaceUrlFromFrame for every frame in the
             *              provided overlays
             *
             * @param {int} currentData in ms from epoch
             * @param {array} overlays L.ImageOverlay s
             * @param {defer} defer that gets resolved when all frames finished
             *                      loading.
             */
            _fetchNewFrames: function (currentDate, overlays, defer) {
              this._nxtDate = currentDate;
              this._frameLookup = {};
              this._nLoadingRasters = 0;

              angular.forEach(overlays, function (overlay, i) {
                this._replaceUrlFromFrame(i, defer);
              }, this);

              return overlays;
            },

            /**
             * @description Adds loadlistener to the provided overlay. On load a
             *              reference to the image is added to the _frameLookup,
             *              turns first layer on when defer was provided and
             *              resolves defer when provided and all images are loaded.
             * @param {L.ImageOverlay} overlay to add listener to
             * @param {int} data in ms from epoch the overlay belongs to.
             * @param {object} defer defer to resolve when all layers finished
             *                       loading.
             */
            _addLoadListener: function (overlay, date, defer) {
              this._nLoadingRasters++;
              overlay.addOneTimeEventListener("load", function () {
                this._nLoadingRasters--;
                var index = this._imageOverlays.indexOf(overlay);
                this._frameLookup[date] = index;
                if (defer && index === 0) {
                  this._imageOverlays[0].setOpacity(this._opacity);
                }
                if (defer && this._nLoadingRasters === 0) {
                  defer.resolve();
                }
              }, this);
            }
          });

          return layer;

        }

      };

    }
  ]);

'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
  .factory('NxtMapLayer', ['$q', '$http', function ($q, $http) {

      return {

        add: function (map) {
          var defer = $q.defer();
          if (this._leafletLayer) {
            // Vector layers need a timeState when added.
            this._leafletLayer.timeState = this.timeState;
            this._addLeafletLayer(map, this._leafletLayer);
            this._leafletLayer.on('load', function () {
              defer.resolve();
            });
          }
          else {
            defer.resolve();
          }
          return defer.promise;
        },

        remove: function (map) {
          if (this._leafletLayer) {
            this._removeLeafletLayer(map, this._leafletLayer);
          }
        },

        /**
         * @function
         * @description rescales layer and updates url
         */
        rescale: function (bounds) {
          if (this.rescalable) {
            var url = this.url +
              '?request=getlimits&layers=' + this.slug +
              '&width=16&height=16&srs=epsg:4326&bbox=' +
              bounds.toBBoxString();
            var self = this;
            $http.get(url).success(function (data) {
              self.limits = ':' + data[0][0] + ':' + data[0][1];
              self._leafletLayer.setParams({
                styles: self.options.styles + self.limits
              });
              self._leafletLayer.redraw();
            });
          }
        },

        setOpacity: function (opacity) {
          if (this._leafletLayer && this._leafletLayer.setOpacity) {
            this._leafletLayer.setOpacity(opacity);
          }
        },

        syncTime: function (timeState) {
          if (this.format !== 'Vector') { return; }
          var defer = $q.defer();
          this._leafletLayer.syncTime(timeState);
          defer.resolve();
          return defer.promise;
        },

        /**
         * @function
         * @memberof app.layerService
         * @param  {L.Class} Leaflet map
         * @param  {L.Class} Leaflet layer
         * @description Removes layer from map
         */
        _addLeafletLayer: function (map, leafletLayer) {
          if (map.hasLayer(leafletLayer)) {
            throw new Error(
              'Attempted to add layer' + leafletLayer._id
              + 'while it was already part of the map'
            );
          } else {
            map.addLayer(leafletLayer);
          }
        },

        /**
         * @function
         * @memberof app.layerService
         * @param  {L.Class} Leaflet map
         * @param  {L.Class} Leaflet layer
         * @description Removes layer from map
         */
        _removeLeafletLayer: function (map, leafletLayer) { // Leaflet NxtLayer
          if (map.hasLayer(leafletLayer)) {
            map.removeLayer(leafletLayer);
          }
        }

      };

    }
  ]);

'use strict';

/**
 * @ngdoc service
 * @class MapService
 * @memberof app
 * @name MapService
 * @requires NxtMap
 * @summary stores global NxtMap instance of the app.
 */

angular.module('map')
.service('MapService', ['$rootScope', '$q', 'LeafletService', 'LeafletVectorService', 'DataService', 'NxtNonTiledWMSLayer', 'NxtMapLayer', 'State',
  function ($rootScope, $q, LeafletService, LeafletVectorService, DataService, NxtNonTiledWMSLayer, NxtMapLayer, State) {

    var service = {

      _map: {}, // exposure is legacy, we should not mingle with the leaflet
                // map instance outside of the map component.

      /**
       * Initializes the map service
       * @param  {DOMelement} element      used by leaflet as the map container.
       * @param  {object} mapOptions       passed to leaflet for the map
       * @param  {object} eventCallbackFns used on leaflet map events [onmove etc]
       */
      initializeMap: function (element, mapOptions, eventCallbackFns) {
        service._map = createLeafletMap(element, mapOptions);
        initializeLayers(State.temporal);
        this._initializeNxtMapEvents(eventCallbackFns);
        DataService.eventCallbacks = {
          onToggleLayerGroup: this._toggleLayers,
          onOpacityChange: this._setOpacity,
          onDblClick: this._rescaleContinuousData
        };
        // Turn active layergroups on.
        angular.forEach(State.layerGroups.active, function (lgSlug) {
          this._toggleLayers(DataService.layerGroups[lgSlug]);
        }, this);
      },

      /**
       * Syncs all layer groups to provided timeState object.
       * @param  {object} timeState   State.temporal object, containing start,
       *                              end, at and aggwindow.
       * @param  {leaflet map} optionalMap map object to sync the data to.
       * @return {promise}             promise that resolves layergroups synced.
       */
      syncTime: function (timeState) {
        var defer = $q.defer();
        var promises = [];
        angular.forEach(DataService.layerGroups, function (layerGroup) {
          if (layerGroup.isActive()) {
            angular.forEach(layerGroup.mapLayers, function (layer) {
              promises.push(layer.syncTime(timeState, service._map));
            });
          } else {
            angular.forEach(layerGroup.mapLayers, function (layer) {
              layer.timeState = timeState;
            });
          }
        });
        var that = this;
        $q.all(promises).then(function () {
          State.layerGroups.timeIsSyncing = false;
          defer.resolve();
          return defer.promise;
        });
        State.layerGroups.timeIsSyncing = true;
        return defer.promise;
      },

      /**
       * @function
       * @memberOf map.MapService
       * @description sets leaflet View based on panZoom
       * @param {object} panZoom Hashtable with, lat, lng, zoom
       */
      setView: function (panZoom) {
        if (panZoom.hasOwnProperty('lat') &&
            panZoom.hasOwnProperty('lng') &&
            panZoom.hasOwnProperty('zoom'))
        {
          service._map.setView(new LeafletService.LatLng(
            panZoom.lat, panZoom.lng), panZoom.zoom);
        } else {
          service._map.setView.apply(service._map, arguments);
        }
      },

      /**
       * @function
       * @memberOf map.MapService
       * @description fits leaflet to extent
       * @param  {array} extent Array with NW, NE, SW,SE
       */
      fitBounds: function (bounds) {
        if (service._map instanceof LeafletService.Map) {
          if (bounds instanceof LeafletService.LatLngBounds) {
            service._map.fitBounds(bounds);
          }
          else if (bounds.hasOwnProperty('south')
            && bounds.hasOwnProperty('north')
            && bounds.hasOwnProperty('east')
            && bounds.hasOwnProperty('west')) {
            service._map.fitBounds(L.latLngBounds(
              L.latLng(bounds.south, bounds.east),
              L.latLng(bounds.north, bounds.west)));
          }
        }
      },

      /**
       * @description legacy function.
       */
      latLngToLayerPoint: function (latlng) {
        return service._map.latLngToLayerPoint(latlng);
      },

      /**
       * @function
       * @memberOf map.MapService
       * @description Initiate map events
       * @return {void}
       */
      _initializeNxtMapEvents: function (cbs) {
        var map = service._map;
        var conditionalApply = function (fn, e) {
          if (!$rootScope.$$phase) {
            $rootScope.$apply(fn(e, map));
          } else {
            fn(e, map);
          }
        };

        map.on('click',     function (e) { conditionalApply(cbs.onClick, e); });
        map.on('movestart', function (e) { conditionalApply(cbs.onMoveStart, e); });
        map.on('mousemove', function (e) { conditionalApply(cbs.onMouseMove, e); });
        map.on('moveend',   function (e) { conditionalApply(cbs.onMoveEnd, e); });
      },

      /**
       * @function
       * @memberOf map.MapService
       * @param  {L.Class} Leaflet map
       * @param  {L.Class} Leaflet layer
       * @description Removes layer from map
       */
      addLeafletLayer: function (leafletLayer) {
        if (service._map.hasLayer(leafletLayer)) {
          throw new Error(
            'Attempted to add layer' + leafletLayer._id
            + 'while it was already part of the map'
          );
        } else {
          service._map.addLayer(leafletLayer);
        }
      },

      /**
       * @function
       * @memberOf map.MapService
       * @param  {L.Class} Leaflet map
       * @param  {L.Class} Leaflet layer
       * @description Removes layer from map
       */
      removeLeafletLayer: function (leafletLayer) { // Leaflet NxtLayer
        if (service._map.hasLayer(leafletLayer)) {
          service._map.removeLayer(leafletLayer);
        }
      },


      _toggleLayers: function (lg) {
        if (lg.isActive() && lg.mapLayers.length > 0) {
          addLayersRecursively(service._map, lg.mapLayers, 0);
        }
        else {
          angular.forEach(lg.mapLayers, function (layer) {
            if (layer._leafletLayer) {
              layer._leafletLayer.off('load');
              layer._leafletLayer.off('loading');
            }
            layer.remove(service._map);
          });
        }
        if (lg.getOpacity()) {
          angular.forEach(lg.mapLayers, function (layer) {
            layer.setOpacity(lg.getOpacity());
          });
        }
      },

      /**
       * @memberOf map.MapService
       * @param {object} layer passed
       * @description determine if raster layer can be rescaled
       */
      _rescaleContinuousData: function (lg) {
        var bounds = service._map.getBounds();
        angular.forEach(lg.mapLayers, function (layer) {
          layer.rescale(bounds);
        });
      },


      /**
       * @function
       * @memberOf map.MapService
       * @param {float} new opacity value
       * @return {void}
       * @description Changes opacity in layers that have
       * an opacity to be set
       */
      _setOpacity: function (lg) {
        if (lg.isActive()) {
          angular.forEach(lg.mapLayers, function (layer) {
            layer.setOpacity(lg.getOpacity());
          });
        }
      },

    };



    /**
     * @function
     * @memberOf map.MapService
     * @param  {array} Array of nxt layers
     * @return {array} Array of object sorted by property loadOrder in
     *                 descending order.
     * @description Sorts layers by descending loadOrder
     */
    var sortLayers = function (layers) {
      layers.sort(function (a, b) {
        if (a.loadOrder > b.loadOrder) {
          return -1;
        }
        if (a.loadOrder < b.loadOrder
          || a.loadOrder === null) {
          return 1;
        }
        // a must be equal to b
        return 0;
      });
      return layers;
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {object} map Leaflet map to add layers to
     * @param  {array} Array of nxt layers
     * @param  {int} i index to start from
     * @description Adds the layers with the loadorder of layers[i]. Catches
     *              the returned promises and calls itself with the nxt index.
     *              When all layers are loaded it adds a listener to the last
     *              layer with the highest loadOrder.
     */
    var addLayersRecursively = function (map, layers, i) {
      var currentLoadOrder = layers[i].loadOrder;
      // Wrap contains the promises and the nxt index.
      var wrap = loadLayersByLoadOrder(map, layers, i, currentLoadOrder);
      // If there is more, wait for these layers to resolve
      // and start over with the remaining layers.
      if (wrap.i < layers.length) {
        startOverWhenDone(wrap.promises, map, layers, wrap.i);
      }
      // When done, add listener to the last layer with the max loadOrder
      // that is drawn on the map.
      else if (layers.length > 1) {
        var index = getIndexOfLeadingLayer(layers);
        if (typeof(index) === 'number') {
          addLoadListenersToLayer(map, layers, index);
        }
      }
    };


    /**
     * @function
     * @memberOf map.MapService
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @param  {inte} loadOrder Current load order to add layers.
     * @return {object} next index and list of promises that resolve when layer
     *                       is fully loaded.
     * @description Adds the layers from index i with the given loadorder to the
     *              map. Returns the current index and a list of promises for
     *              all the added layers when a layer with a lower loadorder is
     *              found.
     */
    var loadLayersByLoadOrder = function (map, layers, i, loadOrder) {
      // Add all layers with the current load order
      var promises = [];
      while (i < layers.length
        && layers[i].loadOrder === loadOrder) {
        promises.push(layers[i].add(map));
        i++;
      }
      return {
        i: i,
        promises: promises
      };
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {array} layers Array of nxt layers.
     * @return {int} Index of the last layer with the highest loadOrder.
     * @description Loops through the sorted layers and returns the index of the
     *              last layer in the array with the highest loadOrder.
     */
    var getIndexOfLeadingLayer = function (layers) {
      var index;
      var highestLoadingOrder = 0;
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].tiled
          && (layers[i].loadOrder > highestLoadingOrder
          || layers[i].loadOrder === highestLoadingOrder)) {
          index = i;
          highestLoadingOrder = index;
        }
      }
      return index;
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {array} Array of promises.
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @description Takes a list of promises and calls addLayersRecursively when
     *              all promises have resolved.
     */
    var startOverWhenDone = function (promises, map, layers, i) {
      $q.all(promises).then(function () {
        addLayersRecursively(map, layers, i);
      });
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @description Adds listeners that call when load starts and finished to
     *              the layer at index i of layers. Callbacks remove layers of
     *              the map after index i when load starts and adds layers after
     *              index i recursively when load finishes.
     */
    var addLoadListenersToLayer = function (map, layers, i) {
      var layer = layers[i];
      var j = i + 1;

      var removeAllAfterI = function () {
        for (j; j < layers.length; j++) {
          layers[j].remove(map);
        }
      };

      var reAdd = function () {
        addLayersRecursively(map, layers, i + 1);
      };

      layer._leafletLayer.off('load');
      layer._leafletLayer.off('loading');
      layer._leafletLayer.on('loading', removeAllAfterI);
      layer._leafletLayer.on('load', reAdd);
    };

    /**
     * @function
     * @memberOf map.MapService
     * @param  {dynamic} mapElem can be string or Element.
     * @param  {options} Options (bounds, attribution etc.)
     * @return {L.NxtMap}   Leaflet.NxtMap instance
     * @description Creates a Leaflet map based on idString or Element.
     */
    var createLeafletMap = function (mapElem, options) { // String or Element.

      var leafletMap = LeafletService.map(mapElem, options);

      if (options.addZoomTitles) {
        LeafletService.control.zoom({
          zoomInTitle: options.zoomInTitle,
          zoomOutTitle: options.zoomOutTitle
        }).addTo(leafletMap);
      }

      return leafletMap;
    };

    /**
     * Initializes map layers for every layergroup.mapLayers.
     * @param  {object} timeState used to set an initial time on layers
     */
    var initializeLayers = function (timeState) {
      angular.forEach(DataService.layerGroups, function (lg, lgSlug) {
        sortLayers(lg.mapLayers);
        angular.forEach(lg.mapLayers, function (layer, lSlug) {
          if (layer.tiled) {
            layer._leafletLayer = initializers[layer.format](layer);
            angular.extend(layer, NxtMapLayer);
          } else if (layer.format === 'WMS') {
            layer = NxtNonTiledWMSLayer.create(layer);
          }
          layer.timeState = timeState;
        });
      });
    };

    /**
     * Initializers for every layer format
     */
    var initializers = {

      TMS: function (nonLeafLayer) {

        var layerUrl = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';
        var layer = LeafletService.tileLayer(
          layerUrl, {
            slug: nonLeafLayer.slug,
            minZoom: nonLeafLayer.min_zoom || 0,
            maxZoom: 19,
            detectRetina: true,
            zIndex: nonLeafLayer.zIndex,
            ext: 'png'
          });

        return layer;
      },

      WMS: function (nonLeafLayer) {
        var _options = {
          layers: nonLeafLayer.slug,
          format: 'image/png',
          version: '1.1.1',
          minZoom: nonLeafLayer.min_zoom || 0,
          maxZoom: 19,
          opacity: nonLeafLayer.opacity,
          zIndex: nonLeafLayer.zIndex
        };
        _options = angular.extend(_options, nonLeafLayer.options);

        return LeafletService.tileLayer.wms(nonLeafLayer.url, _options);
      },

      UTFGrid: function (nonLeafLayer) {

        var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

        var layer = new LeafletService.UtfGrid(url, {
          ext: 'grid',
          slug: nonLeafLayer.slug,
          name: nonLeafLayer.slug,
          useJsonP: false,
          minZoom: nonLeafLayer.min_zoom_click || 0,
          maxZoom: 19,
          order: nonLeafLayer.zIndex,
          zIndex: nonLeafLayer.zIndex
        });
        return layer;
      },

      Vector: function (nonLeafLayer) {
        var leafletLayer = new LeafletVectorService({
          slug: nonLeafLayer.slug,
          color: nonLeafLayer.color,
          showCoverageOnHover: false,  // When you mouse over a cluster it shows
                                       // the bounds of its markers.
          zoomToBoundsOnClick: true,   // When you click a cluster we zoom to
                                       // its bounds.
          spiderfyOnMaxZoom: false,    // When you click a cluster at the bottom
                                       // zoom level we  do not spiderfy it
                                       // so you can see all of its markers.
          maxClusterRadius: 80,        // The maximum radius that a cluster will
                                       // cover from the central marker
                                       // (in pixels). Default 80. Decreasing
                                       // will make more and smaller clusters.
                                       // Set to 1 for clustering only when
                                       // events are on the same spot.
          animateAddingMarkers: false, // Enable for cool animations but its
                                       // too slow for > 1000 events.
          iconCreateFunction: function (cluster) {
            var size = cluster.getAllChildMarkers().length,
                pxSize;

            if (size > 1024) {
              pxSize = 30;
            } else if (size > 256) {
              pxSize = 26;
            } else if (size > 64) {
              pxSize = 22;
            } else if (size > 32) {
              pxSize = 20;
            } else if (size > 16) {
              pxSize = 18;
            } else if (size > 8) {
              pxSize = 16;
            } else if (size > 4) {
              pxSize = 14;
            } else {
              pxSize = 12;
            }

            // Return two circles, an opaque big one with a smaller one on top
            // and white text in the middle. With radius = pxSize.
            return L.divIcon({
              iconAnchor: [pxSize, pxSize],
              html: '<svg height="' + (pxSize * 2) + '" width="' + (pxSize * 2)
                    + '">'
                    + '<circle cx="' + pxSize + '" cy="' + pxSize
                    + '" r="' + pxSize + '" fill-opacity="0.4" fill="'
                    + nonLeafLayer.color + '" />'
                    + '<circle cx="' + pxSize + '" cy="' + pxSize + '" r="'
                    + (pxSize - 2) + '" fill-opacity="1" fill="'
                    + nonLeafLayer.color + '" />'
                    + '<text x="' + pxSize + '" y="' + (pxSize + 5)
                    + '" style="text-anchor: middle; fill: white;">'
                    + size + '</text>'
                    + '</svg>'
            });
          }

        });
        return leafletLayer;
      }

    };

    return service;
  }]);

'use strict';

/**
 * Map directive
 *
 * Overview
 * ========
 *
 * Defines the map. Directive does all the watching and DOM binding, MapDirCtrl
 * holds all the testable logic. Ideally the directive has no logic and the
 * MapDirCtrl is independent of the rest of the application.
 *
 */
angular.module('map')
  .directive('map', [
  '$controller',
  'MapService',
  'DataService',
  'UtilService',
  'State',
  function ($controller, MapService, DataService, UtilService, State) {

    var link = function (scope, element, attrs) {

      var mapSetsBounds = false;
       /**
        * @function
        * @memberOf app.map
        * @description small clickhandler for leafletclicks
        * @param  {event}  e Leaflet event object
        */
      var _clicked = function (e) {
        State.spatial.here = e.latlng;
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _moveStarted = function (e) {
        State.spatial.mapMoving = true;
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _mouseMove = function (e) {
        if (State.box.type === 'line') {
          State.spatial.userHere = e.latlng;
        }
      };

      /**
       * @function
       * @memberOf app.map
       */
      var _moveEnded = function (e, map) {
        State.spatial.mapMoving = false;
        mapSetsBounds = true;
        State.spatial.bounds = map.getBounds();
        State.spatial.zoom = map.getZoom();
      };

      MapService.initializeMap(element[0], {
          attributionControl: false,
          zoomControl: false,
          addZoomTitles: true,
        }, {
          onClick: _clicked,
          onMoveStart: _moveStarted,
          onMoveEnd: _moveEnded,
          onMouseMove: _mouseMove
        });

      /**
       * Watch bounds of state and update map bounds when state is changed.
       */
      scope.$watch(State.toString('spatial.bounds'), function (n, o) {
        if (!mapSetsBounds) {
          MapService.fitBounds(State.spatial.bounds);
        } else {
          mapSetsBounds = false;
        }
      });

      /**
       * Watch temporal.at of app and update maplayers accordingly.
       *
       * Used for animation and clicks on timeline or changes from url-ctrl.
       */
      scope.$watch(State.toString('temporal.at'), function (n, o) {
        if (n === o) { return; }
        MapService.syncTime(State.temporal);
      });

      /**
       * Watch timelineMoving to update maplayers to new time domain when.
       *
       * Used for drag of timeline or changes from url-ctrl.
       */
      scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
        if (n === o) { return; }
        MapService.syncTime(State.temporal);
      });

      /**
       * Watch timelineMoving to maplayers to time domain.
       *
       * Used to turn maplayers to a none animating state. When animation stops.
       */
      scope.$watch(State.toString('temporal.playing'), function (newValue) {
        if (newValue) { return; }
        MapService.syncTime(State.temporal);
      });

      scope.$watch(State.toString('box.type'), function (n, o) {
        if (n === o) { return true; }
        var selector;
        switch (n) {
          case "point":
            selector = "";
            break;
          case "line":
            selector = "#map * {cursor: crosshair;}";
            break;
          case "area":
            selector = "#map * {cursor: -webkit-grab; cursor: -moz-grab; cursor: grab; cursor: hand;}";
            break;
          default:
            return;
        }
        UtilService.addNewStyle(selector);
      });

    };

    return {
      restrict: 'E',
      replace: true,
      template: '<div id="map" class="map"></div>',
      link: link
    };
  }
]);

angular.module('omnibox', [
  'templates-main',
  'global-state',
  'data-menu'
]);

angular.module('omnibox')
  .controller("OmniboxCtrl", [
  "$scope",
  "UtilService",
  "ClickFeedbackService",
  "State",
  "DataService",

  function (
    $scope,
    UtilService,
    ClickFeedbackService,
    State,
    DataService) {

    this.state = { temporal: State.temporal };

    $scope.box = {
      content: {}
    };

    /**
     * @function
     * @memberOf app.omnibox
     * @description Fills box by requesting data from DataService
     *              When finished $scope.box.content contains an
     *              object for every active layergroup and an item
     *              in box.content.<layergroup>.layer for every
     *              piece of data.The promises are returned to
     *              add specific logic in the child controllers.
     * @param  {L.LatLng} here | L.Bounds | [L.LatLng]
     */
    $scope.fillBox = function (options) {
      // if geocode query has been used it needs to be destroyed now
      if ($scope.box.content.hasOwnProperty('location')) {
        delete $scope.box.content.location;
      }

      var doneFn = function () {
        angular.forEach($scope.box.content, function (value, key) {
          if (State.layerGroups.active.indexOf(key) === -1) {
            delete $scope.box.content[key];
          }
        });
      };

      var putDataOnScope = function (response) {
        var lGContent = $scope.box.content[response.layerGroupSlug] || {layers: {}};
        lGContent.layers[response.layerSlug] = lGContent.layers[response.layerSlug] || {};
        lGContent.layerGroupName = DataService.layerGroups[response.layerGroupSlug].name;
        lGContent.order = DataService.layerGroups[response.layerGroupSlug].order;
        if (UtilService.isSufficientlyRichData(response.data)) {

          var sharedKeys = ['aggType', 'format', 'data', 'summary', 'scale',
            'quantity', 'unit', 'color', 'type'];

          angular.forEach(sharedKeys, function (key) {
            lGContent.layers[response.layerSlug][key] = response[key];
          });

          /**
           * lGContent now looks like: {
           *   layerGroup: <slug>,
           *   layerGroupName: <name>,
           *   order: <order>,
           *   layers: {
           *     <layerSlug>: {
           *       data: <layer.data>,
           *       format: <layer.format>
           *     },
           *
           *     ...,
           *
           *   }
           * }
           */

          $scope.box.content[response.layerGroupSlug] = lGContent;

        } else {

          if ($scope.box.content[response.layerGroupSlug]) {

            if (response.layerGroupSlug === 'waterchain') {
              delete $scope.box.content.waterchain;
              delete $scope.box.content.timeseries;

            } else {
              delete $scope.box.content[response.layerGroupSlug].layers[response.layerSlug];
            }
          }
        }
        // Accomodate chaining in child controllers
        return response;
      };
      var promise = DataService.getData('omnibox', options).then(doneFn, doneFn, putDataOnScope);
      return promise;
    };

    // Make UtilSvc.getIconClass available in Angular templates
    $scope.getIconClass = UtilService.getIconClass;
  }
]);

angular.module('omnibox')
  .constant("WantedAttributes", {
  bridge: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue: "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "Liggerbrug"
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 8
      },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 17
      },
      {
        keyName: "Hoogte",
        attrName: "height",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.height | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: 2
      }
    ]
  },
  channel_Boezem: {
    rows: [
      {
        keyName: "Naam",
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: "Watergang"
      },
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "Boezem"
      }
    ]
  },
  crossprofile: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type | niceNumberOrEllipsis: 2",
        valueSuffix: "",
        defaultValue: "Dwarsdoorsnede"
      }
    ]
  },
  culvert: {
    rows: [
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "2"
      },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "8"
      },
      {
        keyName: "Hoogte",
        attrName: "height",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.height | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.5"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material | truncate: 20",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | truncate: 20",
        valueSuffix: "",
        defaultValue: "rechthoekig"
      }
    ]
  },
  groundwaterstation: {
    rows: [
      {
        keyName: "Naam",
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: ""
      },
      {
        keyName: "Maaiveldhoogte",
        attrName: "surface_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.surface_level",
        valueSuffix: " (mNAP)",
        defaultValue: ""
      },
      {
        keyName: "Bovenkant buis",
        attrName: "top_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.top_level",
        valueSuffix: " (mNAP)",
        defaultValue: ""
      },
      {
        keyName: "Onderkant buis",
        attrName: "bottom_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.bottom_level",
        valueSuffix: " (mNAP)",
        defaultValue: ""
      },
      {
        keyName: "Bovenkant filter",
        attrName: "filter_top_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.filter_top_level",
        valueSuffix: " (mNAP)",
        defaultValue: ""
      },
      {
        keyName: "Onderkant filter",
        attrName: "filter_bottom_level",
        ngBindValue: "waterchain.layers.waterchain_grid.data.filter_bottom_level",
        valueSuffix: " (mNAP)",
        defaultValue: ""
      }
    ]
  },
  levee: {
    rows: [
      {
        keyName: "Kruinhoogte",
        attrName: "crest_height",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_height | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "2"
      },
      {
        keyName: "Bekleding",
        attrName: "coating",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.coating",
        valueSuffix: "",
        defaultValue: "gras"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material",
        valueSuffix: "",
        defaultValue: "zand"
      }
    ]
  },
  leveereferencepoint: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "Referentiemeetpunt"
      }
    ]
  },
  manhole: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "0-7361"
      },
      {
        keyName: "Maaiveld",
        attrName: "surface_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.surface_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "0.42"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "0.8"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | lookupManholeShape",
        valueSuffix: "",
        defaultValue: "vierkant"
      },
      {
        keyName: "Putbodem",
        attrName: "bottom_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.bottom_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-1.6"
      }
    ],
  },
  measuringstation: {
    rows: [
      {
        keyName: "Naam",
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: "KNMI"
      },
      {
        keyName: "Categorie",
        attrName: "category",
        ngBindValue: "waterchain.layers.waterchain_grid.data.category",
        valueSuffix: "",
        defaultValue: "KNMI-AWS"
      },
      {
        keyName: "Frequentie",
        attrName: "frequency",
        ngBindValue: "waterchain.layers.waterchain_grid.data.frequency",
        valueSuffix: "",
        defaultValue: "1x per uur"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "6278"
      }
    ]
  },
  orifice: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "3105"
      },
      {
        keyName: "Overstortbreedte",
        attrName: "crest_width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1"
      },
      {
        keyName: "Overstorthoogte",
        attrName: "crest_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "0.2"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | truncate: 20",
        valueSuffix: "",
        defaultValue: "rechthoekig"
      }
    ]
  },
  outlet: {
    rows: [
      {
        keyName: "Put ID",
        attrName: "manhole_id",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.manhole_id | niceNumberOrEllipsis: 2",
        valueSuffix: "",
        defaultValue: "6-549"
      },
      {
        keyName: "Buitenwaterstand (gemiddeld)",
        attrName: "open_water_level_average",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.open_water_level_average | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-0.1"
      }//,
      // {
      //   keyName: "Buitenwaterstand (zomer)",
      //   attrName: "open_water_level_summer",
      //   ngBindValue:
      //     "waterchain.layers.waterchain_grid.data.open_water_level_summer | niceNumberOrEllipsis: 2",
      //   valueSuffix: " (mNAP)",
      //   defaultValue: "-0.05"
      // },
      // {
      //   keyName: "Buitenwaterstand (winter)",
      //   attrName: "open_water_level_winter",
      //   ngBindValue:
      //     "waterchain.layers.waterchain_grid.data.open_water_level_winter | niceNumberOrEllipsis: 2",
      //   valueSuffix: " (mNAP)",
      //   defaultValue: "-0.15"
      // }
    ]
  },
  overflow: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "12-72297"
      },
      {
        keyName: "Overstortbreedte",
        attrName: "crest_width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_width",
        valueSuffix: " (m)",
        defaultValue: "1"
      },
      {
        keyName: "Overstorthoogte",
        attrName: "crest_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_level",
        valueSuffix: " (mNAP)",
        defaultValue: "0.2"
      }
    ]
  },
  pipe: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type | lookupPipeType",
        valueSuffix: "",
        defaultValue: "gemengd stelsel"
      },
      {
        keyName: "BOB beginpunt",
        attrName: "invert_level_start_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.invert_level_start_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-3.1"
      },
      {
        keyName: "BOB eindpunt",
        attrName: "invert_level_end_point",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.invert_level_end_point | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-3.12"
      },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "28"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material | pipeMaterialOrEllipsis",
        valueSuffix: "",
        defaultValue: "beton"
      },
      {
        keyName: "Breedte",
        attrName: "width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "0.8"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape | lookupPipeShape",
        valueSuffix: "",
        defaultValue: "rond"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "0-985-0-986"
      }//,
      // {
      //   keyName: "Beginpunt",
      //   attrName: "start_point",
      //   ngBindValue:
      //     "waterchain.layers.waterchain_grid.data.start_point",
      //   valueSuffix: "",
      //   defaultValue: "onbekend"
      // },
      // {
      //   keyName: "Eindpunt",
      //   attrName: "end_point",
      //   ngBindValue:
      //     "waterchain.layers.waterchain_grid.data.end_point",
      //   valueSuffix: "",
      //   defaultValue: "onbekend"
      // },
      // {
      //   keyName: "Aantal inwoners",
      //   attrName: "number_of_inhabitants",
      //   ngBindValue:
      //     "waterchain.layers.waterchain_grid.data.number_of_inhabitants",
      //   valueSuffix: "",
      //   defaultValue: "7"
      // },
      // {
      //   keyName: "DWA definitie",
      //   attrName: "dwa_definition",
      //   ngBindValue:
      //     "waterchain.layers.waterchain_grid.data.dwa_definition",
      //   valueSuffix: "",
      //   defaultValue: "DWA"
      // }
    ]
  },
  pressurepipe: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.type | lookupPressurePipeType",
        valueSuffix: "",
        defaultValue: "transportleiding"
      },
      {
        keyName: "Bouwjaar",
        attrName: "year_of_construction",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.year_of_construction",
        valueSuffix: "",
        defaultValue: "2006"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "776"
      },
      {
        keyName: "Diameter",
        attrName: "diameter",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.diameter | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.6"
      },
      {
        keyName: "Vorm",
        attrName: "shape",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.shape",
        valueSuffix: "",
        defaultValue: "rond"
      },
      // {
      //   keyName: "Naam",
      //   attrName: "display_name",
      //   ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
      //   valueSuffix: "",
      //   defaultValue: "persleiding"
      // },
      {
        keyName: "Lengte",
        attrName: "length",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.length",
        valueSuffix: " (m)",
        defaultValue: "154"
      },
      {
        keyName: "Materiaal",
        attrName: "material",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.material | pipeMaterialOrEllipsis",
        valueSuffix: "",
        defaultValue: "HDPE"
      }
    ]
  },
  pumpstation: {
    rows: [
      {
        keyName: "Type",
        attrName: "type",
        ngBindValue: "waterchain.layers.waterchain_grid.data.type",
        valueSuffix: "",
        defaultValue: "gemaal"
      },
      {
        keyName: "Capaciteit",
        attrName: "capacity",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.capacity * 3.6 | niceNumberOrEllipsis: 2",
        valueSuffix: "  (m<sup>3</sup> / uur)",
        defaultValue: "54"
      },
      {
        keyName: "Naam",
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: "onbekend"
      },
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "127"
      },
      {
        keyName: "Aanslagpeil",
        attrName: "start_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.start_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.2"
      },
      {
        keyName: "Afslagpeil",
        attrName: "stop_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.stop_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-2.8"
      }
    ]
  },
  pumped_drainage_area: {
    rows: [
    ]
  },
  sluice: {
    rows: [
      {
        keyName: "Naam",
        attrName: "display_name",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: 'onbekend'
      }
    ]
  },
  wastewatertreatmentplant: {
    rows: [ //Afvalwaterzuiveringsinstallatie
      {
        keyName: "Naam",
        attrName: "display_name",
        ngBindValue: "waterchain.layers.waterchain_grid.data.display_name",
        valueSuffix: "",
        defaultValue: "onbekend"
      },
    ]
  },
  weir: {
    rows: [
      {
        keyName: "Code",
        attrName: "code",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.code",
        valueSuffix: "",
        defaultValue: "473"
      },
      {
        keyName: "Breedte",
        attrName: "crest_width",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_width | niceNumberOrEllipsis: 2",
        valueSuffix: " (m)",
        defaultValue: "1.6"
      },
      {
        keyName: "Niveau",
        attrName: "crest_level",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.crest_level | niceNumberOrEllipsis: 2",
        valueSuffix: " (mNAP)",
        defaultValue: "-0.3"
      },
      {
        keyName: "Controle",
        attrName: "controlled",
        ngBindValue:
          "waterchain.layers.waterchain_grid.data.controlled",
        valueSuffix: "",
        defaultValue: "RTC"
      },
    ]
  }
});

'use strict';

/**
 * @ngdoc service
 * @name lizardClientApp.locationService
 * @description
 * # locationService
 * Service in the lizardClientApp.
 */
angular.module('omnibox')
  .service('LocationService', ['CabinetService', function LocationService(CabinetService) {

    this.search = function (searchString) {
      if (searchString.length > 1) {
        return CabinetService.geocode.get({q: searchString});
      }
    };

  }
]);

'use strict';

/**
 * @ngdoc
 * @memberOf app
 * @class pointCtrl
 * @name pointCtrl
 * @description point is the controller of the point template.
 * It gathers all data belonging to a location in space. It becomes active
 * by setting box.type to 'point' and is updated by when State.spatila.here
 * changes
 */

angular.module('omnibox')
.controller('PointCtrl', [
  '$scope',
  '$q',
  'LeafletService',
  'TimeseriesService',
  'ClickFeedbackService',
  'UtilService',
  'MapService',
  'DataService',
  'State',

  function ($scope, $q, LeafletService, TimeseriesService, ClickFeedbackService, UtilService, MapService, DataService, State) {

    var GRAPH_WIDTH = 600;
    $scope.box.content = {};

    /**
     * @function
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    var fillpoint = function (here) {
      ClickFeedbackService.drawCircle(MapService, here);
      ClickFeedbackService.startVibration(MapService);
      var aggWindow = State.temporal.aggWindow;
      var promise = $scope.fillBox({
        geom: here,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: aggWindow
      });

      // Draw feedback when all promises resolved
      promise.then(drawFeedback, null, function (response) {
        if (response && response.data && response.data.id && response.data.entity_name) {
          getTimeSeriesForObject(
            response.data.entity_name + '$' + response.data.id
          );
        }
        if (response.layerSlug === 'radar/basic' && response.data !== null) {
          // this logs incessant errors.
          if ($scope.box.content[response.layerGroupSlug] === undefined) { return; }
          if (!$scope.box.content[response.layerGroupSlug].layers.hasOwnProperty(response.layerSlug)) { return; }

          // This could probably be different.
          $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].changed =
            !$scope.box.content[response.layerGroupSlug].layers[response.layerSlug].changed;
          $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].aggWindow = aggWindow;
        }
        $scope.box.minimizeCards();
      });
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description Wrapper to improve readability
     */
    var fillPointHere = function () {
      if (State.spatial.here) {
        fillpoint(State.spatial.here);
      }
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description Draw visual feedback after client clicked on the map
     */
    var drawFeedback = function () {
      var feedbackDrawn = false;

      var drawVectorFeedback = function (content) {
        angular.forEach(content, function (lg) {
          if (lg && lg.layers) {
            angular.forEach(lg.layers, function (layer) {
              if (layer.format === 'Vector' && layer.data.length > 0) {
                ClickFeedbackService.drawGeometry(
                  MapService,
                  layer.data
                );
                ClickFeedbackService.vibrateOnce();
                feedbackDrawn = true;
              }
            });
          }
        });
      };

      var drawUTFGridFeedback = function (content) {
        if (content.waterchain && content.waterchain.layers.waterchain_grid) {
          var feature = {
            type: 'Feature',
            geometry: angular.fromJson(content.waterchain.layers.waterchain_grid.data.geom),
            properties: {
              entity_name: content.waterchain.layers.waterchain_grid.data.entity_name,
              type: content.waterchain.layers.waterchain_grid.data.type || ''
            }
          };
          ClickFeedbackService.drawGeometry(
            MapService,
            feature
          );
          ClickFeedbackService.vibrateOnce();
          feedbackDrawn = true;
        }
      };

      var drawStoreFeedback = function (content) {
        if (!feedbackDrawn) {
          angular.forEach(content, function (lg) {
            if (lg && lg.layers) {
              angular.forEach(lg.layers, function (layer) {
                if (layer.format === 'Store' && layer.data.length > 0) {
                  ClickFeedbackService.drawArrow(MapService, State.spatial.here);
                  feedbackDrawn = true;
                }
              });
            }
          });
        }
      };

      ClickFeedbackService.emptyClickLayer(MapService);
      drawVectorFeedback($scope.box.content);
      drawUTFGridFeedback($scope.box.content);
      drawStoreFeedback($scope.box.content);
      if (!feedbackDrawn) {
        ClickFeedbackService.vibrateOnce({
          type: 'Point',
          coordinates: [State.spatial.here.lng, State.spatial.here.lat]
        });
      }
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description gets timeseries from service
     */
    var getTimeSeriesForObject = function (objectId) {

      TimeseriesService.getTimeseries(objectId, State.temporal)
      .then(function (result) {

        $scope.box.content.timeseries = $scope.box.content.timeseries || {};

        if (result.length > 0) {
          // We retrieved data for one-or-more timeseries, but do these actually
          // contain measurements, or just metadata? We filter out the timeseries
          // with too little measurements...
          var filteredResult = [];
          angular.forEach(result, function (value) {
            if (value.events.length > 1) {
              filteredResult.push(value);
            }
          });
          if (filteredResult.length > 0) {
            // IF we retrieve at least one timeseries with actual measurements,
            // we put the retrieved data on the $scope:
            $scope.box.content.timeseries.data = filteredResult;
            $scope.box.content.timeseries.selectedTimeseries = filteredResult[0];
          } else {
            // ELSE, we delete the container object for timeseries:
            delete $scope.box.content.timeseries;
          }

        } else {
          delete $scope.box.content.timeseries;
        }
      });
    };

    // Update when user clicked again
    $scope.$watch(State.toString('spatial.here'), function (n, o) {
      if (n === o) { return; }
      fillPointHere();
    });

    // Update when layergroups have changed
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return; }
      if (State.spatial.here.lat && State.spatial.here.lng) {
        fillPointHere();
      }
    });

    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === "false" && o === "true") {
        if (State.spatial.here.lat && State.spatial.here.lng) {
          fillPointHere();
        }
      }
    });

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      DataService.reject();
      $scope.box.content = {};
      ClickFeedbackService.emptyClickLayer(MapService);
    });
  }
]);

angular.module('omnibox')
  .controller("rain",
      ['RasterService', 'State', '$scope',
  function (RasterService, State, $scope) {

  /*
   * @description
   * angular isolate scope is messed with
   * when you using ng-if. This looks to parent
   * model and sets the local fullDetails.
   */
  $scope.$watch('box.fullDetails.rain', function (n) {
    $scope.fullDetails = n;
  });


  $scope.rrc = {
    active: false
  };

  $scope.recurrenceTimeToggle = function () {
    if (!$scope.$$phase) {
      $scope.$apply(function () {
        $scope.rrc.active = !$scope.rrc.active;
        $scope.lg.layers['radar/basic'].changed = !$scope.lg.layers['radar/basic'].changed;
      });
    } else {
      $scope.rrc.active = !$scope.rrc.active;
      $scope.lg.layers['radar/basic'].changed = !$scope.lg.layers['radar/basic'].changed;
    }
  };


  $scope.$watch("lg.layers['radar/basic'].changed", function (n, o) {
    if (n === o || !$scope.rrc.active) { return; }
    getRecurrenceTime();
  });

  var getRecurrenceTime = function () {
    $scope.rrc.data = null;

    // TODO: refactor this shit
    RasterService.getData(
     {slug: 'radar/basic'}, {
      agg: 'rrc',
      geom: State.spatial.here,
      start: State.temporal.start,
      end: State.temporal.end
    }).then(function (response) {
      $scope.rrc.data = response;
    });
  };

  /**
   * Format the CSV (exporting rain data for a point in space/interval in
   * time) in a way that makes it comprehensible for les autres.
   *
   */
  $scope.formatCSVColumns = function (data) {
    var i,
        formattedDateTime,
        formattedData = [],
        lat = State.spatial.here.lat,
        lng = State.spatial.here.lng,
        _formatDate = function (epoch) {
          var d = new Date(parseInt(epoch));
          return [
            [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('-'),
            [d.getHours() || "00", d.getMinutes() || "00", d.getSeconds() || "00"].join(':')
          ];
        };

    for (i = 0; i < data.length; i++) {

      formattedDateTime = _formatDate(data[i][0]);

      formattedData.push([
        formattedDateTime[0],
        formattedDateTime[1],
        Math.floor(100 * data[i][1]) / 100 || "0.00",
        lat,
        lng
      ]);
    }

    return formattedData;
  };

}]);

angular.module('omnibox')
  .controller('LineCtrl', [
  '$scope',
  'RasterService',
  'ClickFeedbackService',
  'UtilService',
  '$q',
  'MapService',
  'DataService',
  'State',
  function ($scope, RasterService, ClickFeedbackService, UtilService, $q, MapService, DataService, State) {

    $scope.box.content = {};

    /**
     * @function
     * @memberOf app.lineCtrl
     * @description Gets data from DataService
     * @param  array of L.LatLng objects describing the line.
     */
    var fillLine = function (line) {
      ClickFeedbackService.startVibration(MapService);
      //TODO draw feedback when loading data
      var promise = $scope.fillBox({
        geom: line,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: State.temporal.aggWindow
      });
      // Draw feedback when all promises are resolved
      promise.then(drawFeedback, drawFeedback, function (response) {
        if (response && response.data
           && response.layerSlug === 'dem/nl'
           // Prevent trying to fill $scope.box.content[response.layerGroupSlug]
           // when retrieved data wasn't rich enough for it's initialization:
           && $scope.box.content[response.layerGroupSlug]
        ) {
          // NB! In the backend, this data is already converted from degrees
          // to meters.
          $scope.box.content[response.layerGroupSlug]
            .layers[response.layerSlug]
            .data = response.data;
        } else if (response.layerSlug === 'radar/basic') {
          // We dont wanna show intersect for rain (d.d. 20-01-2015)
          delete $scope.box.content[response.layerGroupSlug].layers['radar/basic'];
        } else if (response.data && response.data !== 'null'
          && response.format === 'Store'
          && (response.scale === 'ratio' || response.scale === 'interval')
          && DataService.layerGroups[response.layerGroupSlug].temporal) {
          $scope.box.content[response.layerGroupSlug]
            .layers[response.layerSlug]
            .temporalData = response.data;
          $scope.box.content[response.layerGroupSlug]
            .layers[response.layerSlug]
            .data = UtilService.createDataForTimeState(
              $scope.box.content[response.layerGroupSlug]
                .layers[response.layerSlug]
                .temporalData,
              State.temporal
            );
        }
      });
    };

    /**
     * @function
     * @memberOf app.LineCtrl
     * @Description Looks a $scope.box.content to draw feedback
     *              for Store layers with data or provides feedback
     *              for not recieving any data.
     */
    var drawFeedback = function () {
      var feedbackDrawn = false;
      angular.forEach($scope.box.content, function (lg) {
        if (lg && lg.layers) {
          angular.forEach(lg.layers, function (layer) {
            if (layer && layer.data && layer.data.length > 0) {
              ClickFeedbackService.emptyClickLayer(MapService);
              ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.points[1], false);
              ClickFeedbackService.vibrateOnce();
              feedbackDrawn = true;
            }
          });
        }
      });
      if (!feedbackDrawn) {
        ClickFeedbackService.emptyClickLayer(MapService);
        ClickFeedbackService.vibrateOnce({
          type: 'LineString',
          coordinates: [
            [State.spatial.points[0].lng, State.spatial.points[0].lat],
            [State.spatial.points[1].lng, State.spatial.points[1].lat]
          ]
        });
      }
    };

    /**
     * Updates firsClick and or secondClick and draws
     * appropriate feedback
     *
     * It either:
     *   1. Removes the current line
     *   2. Sets firstClick and draws a tiny line from the first
     *      click to the current pos of mouse.
     *   3. Sets the second click and draws the lne from
     *      the first to the second.
     */
    $scope.$watch(State.toString('spatial.here'), function (n, o) {
      if (n === o) { return true; }
      ClickFeedbackService.emptyClickLayer(MapService);
      if (State.spatial.points.length === 2) {
        State.spatial.points = [];
        // Empty data element since the line is gone
        $scope.box.content = {};
      } else {
        if (State.spatial.points.length === 1) {
          State.spatial.points[1] = State.spatial.here;
          ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.points[1], false);
          fillLine(State.spatial.points);
        } else {
          State.spatial.points[0] = State.spatial.here;
          ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.userHere, true);
        }
      }
    });

    var watchIfUrlCtrlSetsPoints = $scope.$watch(State.toString('spatial.points'), function (n, o) {
      if (State.spatial.points.length === 2) {
        ClickFeedbackService.emptyClickLayer(MapService);
        ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.points[1], false);
        fillLine(State.spatial.points);
        // Delete this watch
        watchIfUrlCtrlSetsPoints();
      }
    });

    /**
     * Updates line according to geo-pos of mouse
     */
    $scope.$watch(State.toString('spatial.userHere'), function (n, o) {
      if (n === o) { return true; }
      if (State.spatial.points[0] && !State.spatial.points[1]) {
        ClickFeedbackService.emptyClickLayer(MapService);
        ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.userHere, true);
      }
    });

    /**
     * Updates line data when users changes layers.
     */
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      if (State.spatial.points.length === 2) {
        ClickFeedbackService.emptyClickLayer(MapService);
        ClickFeedbackService.drawLine(State.spatial.points[0], State.spatial.points[1], false);
        fillLine(State.spatial.points);
      }
    });

    /**
     * Updates line of temporal layers when timeState.at changes.
     */
    $scope.$watch(State.toString('temporal.at'), function (n, o) {
      angular.forEach($scope.box.content, function (lg, slug) {
        if (DataService.layerGroups[slug].temporal) {
          angular.forEach(lg.layers, function (layer) {
            if (layer.format === 'Store'
              && (layer.scale === 'ratio' || layer.scale === 'interval')) {
              layer.data = UtilService.createDataForTimeState(layer.temporalData, State.temporal);
            }
          });
        }
      });
    });

    /**
     * Reload data from temporal rasters when temporal zoomended.
     */
    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      if (!State.temporal.timelineMoving
        && State.spatial.points.length === 2) {
        fillLine(State.spatial.points);
      }
    });

    /**
     * Legacy function to draw 'bolletje'
     *
     * TODO
     */
    var circle;
    $scope.$watch('box.mouseLoc', function (n, o) {
      if (n === o) { return true; }
      if ($scope.box.mouseLoc) {

        if (State.spatial.points[0] === undefined ||
            State.spatial.points[1] === undefined) {
          return;
        }

        // local vars declaration.
        var lat1, lat2, lon1, lon2, maxD, d, r, dLat, dLon, posLat, posLon;

        lat1 = State.spatial.points[0].lat;
        lat2 = State.spatial.points[1].lat;
        lon1 = State.spatial.points[0].lng;
        lon2 = State.spatial.points[1].lng;
        maxD = Math.sqrt(Math.pow((lat2 - lat1), 2) +
                         Math.pow((lon2 - lon1), 2));
        d = UtilService.metersToDegs($scope.box.mouseLoc);
        r = d / maxD;
        dLat = (lat2 - lat1) * r;
        dLon = (lon2 - lon1) * r;
        posLat = dLat + lat1;
        posLon = dLon + lon1;
        if (circle === undefined) {
          circle = L.circleMarker([posLat, posLon], {
              color: '#c0392b',
              opacity: 1,
              fillOpacity: 1,
              radius: 5
            });
          MapService.addLeafletLayer(circle);
        } else {
          circle.setLatLng([posLat, posLon]);
        }
      }
      else {
        if (circle !== undefined) {
          MapService.removeLeafletLayer(circle);
          circle = undefined;
        }
      }
    });

    /**
     * Clean up all drawings on box change and reject data.
     */
    $scope.$on('$destroy', function () {
      DataService.reject();
      $scope.box.content = {};
      State.spatial.points = [];
      ClickFeedbackService.emptyClickLayer(MapService);
    });

  }
]);

/**
 * @ngdoc
 * @class areaCtrl
 * @memberOf app
 * @name areaCtrl
 * @description
 * area is the object which collects different
 * sets of aggregation data. If there is no activeObject,
 * this is the default collection of data to be shown in the
 * client.
 *
 * Contains data of all active layers with an aggregation_type
 *
 */
angular.module('omnibox')
.controller('AreaCtrl', [

  '$scope',
  'RasterService',
  'UtilService',
  '$q',
  'DataService',
  'State',

  function (

    $scope,
    RasterService,
    UtilService,
    $q,
    DataService,
    State

  ) {

    $scope.box.content = {};
    $scope.filteredRainDataPerKilometer = undefined;

    /**
     * @function
     * @memberOf app.areaCtrl
     * @description
     * Gets data from DataService.
     * @param  {object} bounds   mapState.bounds, containing
     *                                  leaflet bounds.
     */
    var fillArea = function (bounds) {
      var promise = $scope.fillBox({
        geom: bounds,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: State.temporal.aggWindow
      });
      promise.then(null, null, function (response) {
        if (response && response.data && response.data !== "null") {
          switch (response.layerSlug) {
          case "dem/nl":
            // Since the data is not properly formatted in the back
            // we convert it from degrees to meters here
            $scope.box.content.elevation.layers["dem/nl"].data
              = RasterService.handleElevationCurve(response.data);
            break;
          case "radar/basic":
            $scope.box.content.rain.layers["radar/basic"].data
              = response.data;
            $scope.filteredRainDataPerKilometer
              = UtilService.getFilteredRainDataPerKM(
                  response.data,
                  State.spatial.bounds,
                  State.temporal
                );
            break;
          }
        }
      });
    };

    /**
     * Updates area when user moves map.
     */
    $scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      fillArea(State.spatial.bounds);
    });

    /**
     * Updates area when users changes layers.
     */
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      fillArea(State.spatial.bounds);
    });

    $scope.$watch(State.toString('temporal.at'), function (n, o) {
      if (n === o) { return true; }
      fillArea(State.spatial.bounds);
    });

    $scope.$watch(State.toString('temporal.aggWindow'),
        function (n, o) {
      if (n === o) { return true; }
      fillArea(State.spatial.bounds);
    });

    // Load data at initialization.
    fillArea(State.spatial.bounds);

    // Make UtilSvc functions available in Angular templates
    $scope.countKeys = UtilService.countKeys;

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      DataService.reject();
      $scope.box.content = {};
    });
  }
]);


/**
 * Template directives.
 *
 * * Timeseries
 * * Cardtitle
 * * Event aggregation
 * * Actions
 * * Cardattributes
 * * Detailswitch
 *
 */

/**
 * Timeseries directive.
 */
angular.module('omnibox')
  .directive('timeseries', [function () {
  return {
      restrict: 'E',
      scope: {
        fullDetails: '=',
        timeseries: '=',
        timeState: '='
      },
      // replace: true,
      templateUrl: 'omnibox/templates/timeseries.html'
    };
}]);

angular.module('omnibox')
  .directive('cardattributes', ['WantedAttributes',
    function (WantedAttributes) {
  return {
    link: function (scope) { scope.wanted = WantedAttributes; },
    restrict: 'E',
    scope: {
      fullDetails: '=',
      waterchain: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/cardattributes.html'
  };
}]);

angular.module('omnibox')
  .directive('rain', [function () {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/rain.html'
  };
}]);

angular.module('omnibox')
  .directive('defaultpoint', [function () {
  return {
    restrict: 'E',
    scope: {
      fullDetails: '=',
      lg: '=',
      mapstate: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/defaultpoint.html'
  };
}]);

angular.module('omnibox')
  .directive('detailswitch', [function () {
  return {
    restrict: 'E',
    templateUrl: 'omnibox/templates/detailswitch.html'
  };
}]);

angular.module('omnibox')
  .directive('location', [function () {
  return {
    restrict: 'E',
    templateUrl: 'omnibox/templates/location.html'
  };
}]);


'use strict';

/**
 * @description directive that displays search
 * and makes sure the right services are called.
 */
angular.module('omnibox')
  .directive('search', ['LocationService', 'ClickFeedbackService', 'MapService', 'State',
  function (LocationService, ClickFeedbackService, MapService, State) {

  var link = function (scope, element, attrs) {

    /**
     * @description event handler for key presses.
     * checks if enter is pressed, does search.
     * @param {event} event that is fired.
     * 13 refers to the RETURN key.
     */
    scope.searchKeyPress = function ($event) {

      if ($event.target.id === "searchboxinput") {
        // Intercept keyPresses *within* searchbox, do xor prevent stuff from happening
        if ($event.which === 13) {
          // User hits [enter] -> do search;
          scope.search();
        } else if ($event.which === 32) {
          // user hits [space] -> prevent anim. start/stop
          $event.originalEvent.stopPropagation();
        }
      }
    };

    /**
     * @description calls LocationService
     * with the right query and puts in on the scope.
     */
    scope.search = function () {
      if (scope.geoquery && scope.geoquery.length > 1) {
        LocationService.search(scope.geoquery)
          .then(function (response) {
            scope.geoquery = "";
            if (response.length !== 0) {
              scope.box.content.location = {
                data: response
              };
            }
          }
        );
      }
      else {
        scope.geoquery = "";
      }
    };

    /**
     * @description removes location model from box content
     */
    var destroyLocationModel = function () {
      delete scope.box.content.location;
    };

    /**
     * @description resets input field
     * on scope, because also needs to trigger on reset button,
     * not just on succesful search/zoom.
     *
     * @description - This does the following:
     *
     * (1) - Reset box.type to it's default value, "point";
     * (2) - Reset the search query to the empty string;
     * (3) - Reset box.content to an empty object;
     * (4) - Clear mapState.points arr (used for updating the Url);
     * (5) - Clear the click feedback.
     */
    scope.cleanInput = function () {

      State.box.type = "point";
      scope.geoquery = "";
      scope.box.content = {};
      State.spatial.points = [];
      State.spatial.here = undefined;
      ClickFeedbackService.emptyClickLayer(MapService);
    };

    /**
     * @description zooms to search result
     * @param {object} one search result.
     */
    scope.zoomTo = function (obj) {
      if (obj.boundingbox) {
        var southWest = new L.LatLng(obj.boundingbox[0], obj.boundingbox[2]);
        var northEast = new L.LatLng(obj.boundingbox[1], obj.boundingbox[3]);
        var bounds = new L.LatLngBounds(southWest, northEast);
        MapService.fitBounds(bounds);
      } else {
        if (window.JS_DEBUG) {
          throw new Error('Oops, no boundingbox on this result - TODO: show a proper message instead of this console error...');
        }
      }
      destroyLocationModel();
      scope.cleanInput();
    };

  };

  return {
    link: link,
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/search.html'
  };

}]);


'use strict';

angular.module("omnibox")
  .directive("omnibox", ["$compile", "$templateCache", "UtilService", "State",
    function ($compile, $templateCache, UtilService, State) {

    var getTemplate = function (scope, contentType) {
      if (contentType === undefined) {
        contentType = 'area';
      }

      var templateUrl = 'omnibox/templates/' + contentType + '.html';
      return $templateCache.get(templateUrl);
    };

    var linker = function (scope, element, attrs) {

      var oldScope;

      var replaceTemplate = function () {
        var template = getTemplate(scope, State.box.type);
        // We need to manually destroy scopes here when switching templates.
        // It is necessary to do this *before* withching templates. Otherwise
        // the new scope is active while the previous on is to and they affect
        // each other.
        if (oldScope) { oldScope.$destroy(); }
        // we don't want the dynamic template to overwrite the search box.
        // NOTE: the reason for selecting the specific child is jqLite does
        // not support selectors. So an element is created of the second child
        // of the directive's element and the first child of that element is
        // transformed into an element and replaced by the point/line/area
        // template. Please replace if you know a nicer way..
        var boxTypeCards = angular.element(
          angular.element(element.children()[1]).children()[0]
        ).replaceWith(template);
        var newScope = scope.$new();
        $compile(element.contents())(newScope);

        oldScope = newScope;
      };

      var finalizeTemplateRendering = function () {
        replaceTemplate();
        scope.box.showCards = State.box.type !== 'empty';
      };

      /**
       *  This resets the detailed card model
       */
      var resetDetailCards = function () {
        scope.box.fullDetailCards = {};
        angular.forEach(Object.keys(scope.box.content), function (key) {
          scope.box.fullDetailCards[key] = true;
          if (key === 'waterchain') {
            scope.box.fullDetailCards.timeseries = true;
          }
        });
      };

      /**
       * Resizes if cards, navbar and timeline are larger
       * then the window size.
       */
      scope.box.minimizeCards = function () {
        // height of search and nav combined
        var searchNav = $('#searchboxinput').offset().top + $('#searchboxinput').height();
        var cardsTooHigh = $('#cards').height() + searchNav +
          $('#timeline').height() > $('body').height();
        // jquery is good at this stuff alternative version would be:
        // document.querySelector('#cards').clientHeight etc...
        if (cardsTooHigh) {
          angular.forEach(Object.keys(scope.box.fullDetailCards),
            function (layer) {
              scope.box.fullDetailCards[layer] = false;
            }
          );
        }
      };

      window.addEventListener('resize', scope.box.minimizeCards);

      scope.$watch('box.content', function () {
        resetDetailCards();
        scope.box.minimizeCards();
      });

      scope.$watch(State.toString('box.type'), function (n, o) {
        if (n === o) { return true; }
        finalizeTemplateRendering();
      });

      finalizeTemplateRendering();
    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: 'omnibox/templates/omnibox-search.html'
    };
  }]);


/**
 *
 * Toggle directive for omnibox cards
 *
 */
angular.module('lizard-nxt')
  .directive('fullDetails', [function () {
    
    var link = function (scope, element, attrs) {

      if (scope.fullDetails === undefined) {
        scope.fullDetails = true;
      }
      
      // does the actual toggling.
      var toggleDetails = function () {
        if (scope.$$phase) {
          scope.fullDetails = !scope.fullDetails;
        } else {
          scope.$apply(function () {
            scope.fullDetails = !scope.fullDetails;
          });
        }
      };

      //scope.$parent.box.minimizeCards();
      element.bind('click', toggleDetails);

    };
    

    return {
      link: link,
      restrict: 'E',
      replace: true,
      scope: false,
      templateUrl: 'omnibox/templates/full-details.html'
    }
  }]);


/**
 * @name TimeLineService
 * @class angular.module('lizard-nxt')
  .TimeLineService
 * @memberOf app
 *
 * @summary Service to create and update a timeline. Used by timeline-directive.
 *
 * @description Inject "Timeline" and call new timeline(<args>) to create a
 * timeline. Currently the timeline supports lines (events) and vertical bars
 * (rain intensity). The user may interact with the timeline through click and
 * zoom functions.
 *
 * Everything in the timeline is animated for NxtD3.transTime milliseconds. To
 * add new elements to the timeline, make sure the elements are updated on zoom,
 * and resize. The timeline resizes *before* elements are added and *after*
 * elements are removed. Therefore resize transitions should be delayed with
 * NxtD3.transTime when the timeline is shrinking, as is happening in
 * updateCanvas.
 */
angular.module('lizard-nxt')
  .factory("Timeline", ["NxtD3", function (NxtD3) {

  // Timeline
  var initialHeight,

  // D3 components
  xScale, // The d3 scale for placement on the x axis within the whole
          // timeline. Is only updated when zoomTo is called, or the window
          // resizes.
  ordinalYScale, // Scale used to place events in lines for each type

  // Interaction functions
  clicked = null,
  zoomed = null,
  zoomend = null,

  // Timeline elements
  futureIndicator,
  aggWindow, // aggregation window
  lines, // events start - end
  bars; // rain intensity

  /**
   * @constructor
   * @memberOf angular.module('lizard-nxt')
   * TimeLineService
   *
   * @param {object} element - svg element for the timeline.
   * @param {object} dimensions - object containing, width, height, height per
   *  line of events, height per line of bars and an object containing top,
   *  bottom, left and right padding. All values in px.
   * @param {integer} start - begin value in milliseconds from epoch.
   * @param {integer} end - end value in milliseconds from epoch.
   * @param {object} interaction  - optional object containing callback
   * functions for zoom, click and brush interaction with the rest of the
   *  angular.module('lizard-nxt')
   * @param {integer} nEvents - number of event types (event series).
   */
  function Timeline(element, dimensions, start, end, interaction) {
    NxtD3.call(this, element, dimensions);
    initialHeight = dimensions.height;
    this._svg = addElementGroupsToCanvas(this._svg, this.dimensions);
    this._initDimensions = dimensions;
    xScale = this._makeScale(
      {min: start, max: end},
      {min: 0, max: this._getWidth(dimensions)},
      {scale: 'time' }
    );
    drawTimelineAxes(this._svg, xScale, dimensions);
    this.addFutureIndicator();
    this.addInteraction(interaction);
  }

  Timeline.prototype = Object.create(NxtD3.prototype, {

    constructor: Timeline,

    /**
     * @attribute
     * @type function to be used to format datetime.
     */
    format: {
      value: NxtD3
        .prototype._localeFormatter.nl_NL.timeFormat("%a %e %b %Y %H:%M")
    },
    format_aggwindow: {
      value: NxtD3.prototype._localeFormatter.nl_NL.timeFormat("%e %b %-H:%M")
    },

    /**
     * @function
     * @summary Adds a now indicator to timeline.
     * @description From 'now' the background of the timeline gets a different
     * style.
     */
    addFutureIndicator: {
      value: function () {
        var width = 20000,
            height = this._getHeight(this.dimensions);

        futureIndicator = this._svg.select("g").append("rect")
          .attr("height", height)
          .attr("width", width)
          .attr('title', 'Het gedeelte van de tijdlijn dat in de toekomst ligt')
          .attr("id", "nodata")
          .attr("x", function () {return xScale(Date.now()); })
          .attr("opacity", 0.8)
          .style("fill", "#DDD");
      }
    },

    addClickListener: {
      value: function (clickFn) {
        if (clickFn) {
          clicked = setClickFunction(xScale, this.dimensions, clickFn);
        }
        this._svg.on("click", clicked);
      }
    },

    removeClickListener: {
      value: function () {
        this._svg.on("click", null);
      }
    },

    addInteraction: {
      value: function (interaction) {
        if (!interaction) { return; }
        this.addZoomListener(interaction.zoomFn, interaction.zoomEndFn);
        this.addClickListener(interaction.clickFn);
      }
    },

    /**
     * @function
     * @summary Draws an aggWindow at timestamp.
     * @description Left of aggWindow is timeState.at, size is dependent on
     * current aggWindow interval on timeState.
     *
     * TODO: Rasterstore's "day-level aggregated rain intensity data" has
     * discrete one-day/24h intervals (=good), however those intervals are
     * from 8:00 GMT (in the morning) to the next day's 8:00 GMT in the morning
     * (=bad).
     *
     * This doens't play nice with the aggWindow to be drawn, since (for 24h
     * aggregation) this preferably starts on 00:00, and ends 24h later, again
     * on 00:00.
     *
     */
    drawAggWindow: {
      value: function (timestamp, interval, oldDimensions) {

        var height = this._getHeight(this.dimensions);
        var width = xScale(new Date(timestamp + (interval))) -
          xScale(new Date(timestamp)) - 1; // minus 1 px for visual tightness;
          // aggWindow should be the *exact* same width as the rain bars drawn
          // in the timeline.

        if (!aggWindow) {
          aggWindow = this._svg.append("g")
            .attr('class', 'agg-window-group');
          aggWindow
            .append("rect")
              .attr("class", "aggwindow-rect")
              .attr("height", height)
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", width)
              .attr("opacity", 0.6)
              .attr("style", "fill: #c0392b;");
          aggWindow
            .append('g')
              .attr('class', 'timeline-axis')
              .append('text')
                .attr('class', 'aggwindow-label')
                .attr('y', 12);
        }

        var bboxWidth,
            offset = this.dimensions.padding.left;

        // UPDATE
/*        aggWindow.select('.aggwindow-label')*/
          //.text(this.format_aggwindow(new Date(timestamp)))
          //.attr("x", function () {
            //bboxWidth = aggWindow.select('.aggwindow-label').node()
              //.getBBox().width;
            //return offset + xScale(new Date(timestamp)) - bboxWidth - 2;
          /*});*/

        aggWindow.select('.aggwindow-rect')
          .attr("x", function () {
            return Math.round(offset + xScale(new Date(timestamp)));
          })
          .transition()
          .duration(this.transTime)
          .attr("height", height)
          .attr("width", width);

        if (oldDimensions && this.dimensions.height < oldDimensions.height) {
          this._svg.select('.agg-window-group').select('.aggwindow-rect')
            .transition()
            .delay(this.transTime)
            .duration(this.transTime)
            .attr("height", height)
            .attr("width", width);
        } else {
          this._svg.select('.agg-window-group').select('.aggwindow-rect')
            .transition()
            .duration(this.transTime)
            .attr("height", height)
            .attr("width", width);
        }
      }
    },

    /**
     * @function
     * @summary Resizes the timeline.
     * @description Makes a deep copy of the old dimensions, updates canvas,
     * updates all elements, redraws axis.
     *
     * @param {object} dimensions object containing, width, height, height per
     *  line of events, height per line of bars and an object containing top,
     *  bottom, left and right padding. All values in px.
     * @param {int} timestamp - timestamp in milliseconds since epoch.
     * @param {interval} interval - aggregation interval in ms.
     * @param {object} features - geojson object with event features.
     * @param {int} nEvents - number of event types (event series).
     */
    resize: {
      value: function (newDimensions, timestamp, interval, nEvents) {

        var oldDimensions = angular.copy(this.dimensions);
        this.dimensions = newDimensions;
        this._svg = updateCanvas(this._svg, oldDimensions, this.dimensions);

        ordinalYScale = makeEventsYscale(initialHeight, this.dimensions);

        xScale.range([0, newDimensions.width - newDimensions.padding.right]);

        drawTimelineAxes(this._svg, xScale, newDimensions);
        this.updateElements(
          oldDimensions, timestamp, interval);
      }
    },

    /**
     * @function
     * @summary Update all elements to accomadate new dimensions.
     *
     * @param {object} oldDimensions - copy of the old dimensions
     * @param {int} timestamp - timestamp in milliseconds since epoch.
     * @param {interval} interval - aggregation interval in ms.
     */
    updateElements: {
      value: function (oldDimensions, timestamp, interval) {
        if (bars && oldDimensions) {
          updateRectangleElements(bars, xScale, oldDimensions, this.dimensions);
        }
        if (futureIndicator) {
          updateFutureIndicator(
            futureIndicator,
            xScale,
            oldDimensions,
            this.dimensions
          );
        }
        if (aggWindow) {
          this.drawAggWindow(timestamp, interval, oldDimensions);
        }
      }
    },

    /**
     * @function
     * @summary Updates, adds or removes all lines in the data object.
     *
     * @param {array} data array of objects:
     *   [{properties.timestamp_end: timestamp,
     *     properties.timestamp_start: timestamp,
     *     properties.event_series_id: event_series id,
     *     geometry.coordinates: [lat, lon]}]
     * @param {integer} order - Order of events.
     * @param {string} slug - Slug of event layer.
     * @param {string} color - Hex color code.
     */
    drawLines: {
      value: function (data, order, slug, color) {
        lines = drawLineElements(
          this._svg,
          this.dimensions,
          xScale,
          ordinalYScale,
          data,
          order,
          slug,
          color
        );
      }
    },

    /**
     * @function
     * @summary Updates, adds or removes all bars in the data object.
     *
     * @param {array} data - array of arrays [[bar_timestamp, bar_height]]
     */
    drawBars: {
      value: function (data) {

        /**
         * candidate to replace with Dirk's null checker function.
         */
        if (data === 'null') {
          return false;
        }

        var height = this.dimensions.bars;

        var y = this._maxMin(data, '1');
        var options = {scale: 'linear'};
        var yScale = this._makeScale(
          y,
          {min: 0, max: height},
          options
        );
        bars = drawRectElements(
          this._svg, this.dimensions, data, xScale, yScale);
      }
    },

    /**
     * @function
     * @summary Remove bars from timeline.
     */
    removeBars: {
      value: function () {
        drawRectElements(this._svg, this.dimensions, []);
        bars = undefined;
      }
    },

    /**
     * @function
     * @summary Update domain of scale and call functions to update timeline to
     * new scale.
     *
     * @param {int} start - timestamp in ms since epoch.
     * @param {int} end - timestamp in ms since epoch.
     * @param {int} interval - aggregation window in ms.
     */
    zoomTo: {
      value: function (start, end, interval) {
        xScale.domain([new Date(start), new Date(end)]);
        this.addZoomListener();
        this.drawAggWindow(start, interval);
      }
    },

    addZoomListener: {
      value: function (zoomFn, zoomEndFn) {
        if (zoomFn) {
          zoomed = setZoomFunction(
            this._svg,
            this.dimensions,
            xScale,
            zoomFn
          );
        }
        if (zoomEndFn) {
          zoomend = setZoomEndFunction(zoomEndFn);
        }
        this._svg.call(d3.behavior.zoom()
          .x(xScale)
          .on("zoom", zoomed)
          .on("zoomend", zoomend)
        );
      }
    }
  });


  /**
   * @function
   * @summary Draw timeline axes.
   *
   * @param {object} svg - timeline svg elements.
   * @param {object} xAxis - D3 axis object.
   * @param {object} dimensions - dimensions object.
   * @param {int} duration - duration in ms.
   */
  var drawTimelineAxes = function (svg, xScale, dimensions, duration) {
    var width = Timeline.prototype._getWidth(dimensions);
    // The actual d3-axis is smaller than the timeline. The scale is copied
    // and transformed to an axis with a restricted range and domain.
    var xAxisScale = xScale.copy();

    var XAXIS_PADDING = 50;

    xAxisScale
      .domain([
        xScale.invert(XAXIS_PADDING),
        xScale.invert(width - XAXIS_PADDING)
      ])
      .range([XAXIS_PADDING, width - XAXIS_PADDING]);

    var xAxis = Timeline.prototype._makeAxis(
      xAxisScale,
      {orientation: "bottom", ticks: 7}
    );

    Timeline.prototype._drawAxes(svg, xAxis, dimensions, false, duration);
    var axisEl = svg.select('#xaxis')
        .attr("class", "x axis timeline-axis");

  };

  /**
   * Draw start stop draws the fixed text labels displaying start and stop of
   * the domain.
   *
   * @param  {svg}    svg
   * @param  {scale}  xScale
   * @param  {object} dimensions
   */
  var drawStartStop = function (svg, xScale, dimensions) {
    var format = Timeline.prototype.format,
        height = Timeline.prototype._getHeight(dimensions),
        width = Timeline.prototype._getWidth(dimensions),
        startEl = svg.select('.timeline-start-stop')
          .select('.tick-start').select('text'),
        stopEl = svg.select('.timeline-start-stop')
          .select('.tick-stop').select('text');

    if (!startEl[0][0]) {
      startEl = svg
        .append('g')
        .attr('class', 'timeline-start-stop timeline-axis')
        .attr("transform", "translate(0, " + height + ")")
          .append('g')
          .attr('class', 'tick tick-start')
          .append('text')
            .attr('y', 9)
            .attr('x', dimensions.padding.left)
            .attr('dy', '.71em')
            .style('text-align', 'left')
            .style('font-weight', 'bold')
            .style('opacity', '1');
      stopEl = svg.select('.timeline-start-stop')
        .append('g')
          .attr('class', 'tick tick-stop')
          .append('text')
            .attr('y', 9)
            .attr('dy', '.71em')
            .style('text-align', 'right')
            .style('font-weight', 'bold')
            .style('opacity', '1');
    }

    startEl
      .text(format(xScale.domain()[0]));
    stopEl
      .text(format(xScale.domain()[1]))
      .attr('x', dimensions.width - dimensions.padding.right
        - stopEl.node().getBBox().width);
  };

  /**
   * @function
   * @summary Creates groups according to dimensions to accomodate all timeline
   * elements
   *
   * @param  {object} svg element to create timeline.
   * @param  {object} dimensions object containing, width, height, height per
   *  line of events, height per line of bars and an object containing top,
   *  bottom, left and right padding. All values in px.
   * @returns {object} svg timeline svg.
   */
  var addElementGroupsToCanvas = function (svg, dimensions) {
    var width = Timeline.prototype._getWidth(dimensions),
    height = Timeline.prototype._getHeight(dimensions);
    // Create group for rain bars
    svg.select('g').append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('id', 'rain-bar');
    // Create group for lines
    svg.select('g').append('g')
      .attr('height', height)
      .attr('width', width)
      .attr('id', 'circle-group');

    return svg;

  };

  /**
   * @function
   * @summary Updates the timeline svg. With a delay when getting smaller,
   * without delay when becoming larger.
   *
   * @param  {object} svg - element to create timeline.
   * @param  {object} oldDims - object containing, width, height, height per
   *  line of events, height per line of bars and an object containing top,
   *  bottom, left and right padding. All values in px.
   *  @param {object} newDims - new dimensions, same structure as oldDims.
   */
  var updateCanvas = function (svg, oldDims, newDims) {
    var width = Timeline.prototype._getWidth(newDims),
    height = Timeline.prototype._getHeight(newDims);
    if (newDims.height < oldDims.height) {
      svg.transition()
        .delay(Timeline.prototype.transTime)
        .duration(Timeline.prototype.transTime)
        .attr('height', newDims.height)
        .attr('width', newDims.width)
        .select("g")
        .attr("transform", "translate(" + newDims.padding.left + ", 0)")
        .select('#xaxis')
        .attr("transform", "translate(0 ," + height + ")");
      svg.select('.timeline-start-stop')
        .transition()
        .delay(Timeline.prototype.transTime)
        .duration(Timeline.prototype.transTime)
        .attr("transform", "translate(0, " + height + ")");
    } else {
      svg.transition()
        .duration(Timeline.prototype.transTime)
        .attr('height', newDims.height)
        .attr('width', newDims.width)
        .select("g")
        .attr("transform", "translate(" + newDims.padding.left + ", 0)")
        .select('#xaxis')
        .attr("transform", "translate(0 ," + height + ")");
      svg.select('.timeline-start-stop')
        .transition()
        .duration(Timeline.prototype.transTime)
        .attr("transform", "translate(0, " + height + ")");
    }
    svg.select("g").select(".plot-temporal")
      .attr("height", height)
      .attr("width", width);
    // Update rain bar group
    svg.select('g').select('#rain-bar')
      .attr('width', width)
      .attr('height', height);
    // Update circle group
    svg.select('g').select('#circle-group')
      .attr('width', width)
      .attr('height', height);
    return svg;
  };

  /**
   * @function
   * @summary Create function that updates all elements to zoom action and
   * calls zoomFn.
   * @description Put all scope specific in the zoom callback from the
   * directive, all the standard (re-)placement of elements in here.
   */
  var setZoomFunction = function (
    svg, dimensions, xScale, zoomFn) {
    var zoomed = function () {
      d3.event.sourceEvent.preventDefault();

      drawTimelineAxes(svg, xScale, dimensions);

      if (bars) {
        var barData = bars.data();
        if (barData[0] !== undefined) {
          var newWidth = xScale(barData[1][0]) - xScale(barData[0][0]);
          bars
            .attr("x", function (d) { return xScale(d[0]) - newWidth; })
            .attr('width', newWidth);
        }
      }

      if (futureIndicator) {
        futureIndicator
          .attr('x', function () {
            return xScale(Date.now());
          });
      }

      if (lines) {
        var xOneFunction = function (d) {
          return xScale(d.properties.timestamp_end);
        };
        var xTwoFunction = function (d) {
          return xScale(d.properties.timestamp_start);
        };

        d3.select("#circle-group").selectAll("line")
          .attr("x1", xOneFunction)
          .attr("x2", xTwoFunction);
      }
      if (zoomFn) {
        zoomFn(xScale);
      }
    };
    return zoomed;
  };

  /**
   * @function
   * @summary Create zoomend.
   */
  var setZoomEndFunction = function (zoomEndFn) {
    var zoomend = function () {
      zoomEndFn();
    };
    return zoomend;
  };

  /**
   * @function
   * @summary Creates click function.
   * @description Creates click function. If default is prevented, the click
   * was a zoom.
   */
  var setClickFunction = function (xScale, dimensions, clickFn) {
    var clicked = function () {
      // Check whether user is dragging instead of clicking
      if (!d3.event.defaultPrevented) {
        clickFn(d3.event, xScale, dimensions);
      }
    };
    return clicked;
  };

  /**
   * @function
   * @summary Moves rectangle elements to right position relative to the
   * timeline svg and xaxis.
   * @description Everything to the svg is relative to the top left corner, if
   * the timeline grows, the bars need to move further down. The amount is
   * computed from the difference between the old and new dimensions and the
   * move is delayed depending on the growth or shrinkage of the timeline.
   */
  var updateRectangleElements = function (rectangles, xScale, oldDimensions,
                                          newDimensions) {
    // UPDATE
    // Update old elements as needed.
    if (rectangles[0].length > 0) {
      var barHeight = newDimensions.bars,
          y = Timeline.prototype._maxMin(rectangles.data(), '1'),
          options = {scale: 'linear'},
          newHeight = Timeline.prototype._getHeight(newDimensions),
          oldHeight = Timeline.prototype._getHeight(oldDimensions),
          heightDiff = newHeight - oldHeight,
          yScale = Timeline.prototype._makeScale(
            y,
            {min: 0, max: barHeight},
            options),
            barWidth = Number(rectangles.attr('width'));

      if (heightDiff < 0) {

        rectangles.transition()
          .duration(Timeline.prototype.transTime)
          .delay(Timeline.prototype.transTime)
          .attr("height", function (d) {return yScale(d[1]); })
          .attr("y", function (d) {
            return newHeight - yScale(d[1]);
          })
          .attr("x", function (d) {
            return xScale(d[0]) - barWidth;
          });

      } else {
        rectangles.transition()
          .duration(Timeline.prototype.transTime)
          .attr("height", function (d) {return yScale(d[1]); })
          .attr("y", function (d) {
            return newHeight - yScale(d[1]);
          })
          .attr("x", function (d) {
            return xScale(d[0]) - barWidth;
          });
      }
    }
  };

  /**
   * @function
   * @summary update future indicator.
   *
   * @param {object} futureIndicator - D3 selection.
   * @param {object} xScale - D3 scale.
   * @param {object} oldDimensions - previous timeline dimensions object.
   * @param {object} dimensions - timeline dimensions object.
   */
  var updateFutureIndicator = function (
    futureIndicator,
    xScale,
    oldDimensions,
    dimensions
    ) {

    var height = Timeline.prototype._getHeight(dimensions);

    futureIndicator
     .attr('x', function () {
        return xScale(Date.now());
      });

    if (dimensions.height < oldDimensions.height) {
      futureIndicator
       .transition()
       .delay(Timeline.prototype.transTime)
       .duration(Timeline.prototype.transTime)
       .attr('height', height);
    } else {
      futureIndicator
       .transition()
       .duration(Timeline.prototype.transTime)
       .attr('height', height);
    }
  };

  /**
   * @function
   * @summary Draws horizontal line elements according to a d3 update pattern.
   *
   * @param {object} svg - timeline svg object.
   * @param {object} dimensions - timeline dimensions object.
   * @param {object} xScale - D3 scale object.
   * @param {object} yScale - D3 scale object.
   * @param {object} data - geojson data structure:
   *   [{properties.timestamp_end: timestamp,
   *     properties.timestamp_start: timestamp,
   *     properties.event_series_id: event_series id,
   *     geometry.coordinates: [lat, lon]}]
   * @param {int} order - Order of data (which level to draw in timeline).
   * @param {string} slug - slug of event series.
   * @param {string} color - Hex color code.
   */
  var drawLineElements = function (
    svg, dimensions, xScale, yScale, data, order, slug, color) {

    var xOneFunction = function (d) {
      return xScale(d.properties.timestamp_end);
    };
    var xTwoFunction = function (d) {
      return xScale(d.properties.timestamp_start);
    };
    var yFunction = function (d) { return yScale(order); };
    var colorFunction = function (d) { return color; };

    // if data exists, check if group is available for this series and create
    // if no data, remove lines
    if (data !== undefined) {
      var group = svg
                    .select("g")
                    .select("#circle-group")
                    .select("#" + slug);
      if (!group[0][0]) {
        group = svg.select("g").select("#circle-group").append("g")
          .attr("id", slug);
      }

      // DATA JOIN
      // Join new data with old elements, based on the id value.
      lines = group.selectAll("line")
        .data(data, function  (d) { return d.id; });
    } else if (data === undefined) {
      // if no data is defined, remove all groups
      var groups = svg.select("g").select("#circle-group").selectAll("g");
      groups.remove();

      return;
    }

    // UPDATE
    // Update old elements as needed.
    lines.transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("stroke", colorFunction)
      .attr("x1", xOneFunction)
      .attr("x2", xTwoFunction)
      .attr("y1", yFunction)
      .attr("y2", yFunction);

    // ENTER
    // Create new elements as needed.
    lines.append("g");
    lines.enter().append("line")
      .attr("class", "event selected")
      .attr("stroke", colorFunction)
      .attr("stroke-linecap", "round")
      .attr("stroke-opacity", 0.8)
      .attr("stroke-width", 10)
    .transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("x1", xOneFunction)
      .attr("x2", xTwoFunction)
      .attr("y1", yFunction)
      .attr("y2", yFunction);

    // EXIT
    // Remove old elements as needed.
    lines.exit()
      .transition()
      .delay(0)
      .duration(Timeline.prototype.transTime)
    .transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("stroke-width", 0)
      .style("fill-opacity", 0)
      .remove();

    return lines;
  };

  /**
   * @function
   * @summary Draws bar elements according to a d3 update pattern.
   */
  var drawRectElements = function (svg, dimensions, data, xScale, yScale) {

    // Fix for attempted draw at init load, when not having enough data:
    if (!data || !data[0] || !data[1]) {
      return;
    }

    var height = Timeline.prototype._getHeight(dimensions),
    // Join new data with old elements, based on the timestamp.
    bars = svg.select("g").select('#rain-bar').selectAll('.bar-timeline')
        .data(data, function  (d) { return d[0]; });

    var barWidth;
    if (data.length > 0) {
      barWidth = xScale(data[1][0]) - xScale(data[0][0]);
    } else {
      barWidth = 0;
    }

    // UPDATE
    // Update old elements as needed.
    bars.transition()
      .duration(Timeline.prototype.transTime)
      .attr("x", function (d) { return xScale(d[0]) - barWidth; })
      .attr('width', barWidth)
      .attr("height", function (d) { return yScale(d[1]); })
      .attr("y", function (d) { return height - yScale(d[1]); });

    // ENTER
    // Create new elements as needed.
    bars.enter().append("rect")
      .attr("class", "bar-timeline")
      .attr("x", function (d) {
        return xScale(d[0]) - barWidth;
      })
      .attr('width', barWidth)
      .attr("height", 0)
      .attr("y", height)
      .transition()
      .delay(Timeline.prototype.transTime)
      .duration(Timeline.prototype.transTime)
      .attr("height", function (d) { return yScale(d[1]); })
      .attr("y", function (d) { return height - yScale(d[1]); });

    // EXIT
    // Remove old elements as needed.
    bars.exit()
      .transition()
      .duration(Timeline.prototype.transTime)
      .attr("y", height)
      .attr("height", 0)
      .remove();

    var barsEl = svg.select("g").select('#rain-bar').node();
    barsEl.parentNode.insertBefore(barsEl, barsEl.parentNode.firstChild);

    return bars;
  };


  /**
   * @function
   * @summary Returns a d3 scale to place events vertically in lines above each
   * other.
   *
   * @param  {int} iniH initial height of the timeline in px.
   * @param  {object} dims current dimensions of the timeline.
   */
  var makeEventsYscale = function (iniH, dims) {
    return function (order) {
      return dims.events * order - 10;
    };
  };

  return Timeline;

}]);

'use strict';

/**
 * TimeLineDirective
 * @memberOf app
 *
 * @summary Timeline directive.
 *
 * @description Timeline directive.
 */
angular.module('lizard-nxt')
  .directive('timeline',
             ["$q",
              "RasterService",
              "UtilService",
              "Timeline",
              "VectorService",
              "DataService",
              "State",
              function ($q,
                        RasterService,
                        UtilService,
                        Timeline,
                        VectorService,
                        DataService,
                        State) {

  var link = function (scope, element, attrs, timelineCtrl) {

    var timelineSetsTime = false,

        showTimeline = false, // Is set by user clicking data label, when true
                              // timeline is shown.

        dimensions = {
          width: UtilService.getCurrentWidth(),
          height: 30,
          events: 25,
          bars: 35,
          padding: {
            top: 0,
            right: 0,
            bottom: 20,
            left: 0
          }
        },
        start = State.temporal.start,
        end = State.temporal.end,
        el = element.find('svg');

    var interaction = {

      /**
       * @function
       * @summary Update timeState on zoom.
       *
       * @param {object}  scale D3 xScale.
       */
      zoomFn: function (scale) {

        scope.$apply(function () {

          timelineSetsTime = true;
          State.temporal.timelineMoving = true;
          State.temporal.start = UtilService.getMinTime( scale.domain()[0].getTime() );
          State.temporal.end   = UtilService.getMaxTime( scale.domain()[1].getTime() );

          State.temporal.aggWindow = UtilService.getAggWindow(
            State.temporal.start,
            State.temporal.end,
            UtilService.getCurrentWidth()
          );
          State.temporal.at = UtilService.roundTimestamp(
            State.temporal.at,
            State.temporal.aggWindow,
            false
          );
        });

        timeline.drawAggWindow(State.temporal.at, State.temporal.aggWindow);
      },

      /**
       * @function
       * @summary Update zoomEnded to trigger new call for new timeline data.
       */
      zoomEndFn: function () {
        scope.$apply(function () {
          State.temporal.resolution = (
            State.temporal.end - State.temporal.start) /  UtilService.getCurrentWidth();
          getTimeLineData();
          State.temporal.timelineMoving = false;

          scope.$broadcast("$timelineZoomSuccess");
        });
      },

      /**
       * @function
       * @summary Move timeState.at to click location in timebar.
       * @description Update timeState.at to click location in timebar. Snaps
       * time to closest interval.
       *
       * @param {object} event - D3 event.
       * @param {object} scale - D3 scale.
       * @param {object} dimensions - object with timeline dimensions.
       */
      clickFn: function (event, scale, dimensions) {
        scope.$apply(function () {
          var timeClicked = +(scale.invert(
            event.pageX - dimensions.padding.left - UtilService.TIMELINE_LEFT_MARGIN
          ));
          State.temporal.at = UtilService.roundTimestamp(
            timeClicked,
            State.temporal.aggWindow
          );
        });
      },
    };

    // shift timeline's SVG element using it's CSS - set here by JS too stop stuff becoming unsyncable
    angular.element("#timeline-svg-wrapper svg")[0].style.left
      = UtilService.TIMELINE_LEFT_MARGIN + "px";

    // keep track of events in this scope
    scope.events = {nEvents: 0, slugs: []};

    // Initialise timeline
    var timeline = new Timeline(
      el[0], dimensions, start, end, interaction);

    setTimeout(interaction.zoomEndFn, 250);
    // HELPER FUNCTIONS

    /**
     * @function
     * @description Redetermines dimensions of timeline and calls resize.
     *
     * @param {object} newDim - object with new timeline dimensions.
     * @param {object} dim - object with old timeline dimensions.
     * @param {int} nEventTypes - number of event types (event series).
     */
    var updateTimelineHeight = function (nEventTypes) {
      var eventHeight,
          newDim = angular.copy(timeline.dimensions);

      newDim.height = dimensions.padding.bottom
        + dimensions.padding.top
        + nEventTypes * dimensions.events;

      if (getTimelineLayers(DataService.layerGroups).rain) {
        newDim.height += dimensions.bars;
      }

      newDim.height = Math.max(newDim.height, dimensions.height);

      if (showTimeline) {
        element[0].style.height = newDim.height + 5 + 'px'; // 5px margins
      }

      timeline.resize(
        newDim,
        State.temporal.at,
        State.temporal.aggWindow,
        nEventTypes
      );

    };

    /**
     * @function
     * @summary Temporary function to get relevant timeline layers from active
     *  layers.
     * @description Loops over layergroups and gets for each active layergroup
     * the vector and rain intensity layer. Those layers are used to draw data
     * in the timeline.
     *
     * TODO: refactor to query layerGroups by data type (event, raster, object)
     *
     * @param {object} layerGroups - NXT layerGroups object.
     * @returns {object} with: events (list of layers) and rain (nxtLayer).
     */
    var getTimelineLayers = function (layerGroups) {
      var timelineLayers = {events: {layers: [], slugs: []},
                            rain: undefined};
      angular.forEach(layerGroups, function (layergroup) {
        if (layergroup.isActive()) {
          angular.forEach(layergroup._dataLayers, function (layer) {
            if (layer.format === "Vector") {
              timelineLayers.events.layers.push(layer);
              timelineLayers.events.slugs.push(layer.slug);
            } else if (layer.format === "Store" &&
                       layer.slug === "radar/basic") {
              timelineLayers.rain = layer;
            }
          });
        }
      });

      return timelineLayers;
    };

    /**
     * @function
     * @summary Get data for events and rain.
     * @description Get data for events and rain. If data exists (relevant
     * layers are active), data is drawn in timeline. Timelineheight is updated
     * accordingly.
     *
     * TODO: Now data is fetched via layerGroup loop logic (getTimelineLayers).
     * That will change later when we set data.
     */
    var getTimeLineData = function () {
      var timelineLayers = getTimelineLayers(DataService.layerGroups),
          context = {eventOrder: 1,
                     nEvents: scope.events.nEvents};

      // vector data (for now only events)
      if (timelineLayers.events.layers.length > 0) {
        scope.events.nEvents = timelineLayers.events.layers.length;

        // update inactive groups with nodata so update function is called
        // appropriately.
        angular.forEach(scope.events.slugs, function (slug) {
          if (timelineLayers.events.slugs.indexOf(slug) === -1) {
            timeline.drawLines([], scope.events.nEvents, slug);
          }
        });

        // update slugs on scope for housekeeping
        scope.events.slugs = timelineLayers.events.slugs;
        getEventData();
      } else {
        scope.events.nEvents = 0;
        timeline.drawLines(undefined, scope.events.nEvents);
      }

      // raster data (for now only rain)
      if (timelineLayers.rain !== undefined) {
        getTemporalRasterData(timelineLayers.rain,
                              timelineLayers.events.length);
      } else {
        timeline.removeBars();
      }

      updateTimelineHeight(scope.events.nEvents);
    };

    /**
     * @function
     * @summary get data for event layers and update timeline.
     * @description get data for event layers and update timeline.
     */
    var getEventData = function () {
      // create context for callback function, reset eventOrder to 1.
      var context = {
        eventOrder: 1,
        nEvents: scope.events.nEvents,
        slugs: scope.events.slugs
      };
      // Get data with type === 'Event'
      DataService.getData('timeline', {
        geom: State.spatial.bounds,
        start: State.temporal.start,
        end: State.temporal.stop,
        type: 'Event'
      }).then(null, null, function (response) {

        if (response && response.data) {
          // Add it to the timeline
          timeline.drawLines(
            response.data,
            context.eventOrder,
            response.layerGroupSlug,
            response.color
          );
          context.eventOrder++;
        }
      });
    };


    /**
     * @function
     * @summary get data for temporal raster layers.
     * @description  get data for temporal raster. If it gets a response updates
     * timeline height and draws bars in timeline.
     *
     * @param {object} rasterLayer - rasterLayer object.
     * @param {integer} nEvents - number of events.
     */
    var getTemporalRasterData = function (rasterLayer, nEvents) {

      var start = State.temporal.start,
          stop = State.temporal.end,
          bounds = State.spatial.bounds;

      // Has it's own deferrer to not conflict with
      // other deferrers with the same layerSlug
      RasterService.getData(
        rasterLayer,
        {
          geom: bounds,
          start: start,
          end: stop,
          agg: 'none',
          aggWindow: State.temporal.aggWindow,
          deferrer: {
            origin: 'timeline_' + rasterLayer,
            deferred: $q.defer()
          }
        }
      ).then(function (response) {
        timeline.drawBars(response);
      });
    };

    var timelineZoomHelper = function () {
      if (!State.temporal.timelineMoving) {
        if (!timelineSetsTime) {
          State.temporal.aggWindow = UtilService.getAggWindow(
            State.temporal.start,
            State.temporal.end,
            UtilService.getCurrentWidth()
          );
          timeline.zoomTo(
            State.temporal.start,
            State.temporal.end,
            State.temporal.aggWindow
          );
          getTimeLineData();
        } else {
          timelineSetsTime = false;
        }
      }
    };

    // END HELPER FUNCTIONS

    element[0].style.height = 0;

    scope.timeline.toggleTimelineVisiblity = function () {
      showTimeline = !showTimeline;
      if (!showTimeline) {
        element[0].style.height = 0;
      } else {
        updateTimelineHeight(scope.events.nEvents);
      }
    };

    // WATCHES

    /**
     * Updates area when user moves map.
     */
    scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      getTimeLineData();
    });

    /**
     * Updates area when users changes layers.
     */
    scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      getTimeLineData();
    });

    /**
     * Timeline is updated when something other than the timeline
     * updates the temporal extent.
     */
    scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      timelineZoomHelper();
    });

    scope.$on("$timelineZoomSuccess", function () {
      timelineZoomHelper();
    });

    /**
     * Update aggWindow element when timeState.at changes.
     */
    scope.$watch(State.toString('temporal.at'), function (n, o) {
      timeline.drawAggWindow(State.temporal.at, State.temporal.aggWindow);
    });

    /**
     * Round timeState.at when animation stops.
     */
    scope.$watch(State.toString('temporal.playing'), function (n, o) {
      if (n === o || n) { return true; }
      State.temporal.at = UtilService.roundTimestamp(
        State.temporal.at + State.temporal.aggWindow / 2,
        State.temporal.aggWindow,
        false
      );
    });

    /**
     * The timeline can be too early on initialization.
     * The leaflet events are not even started loading,
     * so the call returns an empty array.
     *
     * If nobody touches nothing, that means the timeline
     * won't show events, whilst they are being drawn
     * on the map.
     *
     * This evenListener ensures a retrieval of data
     * after the browser is done doing requests.
     */
    window.addEventListener('load', function () {
      getTimeLineData();
    });

    /**
     * Update timeline when browser window is resized.
     */
    window.onresize = function () {

      timeline.dimensions.width = UtilService.getCurrentWidth();
      timeline.resize(
        timeline.dimensions,
        State.temporal.at,
        State.temporal.aggWindow,
        scope.events.nEvents // TODO: get nEvents from somewhere
      );
    };

    // END WATCHES

  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    templateUrl: 'timeline/timeline.html'
  };
}]);


'use strict';

/**
 * @class angular.module('lizard-nxt')
  .TimeLineCtrl
 * @memberOf app
 *
 * @summary TimeLine controller.
 *
 * @TODO : Isolate scope. Use scope for data binding to DOM elements. No need to
 *         do this on master scope.
 *
 * @desc Manipulates timeState model, animation controls.
 *
 */
angular.module('lizard-nxt')
.controller('TimeCtrl', [

  "$scope",
  "$q",
  "RasterService",
  'UtilService',
  'DataService',
  'State',

  function (

    $scope,
    $q,
    RasterService,
    UtilService,
    DataService,
    State) {

    window.requestAnimationFrame = window.requestAnimationFrame ||
                                   window.mozRequestAnimationFrame ||
                                   window.webkitRequestAnimationFrame ||
                                   window.msRequestAnimationFrame;

    var DEFAULT_NUMBER_OF_STEPS = 2000, // Small for humans to perceive as smooth.
        currentInterval = State.temporal.end - State.temporal.start,
        timeStep = Infinity, // Will be overwritten to
                             // currentInterval / DEFAULT_NUMBER_OF_STEPS
                             // Or the smallest temporalResolution of an active
                             // temporal layer.
        minLag = 0, // Let the browser determine the max speed using
                    // requestAnimationFrame.
        promise, // Is created when syncing time and resolves when all datalayers
                 // finished buffering and redrawing;
        timeOut; // runs for minLag of milliseconds before waiting for the promise
                 // to resolve and re-syncing the data layers to the new time and
                 // making a new step when animation is playing.

    State.temporal.aggWindow = UtilService.getAggWindow(
      State.temporal.start,
      State.temporal.end,
      UtilService.getCurrentWidth()
    );

    this.state = State.temporal;
    this.layerGroups = State.layerGroups;

    /**
     * Keep an eye out for temporal layers that require the animation to go
     * with a lower speed so wms requests can keep up and run more smooth if the
     * temporalResolution equals or is a multiplication of  the stepSize.
     */
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return; }
      configAnimation.call(this);
    });

    /**
     * sync data layers to new timestate and redo the animation configuration
     * since currentInterval has changed.
     */
    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      if (!State.temporal.timelineMoving) {
        configAnimation();
      }
    });

    /**
     * Sync to new time and trigger a new step when animation.playing is true.
     *
     * Layergroups need a time synced to them before being toggled. Therefore, no
     * n === o return here.
     */
    $scope.$watch(State.toString('temporal.at'), function (n, o) {
      if (n === o) { return true; }
      syncTimeWrapper(State.temporal);
    });

    /**
     * @description sets the timeStep and minLag on the basis of layergroups and
     *              their temporalResolution. The temporal layer with the smallest
     *              temporalResolution is leading.
     */
    var configAnimation = function () {
      currentInterval = State.temporal.end - State.temporal.start;
      timeStep = Infinity;
      minLag = 0;

      var activeTemporalLgs = [];

      angular.forEach(State.layerGroups.active, function (lgSlug) {
        var lg = DataService.layerGroups[lgSlug];

        if (lg.temporal) {
          // add some empty stuff to determine
          // whether animation is possible.
          activeTemporalLgs.push(null);
        }

        if (lg.temporal && lg.temporalResolution !== 0 && lg.temporalResolution < timeStep) {
          timeStep = lg.temporalResolution;
          // equals to 250 ms for 5 minutes, increases for larger timeSteps untill
          // it reaches 1 second between frames for timeSteps of > 20 minutes.
          minLag = timeStep / 1200 > 240 ? timeStep / 1200 : 250;
          minLag = minLag > 1000 ? 1000 : minLag;
        }
      });

      $scope.timeline.animatable = activeTemporalLgs.length > 0;
      // Do not continue animating when there is nothing to animate.
      if (!$scope.timeline.animatable) {
        State.temporal.playing  = false;
      }

      // If no temporal layers were found, set to a default amount.
      if (timeStep === Infinity) {
        timeStep = currentInterval / DEFAULT_NUMBER_OF_STEPS;
      }
    };

    /**
     * @function
     * @summary Toggle animation playing.
     * @description Set State.temporal.animation.playing to true or false.
     *
     * @param {} toggle - .
     */
    this.playPauseAnimation = function (toggle) {
      if (State.temporal.playing || toggle === "off") {
        State.temporal.playing = false;
      } else {
        State.temporal.playing = true;
        window.requestAnimationFrame(step);
      }
    };

    /**
     * @function
     * @summary Push animation 1 step forward when Nxt is ready.
     * @description Set new timeState.at based on stepSize. If current
     * timeSate.at is outside current temporal extent, start animation at start
     * of temporal extent.
     */
    var step =  function () {
      // Make a new step.
      $scope.$apply(function () {
        State.temporal.at += timeStep;
      });

      // reset timeState.at if out of temporal bounds
      if (State.temporal.at >= State.temporal.end ||
          State.temporal.at < State.temporal.start) {
        $scope.$apply(function () {
          State.temporal.at = State.temporal.start;
        });
      }
    };

    /**
     * @description creates a promise by calling syncTime and toggles buffer state
     *              accordingly.
     * @param  {object} timeState nxt timeState object
     */
    var syncTimeWrapper = function (timeState) {
      var defer = $q.defer();

      if (timeState.playing) {
        progressAnimation(defer.promise);
      }
      if (State.layerGroups.timeIsSyncing) {
        var watch = $scope.$watch(
          function () { return State.layerGroups.timeIsSyncing; },
          function (loading) {
            if (loading === false) {
              defer.resolve();
              watch();
            }
          }
        );
      } else {
        defer.resolve();
      }
    };

    /**
     * @description progresses animation when provided promiss finishes and the
     *              minLag has passed. Sets buffering when he promise is not re-
     *              solved after minLag.
     * @param  {promise} finish
     */
    var progressAnimation = function (finish) {
      // Remove any old timeout
      clearTimeout(timeOut);
      // when the minLag has passed.
      timeOut = setTimeout(function () {
        // And the layergroups are all ready.
        finish.then(function () {
          // And we are still animating.
          if (State.temporal.playing) {
            // And the browser is ready. GO!
            window.requestAnimationFrame(step);
          }
        });
      }, minLag);
    };


    /**
     * @function
     * @summary Move timeState.end to now.
     */
    this.zoomToNow = function () {

      var now = Date.now(),
          fullInterval = State.temporal.end - State.temporal.start,
          oneFifthInterval = Math.round(fullInterval * 0.2),
          fourFifthInterval = Math.round(fullInterval * 0.8);

      State.temporal.start = now - fourFifthInterval;
      State.temporal.end = now + oneFifthInterval;
      State.temporal.at = UtilService.roundTimestamp(now, State.temporal.aggWindow, false);

      // Without this $broadcast, timeline will not sync to State.temporal:
      $scope.$broadcast("$timelineZoomSuccess");
    };

    /**
     * @function
     * @summary Zooms time in or out.
     * @description multiplies or divides current time resolution by
     * ZOOMFACTOR depending on zooming in or out. Updates start and end
     * of timeState accordingly and sets new resolution on timeState.
     *
     * @param {string} action - 'in' or 'out'.
     */
    this.zoom = function (action) {

      var ZOOMFACTOR = 2,
          newResolution;

      newResolution = action === "in"
        ? State.temporal.resolution / ZOOMFACTOR
        : State.temporal.resolution * ZOOMFACTOR;

      var milliseconds = UtilService.getCurrentWidth() * newResolution;

      State.temporal.start = Math.max(State.temporal.at - milliseconds,
                                      UtilService.MIN_TIME);
      State.temporal.end = Math.min(State.temporal.at + milliseconds,
                                    UtilService.MAX_TIME);
      State.temporal.resolution = newResolution;

      // Without this $broadcast, timeline will not sync to State.temporal:
      $scope.$broadcast("$timelineZoomSuccess");
    };

  }
]);

/**
 * @name Graph
 * @class angular.module('lizard-nxt')
  .Graph
 * @memberOf app
 *
 * @summary Service to create and update a graph
 *
 * @description Inject "Graph" and call new graph(<args>) to create a
 * graph. Currently the graph supports lines, bars, donut, and a flat
 * donut called horizontal stacked bar. The user may interact with
 * the graph through click and hover functions. Graph inherits from
 * NxtD3, a lower level d3 helper class.
 *
 * NOTE: The donut code is currently not used anywhere in lizard-client.
 *
 * Everything in the graphs is animated according to NxtD3.transTime.
 */
angular.module('lizard-nxt')
  .factory("Graph", ["NxtD3", function (NxtD3) {

  /**
   * @constructor
   * @memberOf angular.module('lizard-nxt')
  .Graph
   *
   * @param {object} element    svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   * @param {object} xDomainInfo - override the domain for the graphs.
   */
  function Graph(element, dimensions, xDomainInfo) {
    if (xDomainInfo && xDomainInfo.start && xDomainInfo.end) {
      NxtD3.call(this, element, dimensions, xDomainInfo.start, xDomainInfo.end);
      this._xDomainInfo = xDomainInfo;
    } else {
      NxtD3.call(this, element, dimensions);
    }
    this._svg = this._createDrawingArea();
  }

  Graph.prototype = Object.create(NxtD3.prototype, {

    constructor: Graph,

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {object}    data object. Currently supports the format:
     *                    [
     *                      {
     *                        "<key to color>": "<color str>",
     *                        "<value key": <value int>,
     *                        "<label key>": "<label>"
     *                      },
     *                      ...,
     *                    ]
     * @description       If necessary creates a d3 pie and arc and
     *                    draws the features in the data element.
     */
    drawDonut: {
      value: function (data) {
        if (!this.dimensions.r || this._arc || this._pie) {
          this._donut = createDonut(this.dimensions);
        }
        drawPie(this._svg, this.dimensions, this._donut, data);
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {object} data   Currently supports the format:
     *                        [
     *                          [value, value],
     *                          ...,
     *                        ]
     * @param {object} keys   Mapping between x and y values of data object:
     *                        example: {x: 0, y: 1}
     * @param {object} labels Object {x: 'x label', y: 'y label'} will be
     *                        mapped to axis labels of the graph
     * @param {boolean} temporal to draw an time axis or not
     * @description           Draws a line, if necessary sets up the graph,
     *                        if necessary modifies domain and redraws axis,
     *                        and draws the line according to the data object.
     *                        Currently only a linear scale on the x-axis is supported.
     */
    drawLine: {
      value: function (data, keys, labels, temporal) {
        if (!this._xy) {
          var options = {
            x: {
              scale: 'time',
              orientation: 'bottom'
            },
            y: {
              scale: 'linear',
              orientation: 'left'
            }
          };
          // pass options for time graph or use defaults
          this._xy = this._createXYGraph(data, keys, labels, temporal ? options : undefined);
        } else {
          this._xy = rescale(this._svg, this.dimensions, this._xy, data, keys);
          drawLabel(this._svg, this.dimensions, labels.y, true);
        }
        var line = this._createLine(this._xy, keys);
        this._path = drawPath(this._svg, line, data, this.transTime, this._path);
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt').Graph
     * @param {object} data   Currently supports arrays of arrays or objects
     *                        with x value, y value, <optional> color and
     *                        <optional> category.
     * @param {object} keys   Mapping between x, y and optional color, and
     *                        category values of data object: example:
     *                        {x: 0, y: 1} or:
     *                        {x: 'xValue', y: 'yValue', color: 'eventColor',
     *                        categoy: 'cat'};
     * @param {object} labels Object {x: 'x label', y: 'y label'} will be
     *                        mapped to axis labels of the graph
     * @param {string} scale  Whether the graph has a scale other than temporal.
     *                        If it is of a temporal nature the x-axis will by
     *                        default be the temporal axis.
     * @description           Draws a barchart, if necessary sets up the graph,
     *                        if necessary modifies domain and redraws axis,
     *                        and draws the line according to the data object.
     *                        Currently only a time scale on the x-axis is
     *                        supported. It assumes that every segment has a
     *                        data element.
     */
    drawBars: {
      value: function (data, keys, labels, scale) {
        if (keys.category) {
          data = createYValuesForCumulativeData(data, keys);
        }
        if (!this._xy) {
          var options = {
            x: {
              scale: scale,
              orientation: 'bottom'
            },
            y: {
              scale: 'linear',
              orientation: 'left'
            }
          };
          this._xy = this._createXYGraph(data, keys, labels, options);
          this._xy.y.scale.domain([0, this._xy.y.maxMin.max]);
        } else {
          this._xy = rescale(
            this._svg,
            this.dimensions,
            this._xy,
            data,
            keys,
            {y: 0},
            this._xDomainInfo
          );
          drawLabel(this._svg, this.dimensions, labels.y, true);
        }

        drawVerticalRects(
          this._svg,
          this.dimensions,
          this._xy,
          keys,
          data,
          this.transTime,
          this._xDomainInfo
        );
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt').Graph
     * @param {object}    data object. Currently supports the format:
     *                    [
     *                      {
     *                        "<key to color>": "<color str>",
     *                        "<value key": <value int>,
     *                        "<label key>": "<label>"
     *                      },
     *                      ...,
     *                    ]
     * @param {object} keys   Mapping between x values of data object:
     *                        example: {x: 'color'}
     * @param {object} labels Object {x: 'x label'} will be
     *                        mapped to axis labels of the graph
     * @description           If necessary an x-scale, axis, draws the
     *                        label and sets up a mousemove listener.
     *                        It draws the rectangles.
     */
    drawHorizontalStack: {
      value: function (data, keys, labels) {
        if (!this._x) {
          var options = {
            scale: 'linear',
            orientation: 'bottom',
            tickFormat: d3.format(".0%") // Custom tickFomat in percentages
          };
          this._x = createXGraph(this._svg, this.dimensions, labels, options);
        }
        // normalize data
        var total = d3.sum(data, function (d) {
          return Number(d[keys.x]);
        });
        angular.forEach(data, function (value, key) {
          value[keys.x] = value[keys.x] / total;
        });
        drawHorizontalRectss(this._svg, this.dimensions, this.transTime, this._x.scale, data, keys, labels);
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {function} callback
     * @description      Sets a listener on the drawing rectangle
     *                   and on mousemove calls the callback with
     *                   the current position on the drawing area.
     */
    followMouse: {
      value: function (callback) {
         // Move listener rectangle to the front
        var el = this._svg.select('g').select('#listeners').node();
        el.parentNode.appendChild(el);
        var scale = this._xy.x.scale;
        this._svg.select('g').select('#listeners')
          .on('mousemove', function () {
            var pos = scale.invert(d3.mouse(this)[0]);
            callback(pos);
          });
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {function} callback
     * @description      Sets a listener on the drawing rectangle
     *                   and on mouseout calls the callback.
     */
    mouseExit: {
      value: function (callback) {
        this._svg.select('g').select('#listeners')
          .on('mouseout', function () {
            callback();
          });
      }
    },

    /**
     * @function
     * @memberOf angular.module('lizard-nxt')
  .Graph
     * @param {int}    draw   Timestamp in ms from epoch
     * @description           draws the now according the
     *                        current active scale.
     */
    drawNow: {
      value: function (now) {
        // console.log("[F] drawNow: now =", new Date(now));
        // console.log("---> now (scaled)", this._xy.x.scale(now));
        this._drawNow(now, this._xy.x.scale);
        // move to the front
        var el = this._svg.select('.now-indicator').node();
        el.parentNode.appendChild(el);
      }
    },

    _createXYGraph: {
      value: function (data, keys, labels, options) {
        if (!options) {
          options = {
            x: {
              scale: 'linear',
              orientation: 'bottom'
            },
            y: {
              scale: 'linear',
              orientation: 'left'
            }
          };
        }
        var xy = {x: {}, y: {}};
        var self = this;

        angular.forEach(xy, function (value, key) {
          var y = key === 'y';
          xy[key] = self._createD3Objects(data, keys[key], options[key], y);
          drawAxes(self._svg, xy[key].axis, self.dimensions, y);
          drawLabel(self._svg, self.dimensions, labels[key], y);
        });
        return xy;
      }
    }
  });

  var createPie, createArc, drawPie, drawAxes, drawLabel, needToRescale, drawPath, setupLineGraph, createDonut,
  getBarWidth, drawVerticalRects, drawHorizontalRectss, createXGraph, rescale, createYValuesForCumulativeData;

  /**
   * Creates y cumulatie y values for elements on the same x value.
   *
   * @param  {array} data array of objects.
   * @param  {object} keys mapping between x, y and keys in the data.
   * @return {array} with added y0 value and cumulative y value.
   */
  createYValuesForCumulativeData = function (data, keys) {
    var cumulativeData = [];
    // Group by x value
    d3.nest().key(function (d) {
      return d[keys.x];
    })
    .entries(data)
    // Compute y values for every group
    .forEach(function (group) {
      var y0 = 0;
      group.values = group.values.map(function (d) {
        d.y0 = y0;
        d[keys.y] += y0;
        y0 = d[keys.y];
        cumulativeData.push(d);
      });
    });

    return cumulativeData;
  };

  needToRescale = function (data, key, limit, old, xDomainInfo) {
    var newDomain;
    if (key === "y") {
      newDomain = Graph.prototype._maxMin(data, "y");
    } else {
      newDomain = xDomainInfo
        ? { min: xDomainInfo.start, max: xDomainInfo.end }
        : Graph.prototype._maxMin(data, key);
    }
    return (
      newDomain.max > old.max ||
      newDomain.max < (limit * old.max) ||
      newDomain.min !== old.min
    );
  };

  rescale = function (svg, dimensions, xy, data, keys, origin, xDomainInfo) {
    // Sensible limits to rescale. If the max
    // of the y values is smaller than 0.2 (or 20 %) of the max of the scale,
    // update domain of the scale and redraw the axis.
    var limits = {
        x: 1,
        y: 0.2
        },
        orientation = {
          x: 'bottom',
          y: 'left'
        };
    origin = origin || {};
    // Decide to rescale for each axis.
    angular.forEach(xy, function (value, key) {
      if (needToRescale(data, keys[key], limits[key], value.maxMin, xDomainInfo)) {

        value.maxMin = key === "x" && xDomainInfo
          ? { min: xDomainInfo.start, max: xDomainInfo.end }
          : Graph.prototype._maxMin(data, keys[key]);

        value.scale.domain([origin[key] || value.maxMin.min, value.maxMin.max]);
        value.axis = Graph.prototype._makeAxis(value.scale, {orientation: orientation[key]});
        drawAxes(svg, value.axis, dimensions, key === 'y' ? true : false, Graph.prototype.transTime);
      }
    });
    return xy;
  };

  drawHorizontalRectss = function (svg, dimensions, duration, scale, data, keys, labels) {
    var width = Graph.prototype._getWidth(dimensions),
        height = Graph.prototype._getHeight(dimensions),
        DEFAULT_BAR_COLOR = "#7f8c8d", // $asbestos is the default color for bars
        previousCumu = 0;

    // Create a start and end for each rectangle.
    angular.forEach(data, function (value) {
      value.start = previousCumu;
      previousCumu += value[keys.x];
    });
    // Data should be normalized between 0 and 1.
    var total = 1;

    // Join new data with old elements, based on the y key.
    var rects = svg.select('g').select('#feature-group').selectAll(".horizontal-rect")
      .data(data, function (d) { return d[keys.y]; });

    // UPDATE
    // Update elements start and width as needed.
    rects.transition()
      .duration(duration)
      .attr("x", function (d) { return scale(d.start); })
      .attr('width', function (d) { return scale(d[keys.x]); });
    // ENTER
    // Create new elements as needed.
    rects.enter().append("rect")
      .style("fill", function (d) { return d.color || DEFAULT_BAR_COLOR; })
      .attr("x", function (d) { return scale(d.start); })
      .attr("y", 0)
      .attr('class', 'horizontal-rect')
      .attr("height", height)
      .transition()
      .duration(duration)
      .attr('width', function (d) { return scale(d[keys.x]); });
    // EXIT
    // Remove old elements as needed. First transition to width = 0
    // and then remove.
    rects.exit()
      .transition()
      .duration(duration)
      .attr('width', 0)
      .remove();

    // Rects set their value on the label axis when hoovered
    rects.on('mousemove', function (d) {
      var label;
      if (d.label === -1) {
        label = Math.round(d[keys.x] * 100) + "% overig";
      } else {
        var labelstr = d.label.split('-');
        label = Math.round(d[keys.x] * 100) + '% ' + labelstr[labelstr.length - 1];
      }

      svg.select('#xlabel')
        .text(label)
        .attr("class", "selected");
    });

    // When the user moves the mouse away from the graph, put the original
    // label back in place.
    rects.on('mouseout', function (d) {
      svg.select('#xlabel')
        .text(labels.x)
        .classed({"selected": false});
    });
  };

  drawVerticalRects = function (svg, dimensions, xy, keys, data, duration, xDomainInfo) {
    // We update the domain for X, if xDomainInfo was set...
    if (xDomainInfo && xDomainInfo.start && xDomainInfo.end) {
      xy.x.scale.domain([xDomainInfo.start, xDomainInfo.end]);
    }

    var width = Graph.prototype._getWidth(dimensions),
        height = Graph.prototype._getHeight(dimensions),
        x = xy.x,
        y = xy.y,
        MIN_BAR_WIDTH = 2,
        maxBarCount = xDomainInfo
          ? (xDomainInfo.end - xDomainInfo.start) / xDomainInfo.aggWindow
          : data.length,
        barWidth = Math.max(
          MIN_BAR_WIDTH,
          Math.floor(
            getBarWidth(xy.x.scale, data, keys, dimensions, maxBarCount)
          )
        ),
        strokeWidth = barWidth === MIN_BAR_WIDTH ? 0 : 1,

        // Join new data with old elements, based on the x key.
        bar = svg.select('g').select('#feature-group').selectAll(".bar")
          .data(data);
        // duration = Graph.prototype.transTime;


    // UPDATE
    bar
      .transition()
      .duration(1)
      .delay(duration)
        // change x when bar is invisible:
        .attr("x", function (d) { return x.scale(d[keys.x]) - barWidth; })
        // change width when bar is invisible:
        .attr('width', function (d) { return barWidth; })
        .style("fill", function (d) { return d[keys.color] || ''; })
          .transition()
          .duration(duration)
          .delay(duration * 4)
            .attr("height", function (d) {
              return y.scale(d.y0) - y.scale(d[keys.y]) || height - y.scale(d[keys.y]);
            })
            .attr("y", function (d) { return y.scale(d[keys.y]); })
    ;

    // ENTER
    // Create new elements as needed.
    bar.enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d) { return x.scale(d[keys.x]) - barWidth; })
      .attr('width', function (d) { return barWidth; })
      .attr("y", function (d) { return y.scale(0); })
      .attr("height", 0)
      .style("fill", function (d) { return d[keys.color] || ''; })
      .transition()
      .duration(duration * 2)
        // Bring bars in one by one
        // .delay(function (d, i) { return i * 0.1 * duration * 2; })
        .attr("height", function (d) {
          return y.scale(d.y0) - y.scale(d[keys.y]) || height - y.scale(d[keys.y]);
        })
        .attr("y", function (d) { return y.scale(d[keys.y]); })
        .attr("stroke-width", strokeWidth);

    // EXIT
    // Remove old elements as needed.
    bar.exit()
      .transition()
      .duration(duration)
      .attr("y", height)
      .attr("height", 0)
      .remove();
  };

  getBarWidth = function (scale, data, keys, dimensions, maxBarCount) {
    return Graph.prototype._getWidth(dimensions) / maxBarCount;
  };

  createXGraph = function (svg, dimensions, labels, options) {
    var x = {};
    if (!options) {
      options = {
        scale: 'linear',
        orientation: 'bottom'
      };
    }
    var width = Graph.prototype._getWidth(dimensions),
    range = {min: 0, max: width},
    // Axis should run from zero to 100%
    domain = {min: 0, max: 1};
    x.scale = Graph.prototype._makeScale(domain, range, {scale: options.scale});
    x.axis = Graph.prototype._makeAxis(x.scale, options);
    drawAxes(svg, x.axis, dimensions, false);
    drawLabel(svg, dimensions, labels.x, false);
    return x;
  };

  drawPath = function (svg, line, data, duration, path) {
    if (!path) {
      var fg = svg.select('g').select('#feature-group');
      // bring to front
      fg.node().parentNode.appendChild(fg.node());
      path = fg.append("svg:path")
        .attr("class", "line")
        .style("stroke-width", 3);
    }
    path.datum(data)
      .transition()
      .duration(duration)
      .attr("d", function (d) {
        // Prevent returning invalid values for d
        return line(d) || "M0, 0";
      });
    return path;
  };

  drawLabel = function (svg, dimensions, label, y) {
    var width = Graph.prototype._getWidth(dimensions),
    height = Graph.prototype._getHeight(dimensions),
    // Correct 2 pixels to make sure the labels fall
    // completely within the svg
    PIXEL_CORRECTION = 2;
    var el = svg.select(y ? '#ylabel': '#xlabel');
    if (!el.empty()) { el.text(label); }
    else {
      el = svg.append("text")
        .attr('class', 'graph-text graph-label')
        .style("text-anchor", "middle")
        .text(label);
      if (y) {
        el.attr('id', 'ylabel')
          .attr('transform', 'rotate(-90)')
          .attr('y', 0)
          .attr('x', 0 - height / 2);
        el.attr('dy', 0.5 * el.node().getBBox().height + PIXEL_CORRECTION);
      } else {
        el.attr('id', 'xlabel')
          .attr('x', dimensions.padding.left + width / 2)
          .attr('y', dimensions.height - PIXEL_CORRECTION);
        el.attr('dy', - PIXEL_CORRECTION);
      }
    }
  };

  drawAxes = function (svg, axis, dimensions, y, duration) {
    // Create elements and draw axis using nxtD3 method
    Graph.prototype._drawAxes(svg, axis, dimensions, y, duration);
    var axisEl;
    // Make graph specific changes to the x and y axis
    if (y) {
      axisEl = svg.select('#yaxis')
        .attr("class", "y-axis y axis")
        .selectAll("text")
          .style("text-anchor", "end")
          .attr('class', 'graph-text');
    } else {
      axisEl = svg.select('#xaxis')
        .attr("class", "x-axis x axis")
        .selectAll("text")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .style("text-anchor", "end")
          .attr('class', 'graph-text')
          .attr("transform", "rotate(-25)");
    }
  };

  createDonut = function (dimensions) {
    var donutHeight = Graph.prototype._getHeight(dimensions);
    dimensions.r = donutHeight / 2;
    var pie = createPie(dimensions),
    arc = createArc(dimensions);
    return {
      dimensions: dimensions,
      arc: arc,
      pie: pie
    };
  };

  createPie = function (dimensions) {
    return d3.layout.pie()
      .value(function (d) {
          return d.data;
        })
      // Sorting messes with the transition
      .sort(null);
  };

  createArc = function (dimensions) {
    var ARC_INNER_RADIUS = 0.7;
    return d3.svg.arc()
      .innerRadius(dimensions.r * ARC_INNER_RADIUS)
      .outerRadius(dimensions.r);
  };

  drawPie = function (svg, dimensions, donut, data) {
    var width = Graph.prototype._getWidth(dimensions),
    donutHeight = Graph.prototype._getHeight(dimensions),
    pie = donut.pie,
    arc = donut.arc;

    // Store the displayed angles in _current.
    // Then, interpolate from _current to the new angles.
    // During the transition, _current is updated in-place by d3.interpolate.
    function arcTween(a) {
      var i = d3.interpolate(this._current, a);
      this._current = i(0);
      return function (t) {
        return arc(i(t));
      };
    }

    var donutArcs = svg.datum(data).selectAll("path").data(pie);

    donutArcs
      .transition()
      .duration(Graph.prototype.transTime)
      .attrTween("d", arcTween); // redraw the arcs

    donutArcs.enter().append("path")
      .attr("fill", function (d) {return d.data.color; })
      .attr("d", arc)
      .each(function (d) { this._current = d; }) // store the initial angles
      .attr("transform", "translate(" +
        donutHeight / 2 + ", " + donutHeight / 2 + ")");
  };

  return Graph;

}]);

'use strict';


/**
 * @ngdoc directive
 * @class graph
 * @memberof app
 * @name graph
 * @requires Graph
 * @summary Creates a Graph, adds it to the graphCtrl and watches data to
 *          call graphCtrl.updateGraph.
 * @description  Usage: <graph <type> <attrs></graph>
 *               Angular runs graph.graphCtrl, graph.compile.preCompile,
 *               <type directive>.link, graph.link. It sets up a graph
 *               object and puts it on the graphCtrl for further
 *               modifications by the subdirectives.
 */
angular.module('lizard-nxt')
  .directive('graph', ["Graph", function (Graph) {

  var graphCtrl, preCompile, link;

  /**
   * @function
   * @memberOf angular.module('lizard-nxt')
  .graph
   * @param {scope}     scope     local scope
   * @param {object}    element
   * @param {object}    attrs     data, keys, labels and now
   * @param {object}    graphCtrl controller
   * @description       sets up a graph on the controller after
   *                    the controller's instantiation, but before
   *                    the link. Dimensions have sensible defaults
   *                    that may be partially overwritten by setting
   *                    the dimensions attribute of the graph.
   */
  preCompile = function (scope, element, attrs, graphCtrl) {
    /*
                       dimensions.width
                               |
                     |         ^             |
                      ______________________  _
                     |   |                  |
                     | y |   Chart area     |
                     |___|__________________|  }- Dimensions.height
                     |   |     x axis       |
    padding.bottom-- |___|_____x label______| _
                       |
                  padding.left

    Labels are placed next to the edge of the svg, remaining padding
    space is available for the axis tick marks.
    */

    var dimensions, el;

    dimensions = {
      width: 375,
      height: 160,
      padding: {
        top: 5,
        right: 5,
        bottom: 50,
        left: 50
      }
    };
    // Overwrite anything provided by dimensions attr on element
    angular.extend(dimensions, scope.dimensions);

    el = element[0].firstChild;

    graphCtrl.yfilter = attrs.yfilter;
    graphCtrl.type = attrs.type;

    // Create the graph and put it on the controller
    graphCtrl.graph = new Graph(
      el,
      dimensions,
      scope.temporal
    );
  };

  /**
   * @function
   * @memberOf angular.module('lizard-nxt')
  .graph
   * @param {scope}     scope     local scope
   * @param {object}    element
   * @param {object}    attrs     data, keys, labels and now
   * @param {object}    graphCtrl controller
   * @description       Contains listeners to values on the element
   *                    and calls the updateFunctions of the graphCtrls
   *                    on the graphs. Suddirectives only have to implement
   *                    an update function on their controller.
   */
  link = function (scope, element, attrs, graphCtrl) {

    /**
     * Calls updateGraph when data changes.
     */
    scope.$watch('data', function (n, o) {
      if (n === o) { return true; }
      graphCtrl.setData(scope);
      // Call graph with the new data
      graphCtrl.updateData.call(graphCtrl.graph, graphCtrl.data,
                                graphCtrl.keys, graphCtrl.labels);
      // Call the graph with the now
      if (scope.temporal && scope.temporal.at) {
        graphCtrl.updateNow.call(graphCtrl.graph, scope.temporal.at);
      }
    });

    /**
     * Calls updateGraph when keys changes.
     */
    scope.$watch('keys', function (n, o) {
      if (n === o) { return true; }
      graphCtrl.setData(scope);
      // Call graph with the new data
      graphCtrl.updateData.call(graphCtrl.graph, graphCtrl.data,
                                graphCtrl.keys, graphCtrl.labels);
      // Call the graph with the now
      if (scope.temporal && scope.temporal.at) {
        graphCtrl.updateNow.call(graphCtrl.graph, scope.temporal.at);
      }
    });

    scope.$watch('temporal.at', function (n, o) {
      if (n === o) { return true; }
      if (scope.temporal && scope.temporal.at) {
        graphCtrl.updateNow.call(graphCtrl.graph, scope.temporal.at);
      }
    });
  };

  /**
   * @function
   * @memberOf angular.module('lizard-nxt')
  .graph
   * @param {scope}     $scope    local scope
   * @param {Graph}     Graph     graph service
   * @description       Stores the graph directives data and update functions
   */
  graphCtrl = function ($scope, Graph) {

    this.setData = function (scope) {

      // Provide defaults for backwards compatability
      this.data = scope.data || [];
      this.keys = scope.keys || { x: 0, y: 1 };
      this.labels = {
        x: scope.xlabel || '',
        y: scope.ylabel || ''
      };
    };

    this.setData($scope);

    this.graph = {};
    this.yfilter = '';
    this.now = $scope.temporal ? $scope.temporal.at : undefined;
    this.type = '';
    this.quantity = $scope.quantity || 'time';

    // Define data update function in attribute directives
    this.updateData = function () {};
    // Define timeState.now update function in attribute directives
    this.updateNow = function () {};
  };


  return {
    controller: graphCtrl,
    compile: function (scope, element, attrs, graphCtrl) {
      return {
        pre: preCompile,
        post: link
      };
    },
    scope: {
      data: '=',
      xlabel: '=',
      ylabel: '=',
      keys: '=',
      yfilter: '=',
      dimensions: '=',
      temporal: '=',
      quantity: '='
    },
    restrict: 'E',
    replace: true,
    template: '<div class="graph-svg-wrapper"><svg></svg></div>'
  };

}]);


/**
 * @ngdoc directive
 * @class graph
 * @memberof angular.module('lizard-nxt')
  .graph
 * @name donut
 * @requires graph
 * @description       Draws a donut graph. Currently not in use by nxt.
 */
angular.module('lizard-nxt')
  .directive('donut', [function () {

  var link = function (scope, element, attrs, graphCtrl) {

    var graph = graphCtrl.graph;

    graph.drawDonut(graphCtrl.data);
    // Function to call when data changes
    graphCtrl.updateData = graph.drawDonut;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A',
  };

}]);

/**
 * @ngdoc directive
 * @class graph
 * @memberof angular.module('lizard-nxt')
  .graph
 * @name line
 * @requires graph
 * @description       Draws a line. Additionally it sets the
 *                    location of the users mouse on the parent
 *                    scope. It was initially written for the
 *                    interction and maaiveldcurve.
 * @TODO: enhance its functionality to draw timeseries.
 */
angular.module('lizard-nxt')
  .directive('line', [function () {

  var link = function (scope, element, attrs, graphCtrl) {

    var data = graphCtrl.data,
    graph = graphCtrl.graph,
    keys = graphCtrl.keys,
    temporal = graphCtrl.type === 'temporal';

    graph.drawLine(data, keys, graphCtrl.labels, temporal);

    graph.followMouse(function (position) {
      scope.$apply(function () {
        scope.$parent.box.mouseLoc = position;
      });
    });

    graph.mouseExit(function () {
      scope.$apply(function () {
        scope.$parent.box.mouseLoc = undefined;
      });
    });

    if (temporal) {
      graph.drawNow(graphCtrl.now);
      // Function to call when timeState.at changes
      graphCtrl.updateNow = graph.drawNow;
    }

    // Function to call when data changes
    graphCtrl.updateData = graph.drawLine;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };
}]);


/**
 * @ngdoc directive
 * @class graph
 * @memberof angular.module('lizard-nxt')
  .graph
 * @name barChart
 * @requires graph
 * @description       Draws a barchart. With dynamic axis label.
 *                    Initially written for the rain graph.
 */
angular.module('lizard-nxt')
  .directive('barChart', ['$filter', function ($filter) {

  var link = function (scope, element, attrs, graphCtrl) {

    var data = graphCtrl.data,
        labels = graphCtrl.labels,
        filter = graphCtrl.yfilter,
        graph = graphCtrl.graph,
        keys = graphCtrl.keys,
        quantity = graphCtrl.quantity;

    // Apply the filter on the ylabel to go from aggWindow
    // in ms to a nice 'mm/dag' label. This could be migrated
    // to the html, but filtering from the DOM is expensive
    // in angular.
    if (filter) {
      labels.y = $filter(filter)(labels.y);
    }

    graph.drawBars(data, keys, labels, quantity);
    graph.drawNow(graphCtrl.now);

    // Function to call when data changes
    graphCtrl.updateData = function (data, keys, labels) {
      if (filter) {
        labels.y = $filter(filter)(labels.y);
      }
      this.drawBars(data, keys, labels, quantity);
    };

    // Function to call when timeState.at changes
    graphCtrl.updateNow = graph.drawNow;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };

}]);


/**
 * @ngdoc directive
 * @class graph
 * @memberof angular.module('lizard-nxt')
  .graph
 * @name horizontal stack
 * @requires graph
 * @description       Draws a barchart. With dynamic axis label.
 *                    Initially written to substitute the landuse donut.
 */
angular.module('lizard-nxt')
  .directive('horizontalStack', [function () {

  var link = function (scope, element, attrs, graphCtrl) {

    var graph = graphCtrl.graph;

    graph.drawHorizontalStack(graphCtrl.data, graphCtrl.keys, graphCtrl.labels);

    // Function to call when data changes
    graphCtrl.updateData = graph.drawHorizontalStack;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };

}]);


/**
 * Initialise angular.module('dashboard')
 *
 */
angular.module('dashboard', []);

angular.module('dashboard')
  .controller("DashboardCtrl", ["$scope", "State", function ($scope, State) {

  $scope.eventAggs = undefined;

  $scope.state = State;

  // dimensions are dependent on screen size.
  // this is calculated in directive.
  $scope.dimensions = {};

  // statistics (maybe get dynamically from event aggregation service?)
  $scope.stats = ['max', 'min', 'mean', 'sum', 'median', 'count'];

  // default selection
  $scope.selectedStat = $scope.stats[2];

}]);


angular.module('dashboard')
  .directive('dashboard',
             ["EventAggregateService", "State", "DataService",
              function (EventAggregateService, State, DataService) {

  // draw full screen graph
  var link = function (scope, element, attrs) {

    var getWidth = function () {
      return element.find('.dashboard-inner').width();
    };

    var getHeight = function () {
      return element.height();
    };

    scope.dimensions.width = getWidth() - 10;

    var aggregateEvents = function () {
      var eventAgg;
      // reset eventAggs
      scope.eventAggs = [];
      angular.forEach(DataService.layerGroups, function (lg) {
        lg.getData({
          geom: State.spatial.bounds,
          start: State.temporal.start,
          end: State.temporal.end,
          type: 'Event'
        }).then(null, null, function (response) {

          if (response && response.data) {
            // aggregate response
            eventAgg = {
              data: EventAggregateService.aggregate(
                      response.data,
                      State.temporal.aggWindow,
                      lg.mapLayers[0].color
                    ),
              ylabel: lg.name,
              baseColor: lg.mapLayers[0].color
            };

            scope.eventAggs.push(eventAgg);
            // calculate new dimensions
            scope.dimensions.height =
              (getHeight() / scope.eventAggs.length) - 20;
          }
        });
      });
    };

    /**
     * Updates dashboard when user pans or zooms map.
     */
    scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      aggregateEvents();
    });

    /**
     * Updates dashboard when layers are added or removed.
     */
    scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      aggregateEvents();
    });

    /**
     * Updates dashboard when time zoom changes.
     */
    scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o) { return true; }
      aggregateEvents();
    });

    // init
    aggregateEvents();

    // hack to get color map for legend
    scope.getColorMap = EventAggregateService.getColorMap;
  };

  return {
    link: link,
    templateUrl: 'dashboard/dashboard.html',
    replace: true,
    restrict: 'E'
  };

}]);


/**
 * Initialise angular.module('scenarios')
 *
 */
angular.module('scenarios', []);

angular.module('scenarios')
  .controller("ScenariosCtrl", ["$scope", "Restangular", function ($scope, Restangular) {
  
  $scope.scenarios = [];
  $scope.selectedScenario = null;

  Restangular.all('api/v1/scenarios/').getList()
    .then(function (scenarios) {
      $scope.scenarios = scenarios;
    }); 
  

  /**
   * @description Selects or deselects scenario.
   *
   */
  $scope.select = function (scenario) {
    if ($scope.selectedScenario === null) {
      $scope.selectedScenario = scenario;
    } else if (scenario.id === $scope.selectedScenario.id) {
      $scope.selectedScenario = null;
    } else {
      $scope.selectedScenario = scenario;
    }
  };
  
}]);


angular.module('scenarios')
  .directive('scenarios', function () {
    var link =  function () {
    };

  return {
    link: link,
    templateUrl: 'scenarios/scenarios.html',
    replace: true,
    restrict: 'E'
  };

});

/**
 *
 * Initialize user-menu module
 *
 */
angular.module('user-menu', []);

/**
 *
 * Shows user-menu and has logout login buttons
 */
angular.module('user-menu')
  .directive('userMenu', function () {
   
  var link = function () {};

  return {
    restrict: 'E',
    replace: true,
    link: link,
    templateUrl: 'user-menu/user-menu.html'
  }
  });

angular.module('data-menu')
  .directive('singleClick', ['$parse', function ($parse) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        var fn = $parse(attr.singleClick);
        var delay = 300,
            clicks = 0,
            timer = null;

        element.on('click', function (event) {
          clicks++;  //count clicks
          if (clicks === 1) {
            timer = setTimeout(function () {
              scope.$apply(function () {
                fn(scope, { $event: event });
              });
              clicks = 0;             //after action performed, reset counter
            }, delay);
          } else {
            clearTimeout(timer);    //prevent single-click action
            clicks = 0;             //after action performed, reset counter
          }
        });
      }
    };
  }
]);
/**
 * Opacity slider for layer-chooser.
 */
angular.module('data-menu')
  .directive('opacitySlider', function () {

  var link = function (scope, element, attrs) {
    var opacity = scope.layergroup.getOpacity();
    scope.percOpacity = opacity * 100 + '%';
    var layerChooserWidth = 170; // chrome is the new IE
    var localClick;

    /**
     * @description captures the location of click
     * and calculates the percentage of the width.
     * @params {event} jQuery event.
     */
    var adjustOpacity = function (e) {
      e.preventDefault();
      localClick = (e.originalEvent.layerX < 0) ? e.offsetX : e.originalEvent.layerX;
      if (localClick === undefined) {
        localClick = e.originalEvent.changedTouches[0].offsetX;
      }
      var newOpacity = localClick / layerChooserWidth;
      scope.$apply(function () {
        scope.percOpacity = newOpacity * 100 + '%';
      });

      scope.layergroup.setOpacity(newOpacity);

    };

    element.bind('click', adjustOpacity);
    element.bind('touch', adjustOpacity);
  };

  return {
    link: link,
    templateUrl: 'opacity/opacity.html',
    restrict: 'E',
    replace: true
  };
});

//layer-directive.js

angular.module('data-menu')
.directive("baselayerChooser", ['DataService', function (DataService)
{
  var link = function (scope) {

    window.onload = function () {

      var _allBLGs = DataService.baselayerGroups,
          _allBLGSlugs = _.pluck(_allBLGs, "slug"),
          _getActiveBLG = function () {
            return _.filter(_allBLGs, function (blg) {
              return blg.isActive();
            })[0];
          };

      scope.getNextInactiveBLG = function () {
        var activeBLGIndex = _allBLGSlugs.indexOf(_getActiveBLG().slug);
        return _allBLGs[(activeBLGIndex + 1) % _allBLGs.length];
      };
    };
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/baselayer-chooser.html',
    restrict: 'E',
  };

}]);

//layer-directive.js

angular.module('data-menu')
  .directive("eventlayerChooser", [function () {

  var link = function (scope, element) {
    scope.showOpacitySlider = false;
    element.find('.layer-img')[0].style.backgroundColor = scope.layergroup.mapLayers[0].color;
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/eventlayer-chooser.html',
    restrict: 'E',
  };
}]);

angular.module('templates-main', ['dashboard/dashboard.html', 'data-menu/data-menu.html', 'layer-chooser/baselayer-chooser.html', 'layer-chooser/eventlayer-chooser.html', 'layer-chooser/layer-chooser.html', 'omnibox/templates/area.html', 'omnibox/templates/cardattributes.html', 'omnibox/templates/defaultpoint.html', 'omnibox/templates/empty.html', 'omnibox/templates/full-details.html', 'omnibox/templates/line.html', 'omnibox/templates/location.html', 'omnibox/templates/omnibox-search.html', 'omnibox/templates/point.html', 'omnibox/templates/rain.html', 'omnibox/templates/search.html', 'omnibox/templates/timeseries.html', 'opacity/opacity.html', 'scenarios/scenarios.html', 'timeline/timeline.html', 'user-menu/user-menu.html']);

angular.module("dashboard/dashboard.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("dashboard/dashboard.html",
    "<div class=\"dashboard-wrapper\" ng-controller=\"DashboardCtrl\">\n" +
    "  <div class=\"container-fluid\">\n" +
    "    <div class=\"row\">\n" +
    "     <div class=\"col-md-10 dashboard-inner\">\n" +
    "     </div>\n" +
    "     <div class=\"col-md-2\">\n" +
    "     </div>\n" +
    "    </div>\n" +
    "    <div class=\"row\" ng-repeat=\"eventAgg in eventAggs\">\n" +
    "     <div class=\"col-md-10 dashboard-inner\">\n" +
    "       <p> <% eventAgg.color %> </p>\n" +
    "       <div class=\"row\" ng-if=\"!eventAgg.data[0].hasOwnProperty('category')\">\n" +
    "         <graph bar-chart\n" +
    "                class=\"xyGraph\"\n" +
    "                data=\"eventAgg.data\"\n" +
    "                ylabel=\"eventAgg.ylabel\"\n" +
    "                keys=\"{x: 'timestamp',\n" +
    "                       y: selectedStat,\n" +
    "                       color: 'color',\n" +
    "                       category: 'none'}\"\n" +
    "                dimensions=\"dimensions\"\n" +
    "                temporal=\"state.temporal\">\n" +
    "          </graph>\n" +
    "       </div>\n" +
    "       <div class=\"row\" ng-if=\"eventAgg.data[0].hasOwnProperty('category')\">\n" +
    "         <graph bar-chart\n" +
    "                class=\"xyGraph\"\n" +
    "                data=\"eventAgg.data\"\n" +
    "                ylabel=\"eventAgg.ylabel\"\n" +
    "                keys=\"{x: 'timestamp',\n" +
    "                       y: 'count',\n" +
    "                       color: 'color',\n" +
    "                       category: 'category'}\"\n" +
    "                dimensions=\"dimensions\"\n" +
    "                temporal=\"state.temporal\">\n" +
    "          </graph>\n" +
    "       </div>\n" +
    "       <!--<div class=\"row\">-->\n" +
    "         <!--<graph bar-chart-->\n" +
    "                <!--class=\"xyGraph\"-->\n" +
    "                <!--data=\"eventAgg.data\"-->\n" +
    "                <!--ylabel=\"Gemiddelde duur\"-->\n" +
    "                <!--keys=\"{x: 'timestamp',-->\n" +
    "                           <!--y: 'mean_duration',-->\n" +
    "                           <!--color: 'color',-->\n" +
    "                           <!--category: 'category'}\"-->\n" +
    "                <!--dimensions=\"dimensions\"-->\n" +
    "                <!--temporal=\"state.temporal\">-->\n" +
    "          <!--</graph>-->\n" +
    "        <!--</div>-->\n" +
    "      </div>\n" +
    "      <div class=\"col-md-2 dashboard-table\">\n" +
    "        <select ng-model=\"$parent.selectedStat\"\n" +
    "                ng-options=\"stat for stat in stats\"\n" +
    "                ng-if=\"!eventAgg.data[0].hasOwnProperty('category')\">\n" +
    "        </select>\n" +
    "        <table class=\"table table-hover table-condensed\"\n" +
    "               ng-if=\"eventAgg.data[0].hasOwnProperty('category')\">\n" +
    "          <tbody>\n" +
    "          <tr ng-repeat=\"(category, color) in getColorMap(eventAgg.baseColor)\">\n" +
    "            <td><i class=\"fa fa-square\" style='color: <% color %> '></i></td>\n" +
    "            <td><% category %></td>\n" +
    "          </tr>\n" +
    "          </tbody>\n" +
    "        </table>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("data-menu/data-menu.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("data-menu/data-menu.html",
    "<div ng-controller=\"DatamenuController as menu\">\n" +
    "  <div class=\"layer-menu-container\">\n" +
    "    <div class=\"layer-switcher-wrapper pull-right\"\n" +
    "         ng-class=\"{'slide-left': menu.enabled && context === 'map'}\">\n" +
    "\n" +
    "\n" +
    "      <div class=\"breakout-menu\"></div>\n" +
    "      <div class=\"layer-switcher slide-left\">\n" +
    "\n" +
    "        <ul class=\"nav\">\n" +
    "          <li class=\"nav-header\">\n" +
    "            <ul class=\"list-group\">\n" +
    "              <li>\n" +
    "                <baselayer-chooser></baselayer-chooser>\n" +
    "              </li>\n" +
    "              <li ng-repeat=\"layergroup in menu.layerGroups | orderObjectBy: 'order': false\"\n" +
    "                  ng-if=\"!(layergroup.isEventLayerGroup() || layergroup.baselayer)\">\n" +
    "                <layer-chooser layergroup=\"layergroup\">\n" +
    "                </layer-chooser>\n" +
    "              </li>\n" +
    "\n" +
    "              <li ng-repeat=\"layergroup in menu.layerGroups | orderObjectBy: 'order': false\"\n" +
    "                  ng-if=\"layergroup.isEventLayerGroup() && !layergroup.baselayer\">\n" +
    "                <eventlayer-chooser layergroup=\"layergroup\">\n" +
    "                </eventlayer-chooser>\n" +
    "              </li>\n" +
    "            </ul>\n" +
    "          </li>\n" +
    "        </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div id=\"ribbon\"\n" +
    "           class=\"ribbon\"\n" +
    "           title=\"<% menu.enabled ? tooltips.closeMenu : tooltips.openMenu %>\">\n" +
    "        <div class=\"arrow arrow-up\" ng-click=\"menu.enabled = !menu.enabled\">\n" +
    "        </div>\n" +
    "        <div class=\"arrow arrow-down\" ng-click=\"menu.enabled = !menu.enabled\">\n" +
    "        </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <span class=\"fa ribbon-icon clickable\" ng-class=\"{\n" +
    "              'fa-spinner fa-spin': menu.state.gettingData,\n" +
    "              'fa-compass': !menu.state.gettingData\n" +
    "            }\"\n" +
    "            ng-click=\"menu.enabled = !menu.enabled\">\n" +
    "      </span>\n" +
    "\n" +
    "      <div class=\"button-list-container\" id=\"\">\n" +
    "\n" +
    "        <div ng-if=\"context === 'map'\">\n" +
    "\n" +
    "          <div class=\"button-list-item\"\n" +
    "               style=\"cursor: pointer\">\n" +
    "            <a ng-click=\"menu.box.type = 'point'\"\n" +
    "               class=\"button-list-link\"\n" +
    "               title=\"punt selectie\"\n" +
    "               ng-class=\"{'active': menu.box.type === 'point'}\">\n" +
    "               <i class=\"fa fa-dot-circle-o\"></i>\n" +
    "            </a>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"button-list-item\"\n" +
    "               style=\"cursor: pointer\">\n" +
    "            <a ng-click=\"menu.box.type = 'line'\"\n" +
    "               class=\"button-list-link\"\n" +
    "               title=\"lijn selectie\"\n" +
    "               ng-class=\"{'active': menu.box.type === 'line'}\">\n" +
    "               <i class=\"fa fa-expand\"></i>\n" +
    "            </a>\n" +
    "          </div>\n" +
    "\n" +
    "          <div class=\"button-list-item\"\n" +
    "               style=\"cursor: pointer\">\n" +
    "            <a ng-click=\"menu.box.type = 'area'\"\n" +
    "               class=\"button-list-link\"\n" +
    "               title=\"scherm selectie\"\n" +
    "               ng-class=\"{'active': menu.box.type === 'area'}\">\n" +
    "               <i class=\"fa fa-square-o\"></i>\n" +
    "            </a>\n" +
    "          </div>\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"button-list-item\"\n" +
    "             style=\"cursor: pointer\"\n" +
    "             ng-if=\"context === 'db'\">\n" +
    "\n" +
    "          <a ng-click=\"switchContext('map')\"\n" +
    "             class=\"button-list-link\"\n" +
    "             title=\"Toon kaart.\">\n" +
    "             <i class=\"fa fa-close\"></i>\n" +
    "          </a>\n" +
    "        </div>\n" +
    "\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("layer-chooser/baselayer-chooser.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("layer-chooser/baselayer-chooser.html",
    "<li class=\"noselect need-bottom-margin\">\n" +
    "    <!-- style=\"margin-bottom: 10px;\"> -->\n" +
    "\n" +
    "  <!-- special, \"baselayer\" menu-item (singular): -->\n" +
    "  <label class=\"layer-chooser\"\n" +
    "         ng-click=\"menu.toggleLayerGroup(getNextInactiveBLG())\"\n" +
    "         title=\"Basislaag.\">\n" +
    "    <span class=\"layer-text\"\n" +
    "          style=\"color: #7f8c8d; width: 100%;\">\n" +
    "      <% getNextInactiveBLG().name %>\n" +
    "    </span>\n" +
    "  </label>\n" +
    "\n" +
    "</li>");
}]);

angular.module("layer-chooser/eventlayer-chooser.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("layer-chooser/eventlayer-chooser.html",
    "<li class=\"noselect need-bottom-margin\">\n" +
    "  <label\n" +
    "    class=\"ng-class: {active: layergroup.isActive()}; layer-chooser\"\n" +
    "    for=\"<% layergroup.id %>-layer\"\n" +
    "    single-click=\"menu.toggleLayerGroup(layergroup)\"\n" +
    "    ng-dblclick=\"layergroup.dblClick()\"\n" +
    "    title=\"<% layergroup.name %>\">\n" +
    "    <span class=\"layer-text\" ng-bind=\"layergroup.name\"></span>\n" +
    "    <div class=\"layer-img\" class=\"layer-chooser\" ng-style=\"layergroup.imageStyle\"></div>\n" +
    "  </label>\n" +
    "</li>");
}]);

angular.module("layer-chooser/layer-chooser.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("layer-chooser/layer-chooser.html",
    "<li class=\"noselect\">\n" +
    "  <label\n" +
    "    class=\"ng-class: {active: layergroup.isActive()}; layer-chooser\"\n" +
    "    for=\"<% layergroup.id %>-layer\"\n" +
    "    single-click=\"menu.toggleLayerGroup(layergroup)\"\n" +
    "		ng-dblclick=\"layergroup.dblClick()\"\n" +
    "    title=\"<% layergroup.name %>\">\n" +
    "    <span class=\"layer-text\" ng-bind=\"layergroup.name\"></span>\n" +
    "    <div class=\"layer-img\" class=\"layer-chooser\" ng-style=\"layergroup.imageStyle\"></div>\n" +
    "  </label>\n" +
    "</li>\n" +
    "\n" +
    "<div ng-if=\"context === 'map'\">\n" +
    "  <opacity-slider title=\"<% tooltips.transparency %>\"></opacity-slider>\n" +
    "</div>\n" +
    "");
}]);

angular.module("omnibox/templates/area.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/area.html",
    "<div ng-controller=\"AreaCtrl\">\n" +
    "  <!-- area card for: layerGroup=waterchain; layer=waterchain_grid -->\n" +
    "  <div ng-if=\"countKeys(box.content.waterchain.layers.waterchain_grid.data) > 0\"\n" +
    "       class=\"card active\"\n" +
    "       id=\"card-waterchain\">\n" +
    "    <table class=\"table table-condensed table-hover\">\n" +
    "      <tr class=\"attr-row\"\n" +
    "          ng-repeat=\"(entityName, entityData) in box.content.waterchain.layers.waterchain_grid.data\">\n" +
    "        <td class=\"col-md-4\">\n" +
    "          <% entityName | objectTitle %>\n" +
    "        </td>\n" +
    "        <td>\n" +
    "          <% countKeys(entityData) %>\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "    </table>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-repeat=\"(slug, lg) in box.content\"\n" +
    "       ng-if=\"slug !== 'rain' && slug !== 'waterchain'\"\n" +
    "       class=\"card active\" id=\"card-<% slug %>\">\n" +
    "\n" +
    "    <div\n" +
    "      ng-repeat=\"(lslug, l) in lg.layers\"\n" +
    "      ng-if=\"!!l && l.data\"\n" +
    "      ng-switch=\"l.aggType\"\n" +
    "      class=\"card-content\"\n" +
    "      id=\"card-content-<% l.name %>\">\n" +
    "\n" +
    "      <graph\n" +
    "        ng-switch-when=\"curve\"\n" +
    "        line xlabel=\"'[%]'\"\n" +
    "        ylabel=\"'hoogte [mNAP]'\"\n" +
    "        data=\"l.data\"\n" +
    "        keys=\"{x: 0, y: 1}\">\n" +
    "      </graph>\n" +
    "\n" +
    "      <graph\n" +
    "        ng-switch-when=\"histogram\"\n" +
    "        bar-chart\n" +
    "        quantity=\"'linear'\"\n" +
    "        ylabel=\"'[%]'\"\n" +
    "        xlabel=\"'hoogte [mNAP]'\"\n" +
    "        data=\"l.data\"\n" +
    "        keys=\"{x: 0, y: 1}\">\n" +
    "      </graph>\n" +
    "\n" +
    "      <graph\n" +
    "        ng-switch-when=\"counts\"\n" +
    "        horizontal-stack\n" +
    "        data=\"l.data\"\n" +
    "        keys=\"{x: 'data', y: 'label'}\"\n" +
    "        xlabel=\"'[%]'\"\n" +
    "        dimensions=\"{height: 80, padding: {left: 0, right: 0, top: 5, bottom: 50}}\">\n" +
    "      </graph>\n" +
    "\n" +
    "      <div ng-switch-default ng-switch=\"l.format\">\n" +
    "\n" +
    "        <graph\n" +
    "          ng-switch-when=\"Store\"\n" +
    "          line\n" +
    "          data=\"l.data\">\n" +
    "        </graph>\n" +
    "\n" +
    "        <div ng-switch-when=\"Vector\">\n" +
    "\n" +
    "          <table class=\"table table-hover table-condensed\" >\n" +
    "            <thead>\n" +
    "\n" +
    "                <th class=\"col-xs-1\">\n" +
    "                  <i class=\"fa fa-circle\" ng-style=\"{'color': l.color }\"></i>\n" +
    "                </th>\n" +
    "\n" +
    "                <th class=\"col-xs-10\">\n" +
    "                  <% lg.layerGroupName %>\n" +
    "                </th>\n" +
    "\n" +
    "                <th class=\"col-xs-1\">\n" +
    "                    <a ng-click=\"switchContext('db')\"\n" +
    "                      class=\"button-list-link\"\n" +
    "                      title=\"Toon dashboard.\"\n" +
    "                      ng-if=\"context === 'map'\"\n" +
    "                      style=\"cursor: pointer;\">\n" +
    "                      <i class=\"fa fa-dashboard\"></i>\n" +
    "                    </a>\n" +
    "                </th>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "              <tr>\n" +
    "                <td rel=\"tooltip\"\n" +
    "                    title=\"l.data.length\">\n" +
    "                  <% l.data.length %>\n" +
    "                </td>\n" +
    "                <td rel=\"tooltip\"\n" +
    "                    title=\"l.summary\">\n" +
    "                  <% l.summary %>\n" +
    "                </td>\n" +
    "              </tr>\n" +
    "            </tbody>\n" +
    "          </table>\n" +
    "        </div>\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("omnibox/templates/cardattributes.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/cardattributes.html",
    "<div class=\"card-content\">\n" +
    "\n" +
    "  <span class=\"kunstwerk-title\" ng-class=\"{'sm-icon': !fullDetails};\">\n" +
    "\n" +
    "    <i id=\"icon-holder\"\n" +
    "      ng-class=\"$parent.getIconClass(waterchain.layers.waterchain_grid.data.entity_name)\">\n" +
    "    </i>\n" +
    "\n" +
    "    <span id=\"title-holder\"\n" +
    "          class=\"card-title-text kunstwerk-title-text\">\n" +
    "      <% waterchain.layers.waterchain_grid.data.entity_name | objectTitle %>\n" +
    "    </span>\n" +
    "    <full-details></full-details>\n" +
    "  </span>\n" +
    "\n" +
    "\n" +
    "  <table ng-if=\"fullDetails\" id=\"kunstwerk-table\" class=\"table table-condensed table-hover\">\n" +
    "\n" +
    "    <tr class=\"attr-row\"\n" +
    "        ng-repeat=\"obj in wanted[waterchain.layers.waterchain_grid.data.entity_name].rows\"\n" +
    "        >\n" +
    "\n" +
    "      <td class=\"fixed-width-card-table\">\n" +
    "        <div class=\"attr-row-content\">\n" +
    "          <% obj.keyName %>\n" +
    "        </div>\n" +
    "      </td>\n" +
    "\n" +
    "      <td class=\"lineout\"\n" +
    "          ng-if=\"waterchain.layers.waterchain_grid.data[obj.attrName]\">\n" +
    "        <div class=\"attr-row-content\" ng-bind-html=\"$eval(obj.ngBindValue) + obj.valueSuffix\">\n" +
    "        </div>\n" +
    "      </td>\n" +
    "\n" +
    "      <td class=\"lineout\"\n" +
    "          ng-if=\"!waterchain.layers.waterchain_grid.data[obj.attrName]\"\n" +
    "          rel=\"tooltip\"\n" +
    "          data-toggle=\"tooltip\"\n" +
    "          title=\"Dit is een voorbeeld waarde\">\n" +
    "        <div ng-bind-html=\"obj.defaultValue + obj.valueSuffix\" class=\"attr-row-content dummy-attr-value\">\n" +
    "        </div>\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "\n" +
    "  <div class=\"structure-image-wrapper text-center\"\n" +
    "       ng-if=\"!!waterchain.layers.waterchain_grid.data.image_url && fullDetails\">\n" +
    "\n" +
    "      <img class=\"structure-image\"\n" +
    "           ng-src=\"{{waterchain.layers.waterchain_grid.data.image_url}}\" />\n" +
    "\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("omnibox/templates/defaultpoint.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/defaultpoint.html",
    "<div>\n" +
    "  <div ng-repeat=\"l in lg.layers track by $index\">\n" +
    "    <div ng-switch=\"l.format\">\n" +
    "\n" +
    "      <div ng-switch-when=\"Store\">\n" +
    "        <div ng-if=\"!lg.temporal\">\n" +
    "          <table ng-if=\"l.scale === 'interval' || l.scale === 'ratio' \"\n" +
    "            class=\"table table-condensed table-hover single-row-table\">\n" +
    "            <thead>\n" +
    "              <td class=\"col-md-4\"><% l.quantity %> </td>\n" +
    "              <td class=\"col-md-4\"><% l.data[0][0] | number : 2 %> <% l.unit %></td>\n" +
    "              <td class=\"col-md-4\"></td>\n" +
    "            </thead>\n" +
    "          </table>\n" +
    "\n" +
    "          <table ng-if=\"l.scale === 'nominal' || l.scale === 'ordinal'\"\n" +
    "                 class=\"table table-condensed table-hover single-row-table\">\n" +
    "            <thead>\n" +
    "              <td class=\"col-md-1\">\n" +
    "                <div class=\"discrete-raster-color-indicator\"\n" +
    "                     style=\"background-color: <% l.data[0].color %>;\">\n" +
    "                </div>\n" +
    "              </td>\n" +
    "              <td class=\"col-md-10\">\n" +
    "                <% lg.layerGroupName %>:&nbsp;<% l.data[0].label | discreteRasterType %>\n" +
    "              </td>\n" +
    "              <td class=\"col-md-1\"><% l.data[0].label | discreteRasterSource %></td>\n" +
    "            </thead>\n" +
    "          </table>\n" +
    "        </div>\n" +
    "\n" +
    "        <graph ng-if=\"lg.temporal\"\n" +
    "               line\n" +
    "               type=\"temporal\"\n" +
    "               temporal=\"state.temporal\"\n" +
    "               data=\"point.temporalRaster.data\"\n" +
    "               ylabel=\"'hoogte [mNAP]'\"\n" +
    "               keys=\"{x: 0, y: 1}\">\n" +
    "        </graph>\n" +
    "      </div>\n" +
    "\n" +
    "      <div ng-switch-when=\"Vector\">\n" +
    "        <full-details class=\"table-details-toggler\"></full-details>\n" +
    "        <table class=\"table table-hover table-condensed\" >\n" +
    "          <thead>\n" +
    "              <th><i class=\"fa fa-circle\" ng-style=\"{'color': l.color }\"></i></th>\n" +
    "              <th><% lg.layerGroupName %></th>\n" +
    "              <th><% l.data.length %></th>\n" +
    "          </thead>\n" +
    "          <tbody ng-if=\"fullDetails\">\n" +
    "            <tr ng-repeat=\"event in l.data\">\n" +
    "                <td rel=\"tooltip\"\n" +
    "                    data-placement=\"left\"\n" +
    "                    title=\"<% event.properties.category %>\">\n" +
    "                    <i class=\"fa fa-circle\" ng-style=\"{'color': l.color }\">\n" +
    "                  </i>\n" +
    "                </td>\n" +
    "                <td rel=\"tooltip\"\n" +
    "                    data-placement=\"left\"\n" +
    "                    title=\"start: <% event.properties.timestamp_start | date:'dd/MM/yyyy' %>\n" +
    "                           eind: <% event.properties.timestamp_end | date:'dd/MM/yyyy' %>\">\n" +
    "                    <% event.properties.timestamp_start | date:'dd/MM/yyyy' %>\n" +
    "                </td>\n" +
    "                <td rel=\"tooltip\"\n" +
    "                    data-placement=\"left\"\n" +
    "                    title=\"<% event.properties.value %>\">\n" +
    "                  <% event.properties.value | truncate:40 %>\n" +
    "                </td>\n" +
    "              </tr>\n" +
    "          </tbody>\n" +
    "        </table>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("omnibox/templates/empty.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/empty.html",
    "");
}]);

angular.module("omnibox/templates/full-details.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/full-details.html",
    "<span class=\"full-details-toggle pull-right card-title-text\">\n" +
    "  <i class=\"fa fa-lg clickable\"\n" +
    "    ng-class=\"{'fa-caret-down': fullDetails, 'fa-caret-left': !fullDetails}\">\n" +
    "  </i> \n" +
    "\n" +
    "</span>\n" +
    "");
}]);

angular.module("omnibox/templates/line.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/line.html",
    "<div ng-controller=\"LineCtrl\">\n" +
    "\n" +
    "  <div ng-repeat=\"lg in box.content\" class=\"card active\" id=\"card-<% l.name %>\">\n" +
    "    <div ng-repeat=\"l in lg.layers\"\n" +
    "      id=\"card-content-<% l.name %>\"\n" +
    "      class=\"card-content\"\n" +
    "      ng-if=\"l.data && (l.scale === 'interval' || l.scale === 'ratio')\">\n" +
    "      <div class=\"card-content\" id=\"card-content-<% agg.name %>\">\n" +
    "\n" +
    "        <graph ng-if=\"l.scale === 'interval' || l.scale === 'ratio'\"\n" +
    "          line\n" +
    "          data=\"l.data\"\n" +
    "          ylabel=\"l.quantity + ' [' + l.unit + ']'\"\n" +
    "          xlabel=\"'Afstand in [m]'\">\n" +
    "        </graph>\n" +
    "<!--    TODO: get proper response from the server when requesting a line of\n" +
    "        nominal dat and decomment this line\n" +
    "        <graph ng-if=\"l.scale === 'nominal'\"\n" +
    "          horizontal-stack\n" +
    "          data=\"l.data\"\n" +
    "          keys=\"{x: 'data', y: 'label'}\"\n" +
    "          xlabel=\"'[%]'\"\n" +
    "          dimensions=\"{height: 80, padding: {left: 0, right: 0, top: 5, bottom: 50}}\">\n" +
    "        </graph> -->\n" +
    "\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("omnibox/templates/location.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/location.html",
    "<div ng-cloak\n" +
    "  ng-repeat=\"location in box.content.location.data\"\n" +
    "  class=\"cluster location\">\n" +
    "  <i class=\"fa fa-map-marker\"></i>&nbsp;\n" +
    "  <a ng-click=\"zoomTo(location)\"\n" +
    "    title=\"<% location.display_name %>\"\n" +
    "    class=\"pointer clickable\">\n" +
    "    <span><% location.display_name %></span></a>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("omnibox/templates/omnibox-search.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/omnibox-search.html",
    "<div class=\"searchbox\" id=\"searchbox\" tabindex=\"-1\" role=\"search\">\n" +
    "  <search></search>\n" +
    "</div>\n" +
    "\n" +
    "<div id=\"cards\" class=\"pullDown cardbox\" ng-show=\"box.showCards\">\n" +
    "\n" +
    "  <!-- Search results go here -->\n" +
    "  <div class=\"card active\"\n" +
    "       ng-if=\"box.content.location\">\n" +
    "    <location></location>\n" +
    "  </div>\n" +
    "\n" +
    "  <!-- Point/Line/Area box content goes here  -->\n" +
    "  <div id=\"box-type-cards\"></div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("omnibox/templates/point.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/point.html",
    "<div ng-controller=\"PointCtrl\">\n" +
    "\n" +
    "  <div class=\"card active\"\n" +
    "      ng-if=\"box.content.waterchain\">\n" +
    "    <cardattributes waterchain=\"box.content.waterchain\" full-details=\"box.fullDetailCards.waterchain\"></cardattributes>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"card active\"\n" +
    "       ng-if=\"box.content.waterchain && box.content.timeseries\">\n" +
    "    <timeseries\n" +
    "      timeseries=\"box.content.timeseries\"\n" +
    "      full-details=\"box.fullDetailCards.timeseries\"\n" +
    "      time-state=\"omnibox.state.temporal\">\n" +
    "    </timeseries>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-if=\"box.content.rain\">\n" +
    "    <rain></rain>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-repeat=\"(slug, lg) in box.content\"\n" +
    "       class=\"card active\"\n" +
    "       ng-if=\"slug !== 'waterchain' && slug !== 'timeseries' && slug !== 'rain'\">\n" +
    "    <defaultpoint lg=\"lg\"></defaultpoint>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("omnibox/templates/rain.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/rain.html",
    "<div ng-controller=\"rain\">\n" +
    "\n" +
    "  <div class=\"card active\">\n" +
    "    <div class=\"card-content\"\n" +
    "      ng-init=\"lg = box.content.rain\">\n" +
    "\n" +
    "     <full-details></full-details>\n" +
    "     <span class=\"card-title-text\" ng-class=\"{hidden: fullDetails}\" >Regen</span>\n" +
    "     <div ng-class=\"{ hidden: !fullDetails }\">\n" +
    "       <graph\n" +
    "         bar-chart\n" +
    "         class=\"xyGraph\"\n" +
    "         data=\"lg.layers['radar/basic'].data\"\n" +
    "         ylabel=\"lg.layers['radar/basic'].aggWindow\"\n" +
    "         yfilter=\"aggWinToYLabel\"\n" +
    "         keys=\"{x: 0, y: 1}\"\n" +
    "         temporal=\"omnibox.state.temporal\">\n" +
    "       </graph>\n" +
    "       <div class=\"card-tools\">\n" +
    "         <a ng-click=\"recurrenceTimeToggle()\"\n" +
    "            ng-class=\"{'active': rrc.active}\" class=\"btn btn-default btn-xs\"\n" +
    "            title=\"Extra statistieken, herhalingstijden\">\n" +
    "            Statistiek\n" +
    "          </a>\n" +
    "         <a\n" +
    "           class=\"btn btn-default btn-xs\"\n" +
    "           title=\"Data van deze infocard exporteren\"\n" +
    "           ng-csv=\"formatCSVColumns(lg.layers['radar/basic'].data)\"\n" +
    "           filename=\"neerslag.csv\"\n" +
    "           csv-header=\"['Datestamp', 'Timestamp', 'Rain (mm)', 'Latitude', 'Longitude']\" >\n" +
    "           <i class=\"fa fa-share-square-o\"></i>\n" +
    "           Exporteer\n" +
    "         </a>\n" +
    "       </div>\n" +
    "     </div>\n" +
    "   </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"card active ng-class: {hidden: !fullDetails}\" ng-if=\"rrc.active\">\n" +
    "    <div class=\"card-content-message\"\n" +
    "      ng-init=\"lg = box.content.rain\">\n" +
    "      <div class=\"recurrence-time-container\">\n" +
    "        <div ng-if=\"!rrc.data.message\">\n" +
    "          <table class=\"table table-hover table-condensed\">\n" +
    "            <caption>Herhalingstijden (HT)</caption>\n" +
    "            <thead>\n" +
    "              <tr>\n" +
    "                <td class=\"larger-font-card-table\">Start</th>\n" +
    "                <td class=\"larger-font-card-table\">Duur</th>\n" +
    "                <td class=\"larger-font-card-table text-right\">mm</th>\n" +
    "                <td class=\"larger-font-card-table\">HT</th>\n" +
    "              </tr>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "            <tr class=\"recurrence_time\"\n" +
    "              ng-repeat=\"recurTime in rrc.data\">\n" +
    "              <td class=\"larger-font-card-table\"><% recurTime.start | date : 'dd-MM-yyyy HH:mm' %></td>\n" +
    "              <td class=\"larger-font-card-table\"><% recurTime.td_window %></td>\n" +
    "              <td class=\"larger-font-card-table text-right\"><% recurTime.max | number: 1 %></td>\n" +
    "              <td class=\"larger-font-card-table\"><% recurTime.t %></td>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "          </table>\n" +
    "        </div>\n" +
    "        <div ng-if=\"rrc.data.message\">\n" +
    "          <span class=\"message\"><% rrc.data.message %></span>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("omnibox/templates/search.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/search.html",
    "<div class=\"searchboxinput\">\n" +
    "  <input ng-focus id=\"searchboxinput\"\n" +
    "    tabindex=\"-1\"\n" +
    "    placeholder=\"Zoeken op plaats, stad, ...\"\n" +
    "    autocomplete=\"off\"\n" +
    "    dir=\"ltr\"\n" +
    "    ng-model=\"geoquery\"\n" +
    "    ng-keydown=\"searchKeyPress($event)\"\n" +
    "    spellcheck=\"false\">\n" +
    "  <div\n" +
    "    title=\"<% tooltips.resetQuery %>\"\n" +
    "    ng-click=\"cleanInput()\"\n" +
    "    id=\"clear\" class=\"clickable\" ></div>\n" +
    "  <button id=\"search-button\"\n" +
    "    class=\"searchbutton clickable\"\n" +
    "    ng-click=\"search()\"\n" +
    "    aria-label=\"Search\"\n" +
    "    title=\"<% tooltips.search %>\">\n" +
    "  </button>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("omnibox/templates/timeseries.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("omnibox/templates/timeseries.html",
    "<div class=\"card-content\" ng-class=\"{timeseries: fullDetails}\">\n" +
    "\n" +
    "  <div class=\"timeseries-header-container\">\n" +
    "     <select ng-class=\"{hidden: !fullDetails}\"\n" +
    "            class=\"timeseries\"\n" +
    "            ng-model=\"$parent.box.content.timeseries.selectedTimeseries\"\n" +
    "            ng-if=\"$parent.box.content.timeseries.data.length > 1\"\n" +
    "            ng-options=\"series.name for series in $parent.box.content.timeseries.data | rmSingleDatumTimeseries\">\n" +
    "     </select>\n" +
    "     <span class=\"card-title-text\" ng-class=\"{hidden: fullDetails}\" >Tijdreeksen</span>\n" +
    "     <full-details></full-details>\n" +
    "  </div>\n" +
    "\n" +
    "\n" +
    "  <div ng-class=\"{hidden: !fullDetails}\"\n" +
    "      ng-show=\"$parent.box.content.waterchain.layers.waterchain_grid.data.entity_name === 'measuringstation'\">\n" +
    "     <graph\n" +
    "        bar-chart\n" +
    "        type=\"temporal\"\n" +
    "        data=\"$parent.box.content.timeseries.selectedTimeseries.events\"\n" +
    "        ylabel=\"$parent.box.content.timeseries.selectedTimeseries.unit\"\n" +
    "        xlabel=\"\"\n" +
    "        keys=\"{x: 0, y: 1}\"\n" +
    "        temporal=\"timeState\">\n" +
    "      </graph>\n" +
    "  </div>\n" +
    "\n" +
    "  <div ng-class=\"{hidden: !fullDetails}\"\n" +
    "    ng-show=\"$parent.box.content.waterchain.layers.waterchain_grid.data.entity_name !== 'measuringstation'\">\n" +
    "    <graph\n" +
    "      line\n" +
    "      type=\"temporal\"\n" +
    "      data=\"$parent.box.content.timeseries.selectedTimeseries.events\"\n" +
    "      ylabel=\"$parent.box.content.timeseries.selectedTimeseries.unit\"\n" +
    "      xlabel=\"\"\n" +
    "      keys=\"{x: 0, y: 1}\"\n" +
    "      temporal=\"timeState\">\n" +
    "    </graph>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("opacity/opacity.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("opacity/opacity.html",
    "<div class=\"ng-class: {inactive: !layergroup.isActive() || layergroup.baselayer || !showOpacitySlider}; progress\">\n" +
    "    <div class=\"progress-bar\" role=\"progressbar\" ng-style=\"{ 'width': percOpacity }\">\n" +
    "      <span class=\"sr-only\"></span>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("scenarios/scenarios.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("scenarios/scenarios.html",
    "<div class=\"scenarios-wrapper\" ng-controller=\"ScenariosCtrl\">\n" +
    "  <div class=\"container-fluid\">\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"col-md-7\">\n" +
    "        <!--<a ng-click=\"switchContext('map')\" class=\"btn btn-default\"><i class=\"fa fa-arrow-left\"></i></a>-->\n" +
    "        <h4>Resultaten van 3Di</h4>\n" +
    "      </div>\n" +
    "      <div class=\"col-md-5\">\n" +
    "        <div class=\"pull-right\">\n" +
    "              <a ng-if=\"user.authenticated\"\n" +
    "                 title=\"<% tooltips.profile %>\"\n" +
    "                 href=\"http://sso.lizard.net/edit_profile/\">\n" +
    "                <div class=\"\" ng-cloak id=\"username\" >\n" +
    "                  <i id=\"\" class=\"fa fa-user\" style=\"font-size:1.2em;\"></i>\n" +
    "                  <span ng-bind=\"user.firstName\"></span>\n" +
    "                </div>\n" +
    "              </a>\n" +
    "              <a ng-if=\"!user.authenticated\"\n" +
    "                 onclick=\"logIn()\"\n" +
    "                 title=\"<% tooltips.login %>\">\n" +
    "                <div class=\"\" ng-cloak id=\"username\" >\n" +
    "                  <i id=\"\" class=\"fa fa-user\" style=\"font-size:1.2em;\"></i>\n" +
    "                  Login\n" +
    "                  <span></span>\n" +
    "                </div>\n" +
    "              </a>\n" +
    "              <a ng-if=\"user.authenticated\"\n" +
    "                 class=\"logout\"\n" +
    "                 href=\"/accounts/logout/?next=/\"\n" +
    "                 title=\"<% tooltips.logout %>\"\n" +
    "                 onclick=\"return logOut()\">\n" +
    "                <div class=\"pull-right\"\n" +
    "                     id=\"username\"\n" +
    "                     title=\"<% tooltips.logout %>\">\n" +
    "                  Uitloggen\n" +
    "                  <i id=\"\" style=\"font-size:1.2em;\" class=\"fa fa-power-off\"></i>\n" +
    "                </div>\n" +
    "              </a>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=\"row\">\n" +
    "      <div class=\"col-md-10 scenarios-inner\">\n" +
    "\n" +
    "        <input type=\"text\" class=\"form-control\" ng-model=\"search\" placeholder=\"Zoek\">\n" +
    "        <table class=\"table table-hover scenarios-table\">\n" +
    "          <thead>\n" +
    "            <th></th>\n" +
    "            <th>Naam</th>\n" +
    "            <th>Datum</th>\n" +
    "            <th>Resultaten</th>\n" +
    "          </thead>\n" +
    "          <tbody if=\"scenarios.length > 0\">\n" +
    "            <tr ng-repeat=\"scenario in scenarios | filter: search\" \n" +
    "              ng-class=\"{'selected-scenario': selectedScenario === scenario}\">\n" +
    "              <td ng-click=\"select(scenario)\" ><i class=\"fa clickable\"\n" +
    "                  ng-class=\"{'fa-chevron-right': selectedScenario != scenario,\n" +
    "                             'fa-chevron-down': selectedScenario === scenario}\"></i></td>\n" +
    "              <td ng-click=\"select(scenario)\" class=\"clickable\" ><% scenario.name %></td>\n" +
    "              <td ng-click=\"select(scenario)\" class=\"clickable\" ><% scenario.created | date: 'MMM d, y HH:mm:ss a' %><td>\n" +
    "              <table class=\"table table-condensed result-table\"\n" +
    "                ng-if=\"selectedScenario === \n" +
    "                    scenario && scenario.result_set.length > 0\">\n" +
    "                <tr ng-repeat=\"result in scenario.result_set\">\n" +
    "                  <td><% result.result_type.name %></td>\n" +
    "                  <td><a href=\"<% result.attachment_url %>\">Download</a></td>\n" +
    "                </tr>\n" +
    "\n" +
    "              </table>\n" +
    "              <span ng-if=\"scenario.result_set.length === 0\">\n" +
    "                Geen bijbehorende resultaten\n" +
    "              </span>\n" +
    "            </tr>\n" +
    "          </tbody>\n" +
    "        \n" +
    "        </table>\n" +
    "        \n" +
    "      \n" +
    "      </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    " \n" +
    "");
}]);

angular.module("timeline/timeline.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("timeline/timeline.html",
    "<div id=\"timeline\"\n" +
    "     ng-controller=\"TimeCtrl as timeline\">\n" +
    "  <div class=\"clock-wrapper noselect\">\n" +
    "    <div class=\"clock-time\"\n" +
    "         ng-click=\"timeline.toggleTimelineVisiblity()\"\n" +
    "         ng-bind=\"timeline.state.at | date: 'dd-MM-yyyy HH:mm'\">\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"timeline-wrapper\">\n" +
    "    <div class=\"time-controls\" ng-if=\"context === 'map'\">\n" +
    "      <div class=\"btn-group\">\n" +
    "        <a ng-click=\"timeline.playPauseAnimation()\"\n" +
    "           class=\"extra-padding timeline-button\"\n" +
    "           ng-class=\"{'active': timeline.state.playing, 'hidden': !timeline.animatable}\"\n" +
    "           title=\"<% timeline.state.playing ? tooltips.stopAnim : tooltips.startAnim %>\"\n" +
    "           data-original-title=\"Afspelen/pauzeren\">\n" +
    "          <span class=\"fa\"  ng-class=\"{\n" +
    "              'fa-play': !timeline.state.playing,\n" +
    "              'fa-pause active': timeline.state.playing,\n" +
    "              'fa-circle-o-notch fa-spin' : timeline.layerGroups.timeIsSyncing\n" +
    "              }\"></span>\n" +
    "        </a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div id=\"timeline-svg-wrapper\" class=\"timeline-svg-wrapper\">\n" +
    "      <svg></svg>\n" +
    "    </div>\n" +
    "    <div class=\"time-controls-right\">\n" +
    "      <div class=\"btn-group-horizontal\">\n" +
    "          <a class=\"btn btn-default btn-xss\" ng-click=\"timeline.zoom('in')\"\n" +
    "            class=\"extra-padding timeline-button\"\n" +
    "            title=\"<% tooltips.zoomInTimeline %>\"\n" +
    "            data-original-title=\"Zoom in\">\n" +
    "            <i class=\"fa fa-plus\"></i>\n" +
    "          </a>\n" +
    "          <a class=\"btn btn-default btn-xss\" ng-mousedown=\"timeline.zoomToNow()\"\n" +
    "            class=\"extra-padding timeline-button\"\n" +
    "            title=\"<% tooltips.goToNow %>\"\n" +
    "            data-original-title=\"Naar nu\">\n" +
    "            <i class=\"fa fa-clock-o\"></i>\n" +
    "          </a>\n" +
    "          <a class=\"btn btn-default btn-xss\" ng-click=\"timeline.zoom('out')\"\n" +
    "            class=\"extra-padding timeline-button\"\n" +
    "            title=\"<% tooltips.zoomOutTimeline %>\"\n" +
    "            data-original-title=\"Zoom uit\">\n" +
    "            <i class=\"fa fa-minus\"></i>\n" +
    "          </a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("user-menu/user-menu.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("user-menu/user-menu.html",
    "<div class=\"navbar navbar-inverse navbar-fixed-top\" role=\"navigation\">\n" +
    "  <div class=\"navbar-collapse collapse\">\n" +
    "   <ul class=\"nav navbar-nav navbar-right\" style=\"\">\n" +
    "     <li>\n" +
    "        <a class=\"help\" href=\"https://www.lizard.net/support\" title=\"Vragen en handleiding\" target=\"_blank\">\n" +
    "          <i class=\"fa fa-question\" style=\"font-size: 1.2em\"></i>\n" +
    "        </a>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"visible-sm visible-md visible-lg user\">\n" +
    "        <a ng-if=\"user.authenticated\"\n" +
    "           title=\"<% tooltips.profile %>\"\n" +
    "           href=\"http://sso.lizard.net/edit_profile/\">\n" +
    "          <div class=\"\" ng-cloak id=\"username\" >\n" +
    "            <i id=\"\" class=\"fa fa-user\" style=\"font-size:1.2em;\"></i>\n" +
    "            <span ng-bind=\"user.firstName\"></span>\n" +
    "          </div>\n" +
    "        </a>\n" +
    "        <a ng-if=\"!user.authenticated\"\n" +
    "           onclick=\"logIn()\"\n" +
    "           title=\"<% tooltips.login %>\">\n" +
    "          <div class=\"clickable\" ng-cloak id=\"username\" >\n" +
    "            <i id=\"\" class=\"fa fa-user\" style=\"font-size:1.2em;\"></i>\n" +
    "            <span>Inloggen</span>\n" +
    "          </div>\n" +
    "        </a>\n" +
    "      </li>\n" +
    "\n" +
    "      <li class=\"visible-sm visible-md visible-lg user\" style=\"width:63px;\">\n" +
    "        <a ng-if=\"user.authenticated\"\n" +
    "           class=\"logout\"\n" +
    "           href=\"/accounts/logout/?next=/\"\n" +
    "           title=\"<% tooltips.logout %>\"\n" +
    "           onclick=\"return logOut()\">\n" +
    "          <div class=\"pull-right\"\n" +
    "               id=\"username\"\n" +
    "               title=\"<% tooltips.logout %>\">\n" +
    "            <i id=\"\" style=\"font-size:1.2em;\" class=\"fa fa-power-off\"></i>\n" +
    "          </div>\n" +
    "        </a>\n" +
    "      </li>\n" +
    "\n" +
    "    </ul>\n" +
    "  </div><!--/.nav-collapse -->\n" +
    "</div>\n" +
    "\n" +
    "");
}]);
