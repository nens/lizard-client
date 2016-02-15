
angular.module('omnibox')
  .directive('dbAssetCard', [ 'State',
    function (State) {
  return {
    link: function (scope) {

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
          State.selected.timeseries = _.union(State.selected.timeseries, [timeseries.uuid]);
        }

      };

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
