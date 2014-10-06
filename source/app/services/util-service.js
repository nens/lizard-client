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
   * @function serveToMobileDevice
   * @memberOf UtilService
   */
  this.serveToMobileDevice = function () {

    var result = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|windows phone/i.test(
      navigator.userAgent.toLowerCase()
    );
    return result;
  };

  /**
   * @function geomToWkt
   * @memberOf UtilService
   */
  this.geomToWkt = function (geom) {

    if (geom.lat && geom.lng) {
      // geom is a L.LatLng object
      return "POINT(" + geom.lng + " " + geom.lat + ")";

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
});
