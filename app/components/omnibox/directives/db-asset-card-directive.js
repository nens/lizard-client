
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

      DragService.addDraggableContainer(element.find('#drag-container'))
      .on('drop', function (el, target, source) {

        var order = Number(target.dataset.order);
        var uuid = el.dataset.uuid;

        // El either represents a timeseries or another plottable item.
        //
        // NOTE: there is only one drop callbakc for all the possible assets. So
        // instead of searching for the ts in scope.asset.timeseries, all the
        // assets are searched.
        if (uuid) {
          // timeseries
          var ts;

          _.forEach(DataService.assets, function (asset) {
            ts = _.find(asset.timeseries, function (ts) {
              return ts.uuid === uuid;
            });
            return ts === undefined; // if true: continue
          });

          ts.order = order; // dashboard could be empty
          ts.active = true;
          State.selected.timeseries = _.union(
            State.selected.timeseries,
            [ts.uuid]
          );
        }
        else {
          // other plottable item. Toggle on drag to put element in their own
          // plot.
          el.dispatchEvent(new MouseEvent("click", {
            "view": window,
            "bubbles": true,
            "cancelable": false
          }));
        }

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
