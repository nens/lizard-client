
angular.module('omnibox')
  .directive('dbAssetCard', [ 'State', 'TimeseriesService', 'DragService',
    function (State, TimeseriesService, DragService) {
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


      scope.$on('$destroy', function () {
        // Remove all the selected timeseries of this asset.
        State.selected.timeseries = _.filter(State.selected.timeseries,
          function (uuid) {
            var keep = true;
            _.forEach(scope.asset.timeseries, function (ts) {
              if (ts.uuid === uuid) {
                // This selected timeseries is one of the asset that is removed.
                // cancel loop and return false to remove ts from selection.
                keep = false;
                return false;
              }
            });
            return keep;
          }
        );
      });

      scope.toggleTimeseries = function (timeseries) {
        var add = true;

        State.selected.timeseries = _.filter(State.selected.timeseries, function (ts) {
          var keep = ts !== timeseries.uuid;
          if (!keep) {
            add = false;
            timeseries.active = false;
          }
          return keep;
        });

        if (add) {
          timeseries.active = true;

          // On toggle, add seperate graph. Give order of last graph + 1.
          // NOTE: TimeseriesService.timeseries only consists of requested ts.
          // All ts that are toggled to active while fetching are put in the
          // same graph.
          var lastTs = _.maxBy(
            TimeseriesService.timeseries,
            function (ts) { return ts.order; }
          );
          timeseries.order = lastTs ? lastTs.order + 1 : 0;
          State.selected.timeseries = _.union(State.selected.timeseries, [timeseries.uuid]);
        }

      };

      DragService.addDraggableContainer(element.find('#drag-container'))
      .on('drop', function (el, target, source) {

        var order = Number(target.dataset.order);
        var uuid = el.dataset.uuid;

        var ts = _.find(scope.asset.timeseries, function (ts) { return ts.uuid === uuid; });

        ts.order = order;
        ts.active = true;

        State.selected.timeseries = _.union(State.selected.timeseries, [ts.uuid]);

        el.remove();

      });

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
