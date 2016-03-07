
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
