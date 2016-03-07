
angular.module('omnibox')
  .directive('dbCards', [ 'State', 'DataService', 'DragService',
    function (State, DataService, DragService) {
  return {
    link: function (scope, element) {

      DragService.create();

      DragService.on('drop', function (el, target, source) {
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

          ts.order = order || 0; // dashboard could be empty
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

      scope.$on('$destroy', function () {
        DragService.destroy();
      });

    },
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/db-cards.html'
  };
}]);
