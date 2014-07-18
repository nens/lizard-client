/**
 * Generic utilities
 */
app.factory('hashSyncHelper', ['$location', '$parse', '$rootScope',
  function ($location, $parse, $rootScope) {
  /**
   * Offers a getHash and setHash for manipulating the url hash
   */
    var service = {
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
          if (v) { obj2[k] = v; }
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


app.service("UtilService", function () {

  /**
   * Round javascript timestamp to nearest coefficient.
   *
   * For example, if you want to round timestamp to the nearest 5 minutes,
   * coefficient = 1000 * 60 * 5 = 30000
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

    if (tzOffset === true) {
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
   * Returns aggWindow. Either five minutes, an hour or a day, should
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

});
