/**
 * @class hashSyncHelper
 * @memberOf app
 * @summary Helper functions for hash sync.
 * @description Helper functions for hash sync.
 */
app.factory('hashSyncHelper', ['$location', '$parse', '$rootScope',
  function ($location, $parse, $rootScope) {

    /**
     * Offers a getHash and setHash for manipulating the url hash
     */
    var service = {
      /**
       * @function getHash
       * @memberOf HashSyncHelper
       * @summary Reads has fragement from angulars location service and
       * returns it as key / value object.
       *
       */
      getHash: function () {
        // Reads the hash fragment from angulars location service
        // and returns it as a key/value object.
        return parseKeyValue($location.hash());
      },
      setHash: function (obj, replaceHistory) {
        // Sets the url hash with a {'key':'val'} and doesnt return
        if (!isDefined(replaceHistory)) { replaceHistory = true; }
        var obj2 = {};
        var oldhash = this.getHash(); // Copy the current hash
        angular.forEach(obj, function (v, k) {
          // Loop over the incoming object and fill obj2 with it
          // if v == "" this v is still used. !important for layers=
          if (v !== undefined) { obj2[k] = v; }
        });
        // Then extend the original hash object with the new hash object
        angular.extend(oldhash, obj2);
        // And finally set the hash using angular location service
        $location.hash(toKeyValue(oldhash));
        if (replaceHistory) {
          $location.replace();
        }
      },
      sync: function (expr, scope, replaceHistory) {
        // Unused for now
        if (!scope) {scope = $rootScope; }

        var setHash = function (val, old) {
          var obj = service.getHash();
          obj[expr] = val;
          service.setHash(obj, replaceHistory);
        };
        setHash($parse(expr)(scope));
        scope.$watch(expr, setHash);

        window.addEventListener('hashchange', function () {
          scope.$apply(function () {
            var obj = service.getHash();
            var val = obj[expr];
            $parse(expr).assign(scope, val);
          });
        });
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

  this.getZoomlevelLabel = function (zoomLevel) {
    // TODO: Can be used to communicate the current
    // zoomlevel in language comprehensible to the user

    switch (true) {
    case (zoomLevel >= 18):
      // console.log('Objectniveau'); // fa-building
      return 'object';
    case (zoomLevel >= 17):
      // console.log('Straatniveau'); // fa-road
      return 'street';
    case (zoomLevel >= 15):
      // console.log('Gemeenteniveau'); // fa-university
      return 'municipal';
    case (zoomLevel >= 10):
      // console.log('Provincieniveau'); // fa-university
      return 'provincial';
    case (zoomLevel >= 8):
      // console.log('Landniveau'); // fa-university
      return 'country';
    case (zoomLevel >= 5):
      // console.log('Continentniveau'); // fa-globe
      return 'continental';
    case (zoomLevel >= 2):
      // console.log('Wereldniveau'); // fa-globe
      return 'global';
    }
  };

  /**
   * @function
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
                    day: 86400000};
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
   * @summary: Toggle visibility of a card's content.
   *
   * NB! uses jQuery instead of CSS animations.
   *
   * @param {string} cardName An identifier specifying which card
   * is the subject of the animation.
   *
   */
  this.toggleThisCard = function (cardName) {

    var card,
        cont,
        btnText,
        titleText,
        separator,
        initHeight,
        slideTime,
        SLIDE_TIME_PER_100PX = 200,
        FADE_TIME = 200;

    card = $('#card-' + cardName);
    cont = $(card).find('.card-content')[0];
    btnText = $(card).find('.card-title-button-text')[0];
    titleText = $(card).find('.card-title-text')[0];
    separator = $(card).find('.card-separator')[0];

    if ($(card).hasClass("active")) {

      if ($(cont).data("slide-time")) {

        slideTime = parseInt($(cont).data("slide-time"));

      } else {

        initHeight = parseInt($(cont).css('height').split("px")[0]);
        slideTime = Math.floor((initHeight / 100) * SLIDE_TIME_PER_100PX);
        $(cont).attr("data-slide-time", slideTime);
      }

      $(separator).fadeOut(FADE_TIME, function () {
        $(cont).slideUp(slideTime, function () {
          $(card).removeClass("active");
          $(btnText).html("<i class='fa fa-chevron-left'></i>");
        });
      });

    } else {

      slideTime = parseInt($(cont).data("slide-time"));
      $(separator).css("display", "none");
      $(cont).slideDown(slideTime, function () {
        $(card).addClass("active");
        $(separator).fadeIn(FADE_TIME);
        $(btnText).html("<i class='fa fa-chevron-down'></i>");
      });
    }
  };

  /***
    * Fade out (in) currently (in-)visible cards.
    *
    * @param {boolean} fadeIn - A boolean denoting whether we need to
    * fade in or out.
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
   * Takes data array with degrees as x-axis.
   * Returns array with meters as x-axis
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
   * Takes degrees converts to radians
   * and then converts to "haversine km's approximation" and then to meters
   * @param  {float} degrees
   * @return {float} meters
   */
  this.degToMeters = function (degrees) {
    return  (degrees * Math.PI) / 180 * 6371 * 1000;
  };

  /**
   * Takes meters converts to radians
   * and then converts degrees
   * @param  {float} meters
   * @return {float} degrees
   */
  this.metersToDegs = function (meters) {
    return (meters / 1000 / 6371) * 180 / Math.PI;
  };


  /**
   * Creates a subset data object for a specific timeState
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

});
