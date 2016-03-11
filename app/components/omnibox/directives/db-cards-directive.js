
angular.module('omnibox')
  .directive('dbCards', [ 'State', 'DataService', 'DragService', 'gettextCatalog', 'notie',
    function (State, DataService, DragService, gettextCatalog, notie) {
  return {
    link: function (scope, element) {

      DragService.create();

      var emulateClick = function (el) {
        // other plottable item. Toggle on drag to put element in their own
        // plot.
        element.find('#' + el.dataset.uuid).click();
      };

      DragService.on('drop', function (el, target, source) {
        var order = Number(target.dataset.order);
        var uuid = el.dataset.uuid;

        // El either represents a timeseries or another plottable item.
        //
        // NOTE: there is only one drop callbakc for all the possible assets. So
        // instead of searching for the ts in scope.asset.timeseries, all the
        // assets are searched.
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

          return otherGraphTS === undefined; // if true: continue
        });

        if (otherGraphTS === undefined) {
          emulateClick(el);
        }

        else if (ts.value_type !== otherGraphTS.value_type) {
          notie.alert(2,
            gettextCatalog.getString('Whoops, the graphs are not the same type. Try again!'));
          emulateClick(el);
        } else {
          ts.order = order || 0; // dashboard could be empty
          ts.active = true;
          State.selected.timeseries = _.union(
            State.selected.timeseries,
            [ts.uuid]
          );
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
