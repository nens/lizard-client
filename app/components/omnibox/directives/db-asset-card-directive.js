
angular.module('omnibox')
  .directive('dbAssetCard', [ 'State', 'DataService', 'DragService', 'DBCardsService',
    function (State, DataService, DragService, DBCardsService) {
  return {
    link: function (scope, element) {

      scope.noTimeseries = true;

      /**
       * Timeseries are asynchronous so add them to selection when added.
       */
      var watchTimeseries = scope.$watch('asset.timeseries', function (n, o) {
        if (n) {

          scope.asset.timeseries.forEach(function (ts) {
            if (State.selected.timeseries.indexOf(ts.uuid) !== -1) {
              ts.active = true;
            } else {
              ts.active = false;
            }
            scope.noTimeseries = false;
          });

          watchTimeseries(); // rm watch

        }
      });

      scope.toggleTimeseries = function (timeseries) {
        var add = true;

        State.selected.timeseries = _.filter(State.selected.timeseries, function (ts) {
          var keep = ts !== timeseries.uuid;
          if (!keep) {
            add = false;
          }
          return keep;
        });

        if (add) {

          var plots = DBCardsService.getActiveCountAndOrder();

          timeseries.order = plots.count > 0
            ? plots.order + 1
            : 0;

          timeseries.active = true;

          State.selected.timeseries = _.union(State.selected.timeseries, [timeseries.uuid]);
        }

        else {

          DBCardsService.removeItemFromPlot(timeseries);
          timeseries.active = false;

        }

      };

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
        scope.asset.monitoring_wells.forEach(function (well) {
          scope.asset.timeseries = _.concat(scope.asset.timeseries, well.timeseries);
        });
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
      timeState: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/db-asset-card.html'
  };
}]);
