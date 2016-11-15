
angular.module('omnibox')
  .directive('dbAssetCard', [ 'State', 'DataService', 'DragService', 'DBCardsService', 'TimeseriesService',
    function (State, DataService, DragService, DBCardsService, TimeseriesService) {
  return {
    link: function (scope, element) {

      var dbSupportedData = function (property) {  // TODO: double with geometrycards
        var type = scope.asset.geometry.type;
        var temporal = property.temporal && type === 'Point';

        var events = property.format === 'Vector' && type !== 'LineString';

        var other = type !== 'Point'
          && property.scale !== 'nominal'
          && property.scale !== 'ordinal';

        return temporal || events || other;
      };

      scope.state = State;
      var _getTimeseriesMetaData = function (selection) {
        var assetTs = _.find(scope.asset.timeseries, function (ts) {
          return ts.uuid === selection.timeseries;
        });
        if (assetTs === undefined) {
          assetTs = { match: false }
        } else {
          assetTs.match = true
        }
        assetTs.type = 'timeseries';
        return assetTs;
      };
      var _getRasterMetaData = function (selection) {
        var assetRaster = _.find(DataService.assets, function (asset) {
          return asset.entity_name + "$" + asset.id === selection.asset;
        });
        var props = { match: false };
        if (assetRaster !== undefined) {
          var assetProps = assetRaster.properties[selection.raster];
          if (assetProps) {
            props = assetProps;
            var assetCode = scope.asset.entity_name + "$" + scope.asset.id;  // TODO: this is used in many places
            props.match = selection.asset === assetCode && dbSupportedData(assetProps);
          }
        }
        return props;
      };
      scope.getSelectionMetaData = function (selection) {
        if (selection.timeseries) {
          return _getTimeseriesMetaData(selection);
        } else if (selection.raster) {
          return _getRasterMetaData(selection);
        }
      };

      scope.toggleSelection = function (selection) {

        if (!selection.active) {

          var plots = DBCardsService.getActiveCountAndOrder();

          selection.order = plots.count > 0
            ? plots.order + 1
            : 0;

        }

        else {

          DBCardsService.removeItemFromPlot(selection);

        }

        selection.active = !selection.active;
        TimeseriesService.syncTime();

      };

      scope.noTimeseries = scope.asset.timeseries.length === 0;

      /**
       * Specific toggle for crosssection
       *
       * @param  {object} asset with entity_name crossection and a crossection
       *                        model.
       */
      scope.toggleCrosssection = function (asset) {

        if (!asset.crosssection.active) {
          var plots = DBCardsService.getActiveCountAndOrder();

          asset.crosssection.order = plots.count > 0
            ? plots.order + 1
            : 0;

          asset.crosssection.active = true;

        } else {
          DBCardsService.removeItemFromPlot(asset.crosssection);
          asset.crosssection.active = false;
        }

        if (DataService.onGeometriesChange) {
          DataService.onGeometriesChange();
        }
      };

      // Init crosssection
      if (scope.asset.entity_name === 'leveecrosssection') {
        scope.asset.crosssection = {
          active: false, // set to true by  toggle
          order: 0
        };
        scope.toggleCrosssection(scope.asset);
      }

      DragService.addDraggableContainer(element.find('#drag-container'));

    },
    restrict: 'E',
    scope: {
      asset: '=',
      timeState: '=',
      assets: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/db-asset-card.html'
  };
}]);
