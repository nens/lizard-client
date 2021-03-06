angular.module('omnibox')
.directive('dbGeometryCards', [
  'State',
  'DBCardsService',
  'DataService',
  'DashboardChartService',
  'DragService',
  function (
      State,
      DBCardsService,
      DataService,
      DashboardChartService,
      DragService) {
    return {
      link: function (scope, element, attrs) {

        scope.state = State;
        scope.noData = false;

        scope.colorPickersSettings = DBCardsService.colorPickersSettings;
        scope.openColorPicker = DBCardsService.openColorPicker;
        scope.closeColorPicker = DBCardsService.closeColorPicker;
        scope.getKeyForRasterGeometry = DashboardChartService.getKeyForRasterGeometry;
        scope.getOrCreateChart = DashboardChartService.getOrCreateChart;
        scope.toggleChart = DashboardChartService.toggleChart;
        scope.isChartActive = DashboardChartService.isChartActive;

        var geomOrAsset = function () {
          return scope.geom || scope.asset;
        };

        // Make sure all event series data etc gets updated on geo.
        DataService.getGeomData(geomOrAsset()).then(function (geo) {
          // console.log("Updated geo:", geo, geomOrAsset());
        });

        scope.getKey = function (raster) {
          if (scope.asset) {
            return DashboardChartService.getKeyForRasterAsset(raster, scope.asset);
          } else {
            return DashboardChartService.getKeyForRasterGeometry(raster, scope.geom);
          }
        };

        scope.toggleColorPicker = function (key) {
          if (scope.colorPickersSettings[key]) {
            scope.closeColorPicker(key);
          } else {
            scope.openColorPicker(key);
          }
        };

        scope.getActiveTemporalRasterLayers = function () {
          var activeRasterLayers = State.layers.filter(function (layer) {
            return layer.active && layer.type === 'raster';
          });

          var layers = activeRasterLayers.filter(function (layer) {
            var raster = DataService.getDataLayer(layer.uuid);
            if (!raster) {
              // Still fetching it?
              return true;
            }
            return raster.temporal;
          });

          return layers;
        };

        scope.toggleChart = DashboardChartService.toggleChart;

        DragService.addDraggableContainer(element.find('#drag-container'));
      },
      restrict: 'E',
      scope: {
        asset: '=',
        geom: '=',
        timeState: '=',
        header: '='
      },
      replace: true,
      templateUrl: 'omnibox/templates/db-geometry-cards.html'
    };
  }
]);
