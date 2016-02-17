
angular.module('omnibox')
  .directive('dbAssetCard', [ 'State', 'DataService', 'DragService',
    function (State, DataService, DragService) {
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

          // On toggle, add seperate graph. Give order of highest order + 1.
          var orders = [];
          DataService.assets.forEach(function (asset) {
            orders.push(_.maxBy(
              asset.timeseries,
              function (ts) { return ts.active && ts.order; }
            ).order);
          });

          DataService.geometries.forEach(function (geometry) {
            orders.push(_.maxBy(
              geometry.properties,
              function (property) { return property.active && property.order; }
            ).order);
          });

          timeseries.order = State.selected.timeseries.length > 0
            ? _.max(orders) + 1
            : 0;

          timeseries.active = true;

          State.selected.timeseries = _.union(State.selected.timeseries, [timeseries.uuid]);
        }

        else {
          // On remove, check whether it was alone in a graph and lower all
          // following graph orders.
          var order = timeseries.order;
          var uuid = timeseries.uuid;
          var otherTS = 0;

          DataService.assets.forEach(function (asset) {
            otherTS += _.filter(
              asset.timeseries,
              function (ts) {
                return ts.active && ts.uuid !== uuid && ts.order === order;
              }
            ).length;
          });

          if (otherTS === 0) {
            DataService.assets.forEach(function (asset) {
              asset.timeseries.forEach(function (ts) {
                if (ts.order > order) { ts.order--; }
              });
            });
          }

          timeseries.active = false;

        }

      };

      DragService.addDraggableContainer(element.find('#drag-container'))
      .on('drop', function (el, target, source) {

        var order = Number(target.dataset.order);
        var uuid = el.dataset.uuid;

        var ts = _.find(scope.asset.timeseries, function (ts) { return ts.uuid === uuid; });

        ts.order = order || 0; // dashboard could be empty
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
