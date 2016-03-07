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

angular.module('omnibox')
  .directive('assetCards', ['ClickFeedbackService', 'MapService',
    function (ClickFeedbackService, MapService) {
  return {
    link: function (scope, element) {

      var asset = scope.asset;

      var feature = {
        type: 'Feature',
        geometry: asset.geometry,
        properties: {
          entity_name: asset.entity_name,
          type: asset.type || ''
        }
      };

      var clickId = ClickFeedbackService.drawGeometry(
        MapService,
        feature
      );

      ClickFeedbackService.vibrateOnce(feature);

      element.on('$destroy', function () {
        ClickFeedbackService.removeClickFromClickLayer(clickId);
      });


    },
    restrict: 'E',
    scope: {
      asset: '=',
      timeState: '=',
      longFormat: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/asset-cards.html'
  };
}]);


angular.module('omnibox')
  .directive('geometryCards', ['MapService', 'ClickFeedbackService',
    function (MapService, ClickFeedbackService) {
  return {
    link: function (scope, element) {

      scope.showNoData = false;
      var clickId = 0;

      var destroy = function () {
        if (clickId) {
          ClickFeedbackService.removeClickFromClickLayer(clickId);
        }
      };

      scope.$watchCollection('geom.geometry.coordinates', function () {
        destroy();

        var geom = scope.geom;

        if (scope.header && geom.geometry.type === 'Point') {
          var latLng = L.latLng(
            geom.geometry.coordinates[1],
            geom.geometry.coordinates[0]
          );
          clickId = ClickFeedbackService.drawArrow(MapService, latLng);
        }

        else if (scope.header && geom.geometry.type === 'LineString') {
          var coords = geom.geometry.coordinates;
          var start = L.latLng(coords[0][1], coords[0][0]);
          var end = L.latLng(coords[1][1], coords[1][0]);
          clickId = ClickFeedbackService.drawLine(
            MapService,
            start,
            end
          );

        }
      });

      scope.$watchCollection('geom.properties', function (newProps, oldProps) {
        if (newProps) {
          scope.showNoData = !Object.keys(newProps).length;
        }
      });

      element.on('$destroy', function () {
        destroy();
      });


    },
    restrict: 'E',
    scope: {
      geom: '=',
      timeState: '=',
      header: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/geometry-cards.html'
  };
}]);


angular.module('omnibox')
  .directive('cardattributes', ['WantedAttributes',
    function (WantedAttributes) {
  return {
    link: function (scope) { scope.wanted = WantedAttributes; },
    restrict: 'E',
    scope: {
      waterchain: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/cardattributes.html'
  };
}]);

angular.module('omnibox')
  .directive('cardheader', ['UtilService',
    function (UtilService) {
  return {
    link: function (scope) {
      scope.getIconClass = UtilService.getIconClass;
    },
    restrict: 'E',
    scope: {
      asset: '=',
      geom: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/card-header.html'
  };
}]);




angular.module('omnibox')
  .directive('summaryCard', ['WantedAttributes',
    function (WantedAttributes) {
  return {
    link: function (scope) { scope.wanted = WantedAttributes; },
    restrict: 'E',
    scope: {
      asset: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/summary-card.html'
  };
}]);


angular.module('omnibox')
  .directive('nestedasset', ['WantedAttributes', 'DataService',
    function (WantedAttributes, DataService) {
  return {
    link: function (scope) {

      scope.wanted = WantedAttributes;

      /**
       * Watch asset unpack json string, add entity name and select first child
       * asset.
       */
      scope.$watch('asset', function () {
        scope.attr = scope.asset.pumps ? 'pump' : 'filter';
        if (typeof(scope.asset[scope.attr + 's']) === 'string') {
          scope.list = JSON.parse(scope.asset[scope.attr + 's']);
        } else if (typeof(scope.asset[scope.attr + 's']) === 'object') {
          scope.list = scope.asset[scope.attr + 's'];
        } else {
          scope.list = [];
        }
        angular.forEach(scope.list, function (asset) {
          asset.entity_name = scope.attr;
        });
        scope.asset.selectedAsset = scope.list[0];
      });

    },
    restrict: 'E',
    scope: {
      asset: '=',
    },
    replace: true,
    templateUrl: 'omnibox/templates/nestedasset.html'
  };
}]);

angular.module('omnibox')
  .directive('rain', ['State', 'RasterService', 'UtilService', function (State, RasterService, UtilService) {
  return {
    link: function (scope) {

      scope.util = UtilService;

      scope.rrc = {
        active: false
      };

      var setGraphContent = function () {
        scope.graphContent = [{
          data: scope.rain.properties.rain.data,
          keys: {x: 0, y: 1},
          labels: {y: 'mm'}
        }];
      };

      scope.recurrenceTimeToggle = function () {
        scope.rrc.active = !scope.rrc.active;
        if (scope.rrc.active) { getRecurrenceTime(); }
      };


      scope.$watchCollection("rain.properties.rain.data", function (n, o) {
        setGraphContent();
        if (scope.rrc.active) {
          getRecurrenceTime();
        }
      });

      // Hack to get raw rain data when hitting Export
      // Gets data directly from raster endpoint of raster RAW_RAIN_RASTER_UUID
      // limited to MAX_TIME_INTERVAL in ms
      var RAW_RAIN_RASTER_UUID = '730d6675-35dd-4a35-aa9b-bfb8155f9ca7',
          MAX_TIME_INTERVAL = 86400000 * 365.2425 / 12;  // 1 month

      // export button is active by default
      scope.exportActive = true;

      // disable export button when interval is bigger than MAX_TIME_INTERVAL
      scope.checkTempInterval = function () {
        if (State.temporal.end - State.temporal.start < MAX_TIME_INTERVAL) {

          scope.rawDataUrl =
            window.location.origin + '/api/v2/rasters/' +
            RAW_RAIN_RASTER_UUID + '/data/' +
            '?format=csv' +
            '&start=' +
            new Date(State.temporal.start).toISOString().split('.')[0] +
            '&stop=' +
            new Date(State.temporal.end).toISOString().split('.')[0] +
            '&geom=' + UtilService.geomToWkt(State.spatial.here) +
            '&srs=EPSG:4326';

          scope.exportActive = true;
        } else {
          scope.exportActive = false;
        }
      };
      // ENDHACK

      var getRecurrenceTime = function () {
        scope.rrc.data = null;

        // TODO: refactor this shit
        RasterService.getData(
          'RainController',
          {slug: 'rain'},
          {
            agg: 'rrc',
            geom: L.latLng(scope.rain.geometry.coordinates[1], scope.rain.geometry.coordinates[0]),
            start: State.temporal.start,
            end: State.temporal.end
          }
        ).then(function (response) {
          scope.rrc.data = response;
        });
      };

    },
    restrict: 'E',
    scope: {
      rain: '=',
      timeState: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/rain.html'
  };
}]);

angular.module('omnibox')
  .directive('defaultpoint', ['UtilService', function (UtilService) {
  return {
    link: function (scope) {
      scope.isUrl = UtilService.isUrl;
    },
    restrict: 'E',
    scope: {
      content: '=',
      state: '=',
    },
    replace: true,
    templateUrl: 'omnibox/templates/defaultpoint.html'
  };
}]);

angular.module('omnibox')
  .directive('searchResults', [function () {
  return {
    restrict: 'E',
    templateUrl: 'omnibox/templates/search-results.html'
  };
}]);
