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
  .directive('assetCards', ['ClickFeedbackService', 'MapService', 'user',
    function (ClickFeedbackService, MapService, user) {
  return {
    link: function (scope, element) {

      scope.assetType = 'asset';
      scope.user = user;

      var clickId;

      var removeAsset = function (id) {
        ClickFeedbackService.removeClickFromClickLayer(id);
      };

      var setAsset = function (asset) {

        if (clickId) {
          removeAsset(clickId);
        }

        // Child assets (filters from groundwater stations) do not always have
        // a geometry.
        if (asset.geometry) {

          var feature = {
            type: 'Feature',
            geometry: asset.geometry,
            properties: {
              entity_name: asset.entity_name,
              type: asset.type || ''
            }
          };
          clickId = ClickFeedbackService.drawGeometry(
            MapService,
            feature
          );

          ClickFeedbackService.vibrateOnce(feature, clickId);

        }

        cancelAssetWatch();
      };

      var cancelAssetWatch = scope.$watch('asset', setAsset);

      element.on('$destroy', function () {
        if (clickId) {
          removeAsset(clickId);
        }
      });


    },
    restrict: 'E',
    scope: {
      asset: '=',
      timeState: '=',
      longFormat: '=',
      showHeader: '=',
      showTimeseries: '=',
      showAnnotations: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/asset-cards.html'
  };
}]);


angular.module('omnibox')
  .directive('geometryCards', ['MapService', 'ClickFeedbackService', 'CSVService', 'user',
    function (MapService, ClickFeedbackService, CSVService, user) {
  return {
    link: function (scope, element) {

      scope.user = user;
      scope.showNoData = false;

      // expose CSV functions for export
      scope.formatLineCSV = CSVService.formatLineCSV;
      scope.getLineCSVHeaders = CSVService.getLineCSVHeaders;

      scope.getGeomCardHeader = function (geom) {
        if (geom.geometry.type === 'Point') {
          var M = 100000;
          var lon = Math.round(geom.geometry.coordinates[0] * M) / M;
          var lat = Math.round(geom.geometry.coordinates[1] * M) / M;
          return '( ' + lat + ', ' + lon + ' )';
        } else if (geom.geometry.type === 'Polygon' ||
                   geom.geometry.type === 'MultiPolygon') {

          var name = geom.name;
          var area = geom.area;
          return name + ': ' + area / 10000 + ' ha';
        } else {
          return geom.geometry.type;
        }
      };

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
      header: '=',
      mouseloc: '=',
      showAnnotations: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/geometry-cards.html'
  };
}]);


angular.module('omnibox')
  .directive('cardattributes', ['WantedAttributes',
    function (WantedAttributes) {
  return {
    link: function (scope) {
      scope.wanted = WantedAttributes;
    },
    restrict: 'E',
    scope: {
      waterchain: '=',
      showHeader: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/cardattributes.html'
  };
}]);

angular.module('omnibox')
  .directive('cardheader', ['UtilService',
    function (UtilService) {
  return {
    link: function (scope, element, attrs) {
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
       .directive('nestedasset', ['WantedAttributes', 'DataService', 'State', 'getNestedAssets',
                                  'ChartCompositionService',
    function (WantedAttributes, DataService, State, getNestedAssets, ChartCompositionService) {
  return {
    link: function (scope) {

      scope.wanted = WantedAttributes;
      scope.longFormat = false;

      var sortNestedAssets = function (nestedAssets) {
        return _.sortBy(nestedAssets, ['code', 'serial', 'id']);
      };

      /**
       * Watch asset unpack json string, add entity name and select first child
       * asset.
       */
      scope.$watch('asset', function () {
        scope.list = sortNestedAssets(getNestedAssets(scope.asset));
        scope.asset.selectedAsset = scope.list[0];
      });

      var removeTSofAsset = function (asset) {
        State.selections.forEach(function (selection) {
          if (!selection.active) return; // Already in active

          if (selection.timeseries &&
              (asset.timeseries || []).map(
                function (asset) { return asset.uuid; }).indexOf(selection.timeseries) !== -1) {
            ChartCompositionService.deactivateSelection(selection);
          }
        });
      };

      scope.selectedAssetChanged = function (newAsset) {
        scope.list.forEach(function (asset) {
          if (asset.entity_name === newAsset.entity_name
            && asset.id === newAsset.id) {
            return;
          }
          else {
            removeTSofAsset(asset);
          }
        });
      };

      scope.$on('$destroy', function () {
        scope.list.forEach(function (asset) { removeTSofAsset(asset); });
      });
    },
    restrict: 'E',
    scope: {
      asset: '=',
      timeState: '=',
    },
    replace: true,
    templateUrl: 'omnibox/templates/nestedasset.html'
  };
}]);

angular.module('omnibox')
       .directive('rain', ['State', 'RasterService', 'UtilService',
                           function (State, RasterService, UtilService) {
  return {
    link: function (scope) {

      scope.rrc = {
        active: false
      };

      scope.rain.MAX_TIME_INTERVAL = 86400000 * 365.2425 / 12; // 1 month

      var setGraphContent = function () {
        scope.graphContent = [{
          data: scope.rain.data,
          keys: {x: 0, y: 1},
          labels: {y: 'mm'}
        }];
      };

      scope.recurrenceTimeToggle = function () {
        scope.rrc.active = !scope.rrc.active;
        if (scope.rrc.active) { getRecurrenceTime(); }
      };


      scope.$watchCollection("rain.data", function (n, o) {
        setGraphContent();
        if (scope.rrc.active) {
          getRecurrenceTime();
        }
      });

      // Gets data directly from raster endpoint of raster RAW_RAIN_RASTER_UUID
      var RAW_RAIN_RASTER_UUID = '730d6675-35dd-4a35-aa9b-bfb8155f9ca7';

      scope.getRawDataUrl = function (event) {
        var wkt = UtilService.geomToWkt(scope.geometry);
        // hack to make it testable on staging :( and gets the correct hostname
        // on production
        var hostname = window.location.hostname.replace('nxt.staging', 'demo');
        return 'https://' + hostname + '/api/v3/rasters/' +
          RAW_RAIN_RASTER_UUID + '/data/' +
          '?format=csv' +
          '&start=' +
          new Date(State.temporal.start).toISOString().split('.')[0] +
          '&stop=' +
          new Date(State.temporal.end).toISOString().split('.')[0] +
          '&geom=' + wkt +
          '&srs=EPSG:4326';
      };
      // ENDHACK

      var getRecurrenceTime = function () {
        scope.rrc.data = null;

        RasterService.getData(
          {
            uuid: scope.rain.uuid,
            agg: 'rrc',
            geom: scope.geometry,
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
      timeState: '=',
      geometry: '='
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
      timeState: '=',
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
