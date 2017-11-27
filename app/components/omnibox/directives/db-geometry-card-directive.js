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
      link: function (scope, element) {

        scope.state = State;
        scope.noData = false;

        scope.colorPickersSettings = DBCardsService.colorPickersSettings;
        scope.openColorPicker = DBCardsService.openColorPicker;
        scope.closeColorPicker = DBCardsService.closeColorPicker;
        scope.getKeyForRasterGeometry = DashboardChartService.getKeyForRasterGeometry;
        scope.getOrCreateChart = DashboardChartService.getOrCreateChart;
        scope.toggleChart = DashboardChartService.toggleChart;
        scope.isChartActive = DashboardChartService.isChartActive;

        // Make sure all event series data etc gets updated on geo.
        DataService.getGeomData(scope.geom).then(function (geo) {
          console.log("Updated geo:", geo, scope.geom);
        });

        scope.$watch('geom', function () {
          DashboardChartService.initializeRaster(scope.geom, "geom");
        });

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
            return raster.temporal;
          });

          return layers;
        };

        scope.getIterableSelections = function () {
          // Filter State.selections based on whether they are for temporal rasters:
          var selection,
              dataLayer,
              wantedSelections = [];
          for (var i = 0; i < State.selections.length; i++) {
            selection = State.selections[i];
            if (!selection.raster) {
              // Skip selection if it doesn't relate to a raster
              continue;
            } else {
              // OK, selection is for a raster; but is it a temporal raster?
              dataLayer = _.find(DataService.dataLayers, { uuid: selection.raster });
              if (dataLayer && dataLayer.temporal) {
                wantedSelections.push(selection);
              }
            }
          }
          return wantedSelections;
        };

        /**
         * Properties are asynchronous so watch it to set noData when added.
         */
        scope.$watch('geom.properties', function (n, o) {
          scope.geomSelections = DashboardChartService.initializeGeomEventseriesSelections(scope.geom);

          _.forEach(scope.geom.properties, function (property, uuid) {
            var selection = _.find(State.selections, function(s) {
              return s.geom === scope.geom.geometry.coordinates.toString() && s.raster === uuid;
            });
            if (selection && !selection.active
              && DashboardChartService.dbSupportedData(
                scope.geom.geometry.type,
                property
              )) {
              scope.toggleSelection(selection);
            }
          });

          // No raster data when properties is undefined or when properties is
          // empty object.
          var noRasterData = scope.geom.properties
                           ? !Object.keys(scope.geom.properties).length
                           : true;
          scope.noData = noRasterData && scope.geom.entity_name === undefined;
        }, true);

        scope.toggleSelection = DashboardChartService.toggle;

        DragService.addDraggableContainer(element.find('#drag-container'));
      },
      restrict: 'E',
      scope: {
        geom: '=',
        timeState: '=',
        header: '='
      },
      replace: true,
      templateUrl: 'omnibox/templates/db-geometry-cards.html'
    };
  }
]);
