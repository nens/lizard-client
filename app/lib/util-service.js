/**
 * @ngdoc service
 * @class UtilService
 * @name UtilService
 * @summary Generic util functions.
 * @description Generic util functions.
 */
angular.module('lizard-nxt')
  .service("UtilService", ["NxtD3", "$timeout", function (NxtD3, $timeout) {

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
    }

    else if (checkForLine(geom)) {
      // geom represents a line
      var coords = [];
      angular.forEach(geom, function (latLng) {
        coords.push(latLng.lng + " " + latLng.lat);
      });
      return "LINESTRING(" + coords.join(',') + ")";
    }

    else if (geom.type === 'Polygon') {
      var lng, lat, coords = [];
      var cs = geom.coordinates[0];
      for (var i = 0; i < cs.length; i++) {
        coords.push(cs[i][0] + " " + cs[i][1]);
        if (i === 0) {
          lng = cs[i][0];
          lat = cs[i][1];
        }
      }
      return "POLYGON((" + coords.join(",") + "," + lng + " " + lat + "))";
    }

    else {
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
   * TODO: get rid of this maniacal reverse engineering of our own code.
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
      return "REGION"

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

  this.MIN_TIME = (new Date("Jan 01, 1970")).getTime();
  this.MAX_TIME = (new Date()).getTime() + 24 * 60 * 60 * 1000;
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
   * @param {integer/undefined} - The amount of decimals wanted.
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
  this._formatDate = function (epoch) {
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
   * @param {object} latLng - latlng object with location of data.
   * @returns list of formatted data objects.
   */
  this.formatCSVColumns = function (data, latLng) {
    var i,
        formattedDateTime,
        formattedData = [];

    for (i = 0; i < data.length; i++) {

      formattedDateTime = this._formatDate(data[i]['timestamp'] || data[i][0]);

      var formattedDatum = [
        this.formatNumber(latLng.lat, 0, 0, true),
        this.formatNumber(latLng.lng, 0, 0, true),
        formattedDateTime[0],
        formattedDateTime[1]
      ];

      if (data[i].max !== undefined && data[i].min !== undefined) {
        formattedDatum.push(
          this.formatNumber(
            Math.round(100 * data[i]['min']) / 100 || 0,
            0,
            2,
            true // Dutchify seperators
          )
        );
        formattedDatum.push(
          this.formatNumber(
            Math.round(100 * data[i]['max']) / 100 || 0,
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

}]);
