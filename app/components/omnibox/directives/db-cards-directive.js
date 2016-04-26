
angular.module('omnibox')
  .directive('dbCards', [ 'State', 'DataService', 'DragService', 'gettextCatalog', 'notie', 'TimeseriesService', 'DBCardsService',
    function (State, DataService, DragService, gettextCatalog, notie, TimeseriesService, DBCardsService) {
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

      /**
       * Turn ts on and give it the order of the dropped plot. Ts could already
       * be part of a plot above or below it, if so rearrange existing plots.
       * And make sure ts gets the right order.
       *
       * @param  {DOM}    el      Dragged element.
       * @param  {DOM}    target  Plot in drop.
       */
      DragService.on('drop', function (el, target) {
        var order = Number(target.getAttribute('data-order'));
        var uuid = el.getAttribute('data-uuid');

        // El either represents a timeseries or another plottable item.
        //
        // NOTE: there is only one drop callback for all the possible assets. So
        // instead of searching for the ts in scope.asset.timeseries, all the
        // assets are searched.
        // timeseries
        var ts, otherGraphTS, otherCompatibleGraph;

        // timeseries representend by el.
        ts = _.find(State.selected.timeseries, function (ts) {
          return ts.uuid === uuid;
        });

        // Possible other graph in target.
        otherGraphTS = _.find(State.selected.timeseries, function (ts) {
          return ts.order === order && ts.active;
        });

        if (otherGraphTS === undefined) {
          // No other graph, just turn ts to active.
          emulateClick(el);
          el.remove();
          return;
        }

        // If ts was already active: first remove and rearrange plots in
        // dashboard, then continue adding it to the dragged plot.
        if (ts.active) {
          var otherTSInOrigninalPlot = _.find(
            State.selected.timeseries,
            function (_ts) {
              return _ts.active
                && _ts.order === ts.order
                && _ts.uuid !== ts.uuid;
            }
          );
          if (otherTSInOrigninalPlot === undefined) {
            // Plot where ts came from is now empty and removed.
            order = order < ts.order ? order : order - 1;
          }

          ts.active = false;
          DBCardsService.removeItemFromPlot(ts);
        }

        var tsMetaData = getTsMetaData(ts.uuid);
        var otherGraphTsMetaData = getTsMetaData(otherGraphTS.uuid);
        if (tsMetaData.value_type !== otherGraphTsMetaData.value_type) {
          notie.alert(2,
            gettextCatalog.getString('Whoops, the graphs are not the same type. Try again!'));
          emulateClick(el);
        } else {
          // Set new order and tell TimeSeriesService to get data.
          ts.order = order || 0; // dashboard could be empty
          ts.active = true;
          TimeseriesService.syncTime();
        }

        // Remove drag element.
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
