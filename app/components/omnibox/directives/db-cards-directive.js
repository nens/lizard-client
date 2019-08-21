
angular.module('omnibox')
  .directive('dbCards', [
    'State',
    'DashboardChartService',
    'DragService',
    'gettextCatalog',
    'notie',
    'getNestedAssets',
    'TimeseriesService',
    'DBCardsService',
    'ChartCompositionService',
    '$timeout',
    'AssetService',
    'DataService',
    function (
      State,
      DashboardChartService,
      DragService,
      gettextCatalog,
      notie,
      getNestedAssets,
      TimeseriesService,
      DBCardsService,
      ChartCompositionService,
      $timeout,
      AssetService,
      DataService) {
  return {
    link: function (scope, element) {

      DragService.create();

      var emulateClick = function (clickableUuid) {
        var clickableElem = $('#clickable-' + clickableUuid);
        clickableElem.click();
      };

      scope.isNestedAsset = AssetService.isNestedAsset;

      scope.getGeomCardHeader = function (geom) {
        var M = 100000;
        var lon = Math.round(geom.geometry.coordinates[0] * M) / M;
        var lat = Math.round(geom.geometry.coordinates[1] * M) / M;
        if (geom.geometry.type === 'Point') {
          return '( ' + lat + ', ' + lon + ' )';
        } else {
          console.error("We only support (dashboard) omnibox cards for Point geometries, but encountered a geom with type: '" + geom.geometry.type + "'");
        }
      };

      /* Function that counts rasters which are relevant to the dashboard cards;
       * these rasters need to be active AND temporal, because else they don't
       * get a db card.
       */
      scope.countRasters = function (geom) {
        if (!geom.properties) {
          return 0;
        }
        var temporalRasterProps = _.filter(
          Object.values(geom.properties),
          {
            temporal: true,
            type: 'raster'
          }
        );

        var activeUuids = [];
        State.layers.forEach(function (layer) {
          if (layer.active && layer.type === 'raster') {
            activeUuids.push(layer.uuid);
          }
        });

        var activeTemporalRasterProps = _.filter(
          temporalRasterProps,
          function (prop) { return activeUuids.indexOf(prop.uuid) > -1; }
        );

        return activeTemporalRasterProps.length;
      };

      /**
       * Turn ts on and give it the order of the dropped plot. Ts could already
       * be part of a plot above or below it, if so rearrange existing plots.
       * And make sure ts gets the right order.
       *
       * @param  {DOM}    el      Dragged element.
       * @param  {DOM}    target  Plot in drop.
       */
      DragService.on('drop', function (el, target) {
        if (target === null) {
          // Dropping outside of dropzone
          return;
        }
        var order = Number(target.getAttribute('data-order'));
        if (order === undefined) return; // Dropped somewhere irrelevant.

        var key = el.getAttribute('data-uuid');

        // Hide the thing that was being dragged.
        el.parentNode.removeChild(el);

        if (ChartCompositionService.composedCharts.length === 0) {
          // Empty.
          ChartCompositionService.addChart(null, key);
        } else {
          var errorMessage = ChartCompositionService.checkDrag(key, order);

          if (errorMessage) {
            notie.alert(2, gettextCatalog.getString(errorMessage));
            return;
          }

          ChartCompositionService.dragChart(order, key);
        }

        // Update charts.
        DataService.buildDashboard();
        TimeseriesService.syncTime();
      });

      scope.mustShowGeomCard = function (geom) {
        var activeRasters = _.filter(State.layers, function (layer) {
          return layer.active && layer.type === "raster";
        });
        var activeTemporalRasterCount = 0;
        DataService.dataLayers.forEach(function (dataLayer) {
          if (dataLayer.temporal) {
            var activeTemporalraster = _.find(activeRasters, { uuid: dataLayer.uuid });
            if (activeTemporalraster) {
              activeTemporalRasterCount += 1;
            }
          }
        });
        return activeTemporalRasterCount !== 0;
      };

      scope.$on('$destroy', function () {
        DragService.destroy();
      });

    },
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/db-cards.html'
  };
}]);
