
angular.module('omnibox')
  .directive('dbCards', [ 'State', 'DataService', 'DragService', 'gettextCatalog', 'notie', 'TimeseriesService',
    function (State, DataService, DragService, gettextCatalog, notie, TimeseriesService) {
  return {
    link: function (scope, element) {

      DragService.create();

      var emulateClick = function (el) {
        // other plottable item. Toggle on drag to put element in their own
        // plot.
        element.find('#' + el.dataset.uuid).click();
      };

      var getTsMetaData = function (uuid) {
        var tsMetaData;
        _.forEach(DataService.assets, function (asset) {
          tsMetaData = _.find(asset.timeseries, function (ts) {
            return ts.uuid === uuid;
          });
          return !tsMetaData;
        });
        return tsMetaData;
      };

      DragService.on('drop', function (el, target, source) {
        var order = Number(target.getAttribute('data-order'));
        var uuid = el.dataset.uuid;

        // El either represents a timeseries or another plottable item.
        //
        // NOTE: there is only one drop callback for all the possible assets. So
        // instead of searching for the ts in scope.asset.timeseries, all the
        // assets are searched.
        // timeseries
        var ts, otherGraphTS, otherCompatibleGraph;

        ts = _.find(State.selected.timeseries, function (ts) {
          return ts.uuid === uuid;
        });

        otherGraphTS = _.find(State.selected.timeseries, function (ts) {
          return ts.order === order && ts.active;
        });

        if (otherGraphTS === undefined) {
          emulateClick(el);
        }

        else {
          var tsMetaData = getTsMetaData(ts.uuid);
          var otherGraphTsMetaData = getTsMetaData(otherGraphTS.uuid);
          if (tsMetaData.value_type !== otherGraphTsMetaData.value_type) {
            notie.alert(2,
              gettextCatalog.getString('Whoops, the graphs are not the same type. Try again!'));
            emulateClick(el);
          } else {
            ts.order = order || 0; // dashboard could be empty
            ts.active = true;
            TimeseriesService.syncTime();
          }
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
