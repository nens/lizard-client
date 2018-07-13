/**
 * @ngdoc service
 * @class UtilService
 * @name UtilService
 * @summary Generic util functions.
 * @description Generic util functions. A file where developers put hacky code
 * because data formats are messed up. Nobody ever checks if a function is still
 * relevant after removing logic somewhere else or after introducing helper
 * libs.
 *
 * NOTE: this file probably contains lots of stale code.
 */
angular.module('lizard-nxt')
  .service("UtilService", ["NxtD3", "$timeout", function (NxtD3, $timeout) {


  /**
   * Returns the index of the value at key in arrayObject closest to value.
   * When value is exactly in the middle, the first index is returned.
   *
   * @param  {array}        collection array of objects or array of arrays
   *                                   to be searched.
   * @param  {string | int} key to compare property in arrayOfObjects.
   * @param  {int}          value to search for.
   * @return {int}          first index closest to value.
   */
  this.bisect = function (collection, key, value) {
    var index;
    var initialSmallestDiff = Infinity;
    _.reduce(collection, function (smallestDiff, d, i) {
      var currentDiff = Math.abs(d[key] - value);
      if (currentDiff < smallestDiff) {
        index = i;
        smallestDiff = currentDiff;
      }
      return smallestDiff;
    }, initialSmallestDiff);
    return index;
  };

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

    if (!coefficient) { coefficient = 1; }

    if (up) {
      timestamp += coefficient / 2;
    }
    if (coefficient === 2635200000) { // One month
      format = NxtD3.prototype._getLocaleFormatter().timeFormat("%m/01/%Y");
      return new Date(format(new Date(timestamp))).getTime();
    } else if (coefficient === 86400000) { // One day
      format = NxtD3.prototype._getLocaleFormatter().timeFormat("%m/%d/%Y");
      return new Date(format(new Date(timestamp))).getTime();
    }
    return parseInt(timestamp / coefficient, 10) * coefficient;
  };

  // List of graph colors used to color timeseries
  this.GRAPH_COLORS = [
    '#1abc9c', // turquoise
    '#3498db', // peterRiver
    '#f1c40f', // sunflower
    '#9b59b6', // amethyst
    '#2ecc71', // emerald
    '#2980b9', // belizeHole
    '#e67e22', // carrot
    '#8e44ad', // wisteria
    '#16a085', // greenSea
    '#34495e', // wetAsphalt
    '#27ae60', // nephritis
    '#f39c12', // orange
    '#2c3e50', // midnightBlue
    '#d35400' // pumpkin
  ];

  /**
   * Returns true for <protocol>:<domain>.
   * Or www with a domain. Both options might include paths, query params
   * and anchors. It does not return true for 'henkie.com' but basically
   * everything else is matched.
   *
   * @param  {str}  string string to test
   * @return {Boolean} true for urls, false otherwise.
   */
  this.isUrl = function (string) {
    return /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/.test(string);
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


  // Available zoomlevels
  this._zoomLvls = {
    '5min': 300000,
    'hour': 3600000,
    'day': 86400000,
    'month': 2635200000
  }; // Month equals 30.5 days

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

    var aggWindow;
    var MIN_PX = 3; // Minimum width of a bar

    // ms per pixel
    var msPerPx = (stop - start) / drawingWidth;
    for (var zoomLvl in this._zoomLvls) {
      aggWindow = this._zoomLvls[zoomLvl];
      if (aggWindow > MIN_PX * msPerPx) {
        break; // If zoomlevel is sufficient to get enough width in the bars
      }
    }

    return aggWindow;
  };


  this.getAggWindowAsString = function (aggWindow) {
    var text = '';

    for (var zoomLvl in this._zoomLvls) {
      text = zoomLvl;
      if (this._zoomLvls[zoomLvl] === aggWindow) {
        break;
      }
    }

    return text;
  };

  this.getAggWindowAsText = this.getAggWindowAsString;

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


  // helper for time stuff
  this.hour = 60 * 60 * 1000;
  this.day = 24 * this.hour;

  /**
   * @function parseDaysHours
   * @param {string} 0Days3Hours string
   * @return {int} milliseconds representation
   */
  this.parseDaysHours = function (timeString) {
    if (timeString === undefined) {
      return 0;
    }

    var days = parseInt(timeString.split('Days')[0]);
    var hours = parseInt(timeString.split('Days')[1].split('Hours')[0]);

    var totalMS = 0;
    if (!isNaN(days)) {
      totalMS += parseInt(days) * this.day;
    }

    if (!isNaN(hours)) {
      totalMS += parseInt(hours) * this.hour;
    }

    return totalMS;
  };

  /**
   * @function getTimeIntervalAsText
   * @param {int} Start time
   * @param {int} End time
   * @return {string} Difference in format of: 7 days 3 hours
   */
  this.getTimeIntervalAsText = function (start, end) {
    var days = '',
        hours = '';

    // only calculate if the end is larger than start
    if (end > start) {
      var interval = end - start;
      days = Math.floor(interval / this.day);
      hours = Math.floor((interval % this.day) / this.hour);
    }
    return {
      days: days,
      hours: hours
    };
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
   *                             [t0, [[x0, y0], [x1, y1], ..., [xn, yn]],
   *                             [t1, [[x0, y0], [x1, y1], ..., [xn, yn]],
   *                             ...
   *                             [tm, [[x0, y0], [x1, y1], ..., [xn, yn]],
   *                           ]
   * @param  {object} timeState nxt timeState object
   * @return {array}           array (for timestep 1) of shape:
   *                           [[x0, y0_1], [x1, y1_1], ...]
   */
  this.createDataForTimeState = function (data, timeState) {
    var interval = timeState.end - timeState.start;
    var cur = timeState.at - timeState.start;
    var i = Math.round(data.length * cur / interval);
    var dataForTimeState = [];

    angular.forEach(data[i][1], function (value) {
      dataForTimeState.push([value[0], value[1]]);
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

  this.lLatLngBoundsToGJ = function (bounds) {
    var w = bounds._southWest.lng,
        s = bounds._southWest.lat,
        e = bounds._northEast.lng,
        n = bounds._northEast.lat;

    return {
      'type': 'Polygon',
      'coordinates': [
        [
          [w, n],
          [e, n],
          [e, s],
          [w, s],
          [w, n]
        ]
      ]
    };
  };


  this.lLatLngToGJ = function (latLng) {
    return {
      'type': 'Point',
      'coordinates': [latLng.lng, latLng.lat]
    };
  };

  /**
   * Stringifies a GeoJSON object into WKT
   */
  this.geomToWkt = function (gj) {
    if (gj.type === 'Feature') {
      gj = gj.geometry;
    }

    function pairWKT (c) {
      return c.join(' ');
    }

    function ringWKT (r) {
      return r.map(pairWKT).join(', ');
    }

    function ringsWKT (r) {
      return r.map(ringWKT).map(wrapParens).join(', ');
    }

    function multiRingsWKT (r) {
      return r.map(ringsWKT).map(wrapParens).join(', ');
    }

    function wrapParens (s) { return '(' + s + ')'; }

    switch (gj.type) {
      case 'Point':
        return 'POINT (' + pairWKT(gj.coordinates) + ')';
      case 'LineString':
        return 'LINESTRING (' + ringWKT(gj.coordinates) + ')';
      case 'Polygon':
        return 'POLYGON (' + ringsWKT(gj.coordinates) + ')';
      case 'MultiPoint':
        return 'MULTIPOINT (' + ringWKT(gj.coordinates) + ')';
      case 'MultiPolygon':
        return 'MULTIPOLYGON (' + multiRingsWKT(gj.coordinates) + ')';
      case 'MultiLineString':
        return 'MULTILINESTRING (' + ringsWKT(gj.coordinates) + ')';
      case 'GeometryCollection':
        return 'GEOMETRYCOLLECTION (' + gj.geometries.map(this.geomToWkt).join(', ') + ')';
      default:
        throw new Error('geomToWkt requires a valid GeoJSON Feature or geometry object as input');
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
   * @description - Checks whether ALL elements of the input satisfy the
   *                predicate
   * @param {arr} - An enumerable/iterable datastructure, e.g. Array
   * @param {predicate_} - A predicate, e.g.
   *                       'even': function (x) { x % 2 === 0 };
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
      document.querySelector("#dark-overlay").style.display = "inline";
      document.querySelector("#mymodal").style.display = "block";
    }
  };


  /**
   * @description - Deduce the wanted geometry-type from the passed in geomOpts
   * @param {object} geomOpts - the options.geom object
   * @return {string} - "POINT" | "LINE" | "AREA" | throw new Error!
   *
   * TODO: get rid of this maniacal reverse engineering of our own code.
   * could be as easy as `feature.geometry.type`.
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

    } else if (geomOpts.coordinates) { // geojson
      return "REGION";

    } else {
      throw new Error(
        "getGeomType could not deduce a valid geometry type from the passed " +
        " in arg: 'geomOpts' =", geomOpts
      );
    }
  };


  /**
   * @function
   * @description - Count all keys for an object (we can't do this vanilla.js
   *                style in Angular template)
   * @param {object} obj - The object for which we want to know the amount of
   *                       keys.
   * @return {integer} - The amount of keys.
   */
  this.countKeys = function (obj) {
    return obj === undefined ? 0 : Object.keys(obj).length;
  };


  /**
   * @function
   * @description - Get correct icon.
   *                Assumes hydracore strings such as pumpstation and formats
   *                that into lz lz-* format.
   *                Exceptions, like for font-awesome's 'filter' can be added
   *                here when neccessary.
   */
  this.getIconClass = function (str, asset) {
    var station_type = asset && asset.station_type;
    var asset_type = asset && asset.type;
    if (str === "measuringstation") {
      if (station_type !== undefined) {
        switch (station_type) {
          case 1:
            return "lz lz-measuringstation";
          case 2:
            return "lz lz-manhole";
          case 3:
            return "lz lz-surface-water";
          case 4:
            return "lz lz-manhole";
          case 5:
            return "lz lz-manhole";
          case 6:
            return "lz lz-dmc";
          case 7:
            return "lz lz-seismometer";
          case 8:
            return "lz lz-radar-image";
          case 9:
            return "lz lz-radar-image";
          case 10:
            return "lz lz-inclinometer";
          default:
            return "lz lz-measuringstation";
        }
      } else {
        return "lz lz-measuringstation";
      }
    } else if (str === "pumpstation") {
      if (asset_type !== undefined) {
        switch (asset_type) {
          case "Rioolgemaal":
            return "lz lz-pumpstation-diesel";
          case "Poldergemaal":
            return "lz lz-pumpstation-electric";
          case "Transportgemaal":
            return "lz lz-pumpstation-diesel";
          case "Boezemgemaal":
            return "lz lz-pumpstation-electric";
          case "Onderbemaling":
            return "lz lz-pumpstation-wind";
          case "Drukgemaal":
            return "lz lz-pumpstation-diesel";
          case "Gemaal":
            return "lz lz-pumpstation-diesel";
          default:
            return "lz lz-pumpstation";
        }
      }
    }
    else {
      switch (str) {
        case 'filter':
          return 'fa fa-filter';
        default:
          return 'lz lz-' + str;
      }
    }
  };


  /* @description - Convert lin to log scale, given the following 3 args.
   * @param {number} value - the value to convert
   * @param {number} minValue - the start of the scale
   * @param {number} maxValue - the end of the scale
   * @return {number} - The converted value
   */
  this.lin2log = function (value, minValue, maxValue, minDomain, maxDomain) {
    var scale = d3.scale.log()
      .domain([minDomain, maxDomain])
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
   *                (bottom-limit = 1, or given as second parameter)
   * @param {latLngBounds} leafletBounds - A leaflet bounds object denoting the
   *                                       current spatial extent.
   * @param {minValue} minValue - The minimum value, usually 1, but can be changed
   * @return {number} - A number denoting the extent's corresponding perimeter
   *                   (expressed in Km^2)
   */
  this.extent2kilometers = function (leafletBounds, minValue) {
    if (typeof minValue === 'undefined') {
      minValue = 1;
    }

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
    return Math.max(minValue, latDistance * lngDistance);
  };

  /*
   * @function
   * @description wrapper around lodash.union function
   * which works better than our own implementation..
   * Could be more efficient to call from api in a batch
   * instead of tiled/geojson stuff.
   */
  this.union = _.union;

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
          if (result !== 0) { return result; }
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

  this.MIN_TIME = (new Date("Jan 01, 1900")).getTime();
  this.MAX_TIME = (new Date()).getTime() + 20 * 24 * 60 * 60 * 1000; // 20 Days
  this.TIMELINE_LEFT_MARGIN = 60;
  this.TIMELINE_RIGHT_MARGIN = 40;
  this.OMNIBOX_WIDTH = 420;

  this.getMinTime = function (currentTime) {
    return Math.max(this.MIN_TIME, currentTime);
  };

  this.getMaxTime = function (currentTime) {
    return Math.min(this.MAX_TIME, currentTime);
  };

  this.getLeftMargin = function (context) {
    var leftMargin = this.TIMELINE_LEFT_MARGIN;

    if (context === 'charts') {
      leftMargin += this.OMNIBOX_WIDTH;
    }

    return leftMargin;
  };

  this.getCurrentWidth = function (element) {
    return element[0].clientWidth - (
      this.TIMELINE_LEFT_MARGIN + this.TIMELINE_RIGHT_MARGIN
    );
  };

  this.hexColorToDecimalTriple = function (rgbString) {

    var rInt, gInt, bInt;

    if (rgbString.charAt(0) === "#") {
      rgbString = rgbString.substring(1, rgbString.length);
    }

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
      throw new Error("This aint a valid triple to convert into rgbString: " +
                      rgbTriple);
    }
  };

  /**
   * @descriptions - Round numbers, but use specified decimalCount for
   *                 resolution
   * @param {number} nr- The number to round.
   * @param {integer} - The amount of decimals wanted. Integer of undefined
   * @return {float} - The formatted number
   */
  this.round = function (nr, decimalCount) {
    var multiplier = Math.pow(10, decimalCount || 0);
    return Math.round(nr * multiplier) / multiplier;
  };

  /**
   * @function
   * @description - "%f-in-javascript", you know the drill
   *
   * @param {number} x - The input you want to convert
   * @param {integer} wantedIntCount - The amount of leading zeros
   * @param {integer} wantedFloatCount - The amount of trailing zeros
   * @param {boolean} dutchify - Swap seperators: "." <--> ","
   *
   * @return {string} - The formatted number, formatted as string
   */
  this.formatNumber = function (x, wantedIntCount, wantedFloatCount, dutchify) {

    var i,
        splitted = x.toString().split("."),
        prefix = splitted[0],
        suffix = splitted[1] || "";

    while (prefix.length < wantedIntCount) {
      prefix = "0" + prefix;
    }

    while (suffix.length < wantedFloatCount) {
      suffix += "0";
    }

    if (dutchify) {
      prefix.replace(",", ".");
      suffix.replace(",", ".");
      return prefix + "," + suffix;
    }
    return prefix + "." + suffix;
  };

  /**
   * Set timeline to moving and back after digest loop to trigger watches
   * that do something after the timeline moved.
   *
   * @param {object} state - State object.
   */
  this.announceMovedTimeline = function (state) {
    state.temporal.timelineMoving = true;

    // Set timeline moving to false after digest loop
    $timeout(
      function () {
        state.temporal.timelineMoving = false;
      },
      0, // no delay, fire when digest ends
      true // trigger new digest loop
    );
  };

  /**
   * @function _formatDate
   * @summmary Format epoch in ms to human readable string.
   * @description Format epoch in ms to human readable string.
   *
   * @param {integer} epoch - time in ms since 1970.
   * @returns {string} formatted date.
   */
  this.formatDate = function (epoch) {
    var d = new Date(parseInt(epoch, 10));
    return [
      [d.getDate(), d.getMonth() + 1,
       d.getFullYear()].join('-'),
      [d.getHours() || "00",
       d.getMinutes() || "00",
       d.getSeconds() || "00"].join(':')
    ];
  };

  /**
   * Format CSV (exporting rain data for a point in space/interval in
   * time) in a way that makes it comprehensible for les autres.
   *
   * @param {object []} data - list with data objects to parse.
   * @param {array} coords - list of coordinates of data.
   * @returns list of formatted data objects.
   */
  this.formatCSVColumns = function (data, coords) {
    var i,
        latLng = L.latLng(coords[1], coords[0]),
        formattedDateTime,
        formattedData = [];

    for (i = 0; i < data.length; i++) {

      formattedDateTime = this.formatDate(data[i].timestamp || data[i][0]);

      var formattedDatum = [
        this.formatNumber(latLng.lat, 0, 0, true),
        this.formatNumber(latLng.lng, 0, 0, true),
        formattedDateTime[0],
        formattedDateTime[1]
      ];

      if (data[i].max !== undefined && data[i].min !== undefined) {
        formattedDatum.push(
          this.formatNumber(
            Math.round(100 * data[i].min) / 100 || 0,
            0,
            2,
            true // Dutchify seperators
          )
        );
        formattedDatum.push(
          this.formatNumber(
            Math.round(100 * data[i].max) / 100 || 0,
            0,
            2,
            true
          )
        );
      } else {
        formattedDatum.push(
          this.formatNumber(
            Math.round(100 * data[i][1]) / 100 || 0,
            0,
            2,
            true // Dutchify seperators
          )
        );
      }

      formattedData.push(formattedDatum);

    }

    return formattedData;
  };

  /**
   * Create a slug from a string.
   * This is the Javascript equivalent of the Django algorithm:
   * https://docs.djangoproject.com/en/1.8/_modules/django/utils/text/#slugify
   *
   * @param {string} s - The string to slugify.
   * @returns a slugified version of the string.
   */
  this.slugify = function(s) {
    var value;
    value = s;
    // Remove all non-alphanumeric-underscore-dash-space characters.
    value = _.replace(value, /[^\w\s-]/g, '');
    // Remove leading and trailing whitespace.
    value = _.trim(value);
    // Convert to lowercase.
    value = _.lowerCase(value);
    // Replace spaces with dashes.
    value = _.replace(value, /[-\s]+/g, '-');
    return value;
  };

  /**
   * @function
   * @description given point p find the closest
   * point on the line between a and b
   *
   * Taken from: http://www.gamedev.net/topic/444154-closest-point-on-a-line/
   */
  this.pointAlongLine = function (p, a, b) {
    var diffPA = {
      lat: p.lat - a.lat,
      lng: p.lng - a.lng
    };
    var diffAB = {
      lat: b.lat - a.lat,
      lng: b.lng - a.lng
    };

    var ab2 = diffAB.lat * diffAB.lat + diffAB.lng * diffAB.lng;
    var apAb = diffPA.lat * diffAB.lat + diffPA.lng * diffAB.lng;
    var t = apAb / ab2;
    if (t < 0) {
      t = 0;
    }
    if (t > 1) {
      t = 1;
    }
    var closest = new L.LatLng(
      a.lat + diffAB.lat * t,
      a.lng + diffAB.lng * t
    );
    return closest;
  };

  this.extractStylesString = function (styles, aggWindow) {
    var stylesString;
    if (typeof styles === typeof {}) {
      // The "styles" option for the raster has datatype Object:
      var styleObjForSomeZoomLevel = styles[0];
      if (styleObjForSomeZoomLevel.hasOwnProperty(aggWindow)) {
        stylesString = styleObjForSomeZoomLevel[aggWindow];
      } else {
        var availableAggWindows = Object.keys(styleObjForSomeZoomLevel);
        var sortedAggWindows = _.sortBy(availableAggWindows);
        var minAggWindow = _.first(sortedAggWindows);
        var maxAggWindow = _.last(sortedAggWindows);
        if (aggWindow > maxAggWindow) {
          stylesString = styleObjForSomeZoomLevel[maxAggWindow];
        } else {
          stylesString = styleObjForSomeZoomLevel[minAggWindow];
        }
      }
    } else {
      // The "styles" option for the raster has datatype String:
      stylesString = styles;
    }
    return stylesString;
  };

  /**
    * @description  This function is used to format a raster configs "styles"
    *               value. This should be used for e.g. colormap API calls, where
    *               the value is parsed differently than when used for the WMS.
    *               E.g:
    *
    *               "dem-nl"     => "dem-nl"
    *               "dem-nl:8:9" => "dem-nl"
    *               "dem-nl:8:"  => "dem-nl"
    *               "abcd"       => "abcd"
    *               "abcd:0:23"  => "abcd"
    *
    * @param {string} styles
    */
  this.extractColormapName = function (stylesString) {
    var parts = stylesString.split(":");
    return parts.length > 2
      ? parts[0]
      : stylesString;
  };

  /**
    * @description  This function is used to inspect a raster config "styles"
    *               value. It returns a boolean indicating whteher the string
    *               defined as value for the "styles" key has min/max
    *               configured:
    *
    *               "dem-nl"     => false
    *               "dem-nl:8:9" => true
    *               "dem-nl:8:"  => true => Though this probably not work well.
    *               "abcd"       => false
    *               "abcd:0:23"  => true
    *
    * @param {string} styles
    */
  this.isCompoundStyles = function (stylesString) {
    return stylesString
      ? stylesString.split(":").length === 3
      : false;
  };

  /*
   * @description This function is called once to make sure that the user can't
   *              zoom in/out using the ctrl key + the mouse's scrollwheel.
   *              Take note that this does not interfere with the designed
   *              functionality of either panning nor zooming the timeline nor
   *              map.
   */
  this.preventMousewheelZoom = function () {
    var ctrlIsPressed = null;
    var isCtrlPressed = function () {
      return ctrlIsPressed;
    };
    var noZoomFn = function (e) {
      if (isCtrlPressed()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    $(document).keydown(function (e) {
      if (e.keyCode === 17 || e.key === 'Control') { ctrlIsPressed = true; }
    });
    $(document).keyup(function (e) {
      if (e.keyCode === 17 || e.key === 'Control') { ctrlIsPressed = false; }
    });
    $('body').bind('mousewheel', noZoomFn); // Chromium/IE
    $('body').bind('DOMMouseScroll', noZoomFn); // Firefox
  };

  /**
   * @description Used for converting timesteps (representing points in time,
   *              saved according to the UTC standard) to the client's
   *              localtime (=local time at the point in space where the
   *              end-user is located when using the Lizard-client).
   */
  this.subtractOffsetUTC = function (timesteps) {
    var offsetInMinutes,
        offsetInMsec;
    return _.map(timesteps, function (step) {
      offsetInMinutes = new Date(step).getTimezoneOffset();
      offsetInMsec = 1000 * 60 * offsetInMinutes;
      return step - offsetInMsec;
    });
  };

  this.dateToLocaleDependentString = function (dateObject) {
    if (!dateObject) {
      return '...';
    }

    var locale = window.navigator.language || window.navigator.browserLanguage;

    if (locale) {
      return dateObject.toLocaleString(locale);
    } else {
      // Can't find it, this uses a default locale (probably en-US)
      return dateObject.toLocaleString();
    }
  };
}]);
