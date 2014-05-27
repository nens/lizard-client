/**
 * Generic utilities
 */
app.factory('hashSyncHelper', ['$location', '$parse', '$rootScope', function ($location, $parse, $rootScope) {
    var service = {
      getHash: function () {
        return parseKeyValue($location.hash());
      },
      setHash: function (obj, replaceHistory) {
        if (!isDefined(replaceHistory)) replaceHistory = true;
        var obj2 = {};
        // strip out blank values
        var oldhash = this.getHash();
        angular.forEach(obj, function (v, k) { 
          if (v) obj2[k] = v; 
        });
        jQuery.extend(oldhash, obj2); // TODO/WISH: Replace jQuery with a native solution
        $location.hash(toKeyValue(oldhash));
        if (replaceHistory) {
          $location.replace();
        }
      },
      sync: function (expr, scope, replaceHistory) {
        if (!scope) scope = $rootScope;

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
                                    coefficient) * coefficient;

    if (tzOffset === true) {
      var timeZoneOffset = (new Date(roundedTimestamp)).getTimezoneOffset() *
        1000 * 60;
      roundedTimestamp = roundedTimestamp - timeZoneOffset;
    }

    return roundedTimestamp;
  };

  this.getZoomlevelLabel = function(zoomlevel) {
    // TODO: Can be used to communicate the current 
    // zoomlevel in language comprehensible to the user
      var zoomLevel = zoomlevel;
      switch (true) {
        case (zoomLevel>=18):
          // console.log('Objectniveau'); // fa-building
          return 'object';
        case (zoomLevel>=17):
          // console.log('Straatniveau'); // fa-road
          return 'street';
        case (zoomLevel>=15):
          // console.log('Gemeenteniveau'); // fa-university
          return 'municipal';
        case (zoomLevel>=10):
          // console.log('Provincieniveau'); // fa-university
          return 'provincial';
        case (zoomLevel>=8):
          // console.log('Landniveau'); // fa-university
          return 'country';
        case (zoomLevel>=5):
          // console.log('Continentniveau'); // fa-globe
          return 'continental';
        case (zoomLevel>=2):
          // console.log('Wereldniveau'); // fa-globe
          return 'global';
      }
  };

});
