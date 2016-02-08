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
        scope.list = JSON.parse(scope.asset[scope.attr + 's']);
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
  .directive('rain', ['State', 'RasterService', function (State, RasterService) {
  return {
    link: function (scope) {

      scope.rrc = {
        active: false
      };

      var setGraphContent = function () {
        scope.graphContent = [{
          data: scope.rain.data,
          keys: {x: 0, y: 1},
          labels: {y: 'mm'}
        }];
      };

      scope.recurrenceTimeToggle = function () {
        if (!scope.$$phase) {
          scope.$apply(function () {
            scope.rrc.active = !scope.rrc.active;
          });
        } else {
          scope.rrc.active = !scope.rrc.active;
        }
      };


      scope.$watchCollection("rain.data", function (n, o) {
        setGraphContent();
        if (scope.rrc.active) {
          getRecurrenceTime();
        }
      });

      var getRecurrenceTime = function () {
        scope.rrc.data = null;

        // TODO: refactor this shit
        RasterService.getData(
          'RainController',
          {slug: 'rain'},
          {
            agg: 'rrc',
            geom: L.Latlng(scope.geom.geomtry.coordinates[1], scope.geom.geomtry.coordinates[0]),
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
