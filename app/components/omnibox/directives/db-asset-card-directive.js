
angular.module('omnibox')
  .directive('dbAssetCard', [ 'State', 'DataService', 'DragService', 'DBCardsService', 'TimeseriesService',
    function (State, DataService, DragService, DBCardsService, TimeseriesService) {
  return {
    link: function (scope, element) {

      scope.selected = State.selected;

      scope.getTsMetaData = function (uuid) {
        return _.find(scope.asset.timeseries, function (ts) {
          return ts.uuid === uuid;
        });
      };

      scope.toggleTimeseries = function (timeseries) {

        if (!timeseries.active) {

          var plots = DBCardsService.getActiveCountAndOrder();

          timeseries.order = plots.count > 0
            ? plots.order + 1
            : 0;

        }

        else {

          DBCardsService.removeItemFromPlot(timeseries);

        }

        timeseries.active = !timeseries.active;
        TimeseriesService.syncTime();

      };

      scope.noTimeseries = scope.asset.timeseries.length === 0;

      /**
       * Render all timeseries for selected asset when switching to dashboard
       * view (screen no longer shows up blank..)
       */
      if (!scope.noTimeseries) {
        TimeseriesService.initializeTimeseriesOfAsset(scope.asset);
        _.forEach(State.selected.timeseries, function (ts) {
          // de volgordes zijn niet altijd hetzelfde, dus uuid maakt het 100% certain
          var assetTS = _.find(scope.asset.timeseries, {uuid: ts.uuid});
          TimeseriesService.timeseries.push(assetTS);
          scope.toggleTimeseries(ts);
        });
      }

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
