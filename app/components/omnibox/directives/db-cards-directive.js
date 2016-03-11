
angular.module('omnibox')
  .directive('dbCards', [ 'State', 'DataService', 'DragService', 'gettextCatalog', 'notie',
    function (State, DataService, DragService, gettextCatalog, notie) {
  return {
    link: function (scope, element) {

      DragService.create();

      var emulateClick = function (el) {
        // other plottable item. Toggle on drag to put element in their own
        // plot.
        DragService.destroy();
        console.log('cllick the moferf4fck');
        el.dispatchEvent(new MouseEvent("click", {
          "view": window,
          "bubbles": true,
          "cancelable": false
        }));
      };

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
          var ts, otherGraphTS, otherCompatibleGraph;

          _.forEach(DataService.assets, function (asset) {
            ts = _.find(asset.timeseries, function (ts) {
              return ts.uuid === uuid;
            });
            return ts === undefined; // if true: continue
          });


          _.forEach(DataService.assets, function (asset) {
            otherGraphTS = _.find(asset.timeseries, function (ts) {
              return ts.order === order && ts.active;
            });

            otherCompatibleGraph = _.find(asset.timeseries, function (ts) {
              return ts.value_type === ts.value_type;
            });

            return otherGraphTS === undefined; // if true: continue
          });

          if (ts.value_type !== otherGraphTS.value_type && otherGraphTS !== undefined) {
            notie.alert(2,
              gettextCatalog.getString('Whoops, the graphs are not the same type. Try again, or click!'));
            // emulateClick(el);
          } else if (otherGraphTS === undefined) {
            ts.order = order || 0; // dashboard could be empty
            ts.active = true;
            State.selected.timeseries = _.union(
              State.selected.timeseries,
              [ts.uuid]
            );
          }
        }
        else {
          // i'm fairly certain this never gets called, and nothing is ever done
          // when it does actually happen.
          emulateClick(el);
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
