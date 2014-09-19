/**
 * @class hashSyncHelper
 * @memberOf app
 *
 * @summary Helper functions for hash sync.
 *
 * @description
 * Provides a setter and getter function to manipulate the url hash to keep the
 * url hash synchronised with the actual application state. That way you can
 * use the url to share application state.
 *
 * **Example:** https://nxt.lizard.net/#location=52.3663,5.1893,13&layers=topography&start=Dec-01-2013&end=Mar-12-2014
 *
 * where:
 *
 * - **location:** spatial extent with comma seperated latlon of centroid and
 * zoomlevel: `location=lat,lon,zoomlevel`.
 * - **layers:** comma seperated list of layer slugs: `layers=slug1,slug2`.
 * - **start:** start of timeline: `start=May-01-2014`.
 * - **end:** end of timeline: `end=Jun-29-2014`.
 */
app.factory('hashSyncHelper', ['$location', '$parse', '$rootScope',
  function ($location, $parse, $rootScope) {

    var service = {
      /**
       * @function getHash
       * @memberOf hashSyncHelper
       *
       * @summary Reads has fragment from angulars location service and
       * returns it as key / value object.
       *
       * @return {object}
       */
      getHash: function () {
        var lookup = {
          0: 'location',
          1: 'layers',
          2: 'start',
          3: 'end',
          4: 'fromHere',
          5: 'toHere'
        };

        var hash = {};
        var path = $location.path();
        if (path === '') { return hash; }
        path = path.split('@');
        path = path[path.length - 1];
        path = path.split('/');
        var i = 0;
        angular.forEach(lookup, function (value, key) {
          if (path[key]) {
            hash[value] = path[key];
          }
        });
        return hash;
      },

      /**
       * @function setHash
       * @memberOf hashSyncHelper
       *
       * @summary Sets the url hash with a {'key':'val'}.
       *
       * @description Loops over the incoming object and fill obj2 with it. Then
       * extend the original hash object with the new hash object. Finally set
       * the hash using angular location service.
       *
       * @param {object} obj - Object with key
       */
      setHash: function (obj) {
        var obj2 = {};
        var oldhash = this.getHash(); // Copy the current hash
        angular.forEach(obj, function (v, k) {
          if (v !== undefined) { obj2[k] = v; }
        });
        angular.extend(oldhash, obj2);
        var hashString = '/map@';
        angular.forEach(oldhash, function (value) {
          if (value) {
            hashString += value + '/';
          }
        });
        $location.path(hashString);
      }
    };

    return service;
  }]);


/**
 * @ngdoc service
 * @class UtilService
 * @name UtilService
 * @summary Generic util functions.
 * @description Generic util functions.
 */
app.service("UtilService", function () {

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
   * @param {boolean} tzOffset - true if you want to correct for timezone
   * offset.
   * @returns {integer} roundedTimestamp - timestamp rounded to nearest
   * coefficient.
   */
  this.roundTimestamp = function (timestamp, coefficient, tzOffset) {
    var roundedTimestamp = parseInt((timestamp + (coefficient / 2)) /
                                    coefficient, 10) * coefficient;

    if (!!tzOffset) {
      var timeZoneOffset = (new Date(roundedTimestamp)).getTimezoneOffset() *
        1000 * 60;
      roundedTimestamp = roundedTimestamp - timeZoneOffset;
    }

    return roundedTimestamp;
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
    var aggWindow;
    var minPx = 3; // Minimum width of a bar
    // Available zoomlevels
    var zoomLvls = {fiveMinutes: 300000,
                    hour: 3600000,
                    day: 86400000,
                    month: 2635200000}; // Month equals 30.5 days
    // ms per pixel
    var msPerPx = (stop - start) / drawingWidth;
    for (var zoomLvl in zoomLvls) {
      aggWindow = zoomLvls[zoomLvl];
      if (aggWindow > minPx * msPerPx) {
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
   * @function createLineWKT
   * @memberOf UtilService
   *
   * @summary Create WKT line from two latlon objects.
   *
   * @param {object} firstClick - object with list of latlon.
   * @param {object} secondClick - object with list of latlon.
   * @return {string} - WKT string of line between firstClick and secondClick.
   */
  this.createLineWKT = function (firstClick, secondClick) {
    return [
      "LINESTRING(",
      firstClick.lng,
      " ",
      firstClick.lat,
      ",",
      secondClick.lng,
      " ",
      secondClick.lat,
      ")"
    ].join('');
  };

  /**
   * @function hasMobileDevice
   * @memberOf UtilService
   *
   * @summary Create WKT line from two latlon objects.
   */
  this.serveToMobileDevice = function () {

    var result = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|windows phone/i.test(
      navigator.userAgent.toLowerCase()
    );

    if (JS_DEBUG) {
      console.log((result ? '' : 'non-') + "mobile platform detected!");
    }

    return result;
  };

});
