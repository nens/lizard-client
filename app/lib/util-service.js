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
   * @function dataConvertToMeters
   * @memberOf UtilService
   *
   * @summary Takes data array with degrees as x-axis. Returns array with
   * meters as x-axis
   *
   * @param  {array} data Array with degrees
   * @return {array} data Array with meters
   */
  this.dataConvertToMeters = function (data) {
    for (var i = 0; data.length > i; i++) {
      data[i][0] = this.degToMeters(data[i][0]);
    }
    return data;
  };


  /**
   * @function degToMeters
   * @memberOf UtilService
   *
   * @summary Takes degrees converts to radians, then converts to
   * "haversine km's approximation", then to meters
   *
   * @param  {float} degrees
   * @return {float} meters
   */
  this.degToMeters = function (degrees) {
    return  (degrees * Math.PI) / 180 * 6371 * 1000;
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


  /*
   * @description - Replace display_name value with name value, if applicable
   * @param {string} str - The string to be converted.
   */
  this.fixUTFNameData = function (obj) {
    if (obj.display_name === '' || obj.display_name === undefined) {
      // If the to-be printed key (obj.display_name) has no value...
      if (obj.name !== '' && obj.name !== undefined) {
        // ..and it's alternative (obj.name) does have one,
        // we simply copy the alt value.
        obj.display_name = obj.name;
      }
    }
    return obj;
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
  this.MAX_TIME = (new Date("Jan 01, 2016")).getTime();
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
}]);
