angular.module('omnibox')
.service('DBCardsService', [
  'State',
  'DataService',
  'TimeseriesService',
  function (State, DataService, TimeseriesService) {

  /**
   * Loops over all the items that can be plotted and return the count and the
   * highest order.
   *
   * @return {{count: int, order: int}}
   */
  var getActiveCountAndOrder = function () {

    var orders = [];
    var actives = 0;

    _.forEach(
      State.selections,
      function (selection) {
        if (selection.active) {
          actives++;
          orders.push(selection.order);
        }
      }
    );

    DataService.assets.forEach(function (asset) {

      _.forEach(
        asset.properties,
        function (property) {
          if (property.active) {
            actives++;
            orders.push(property.order);
          }
        }
      );

      if (asset.entity_name === 'leveecrosssection' &&
        asset.crosssection.active) {
        actives++;
        orders.push(asset.crosssection.order);
      }
    });

    DataService.geometries.forEach(function (geometry) {
      _.forEach(
        geometry.properties,
        function (property) {
          if (property.active) {
            actives++;
            orders.push(property.order);
          }
        }
      );
    });

    return {
      count: actives,
      order: _.max(orders)
    };

  };

  var removeItemFromPlot = function (item) {
    var order = item.order;
    var uuid = item.timeseries; // Timeseries have a uuid. Other plottable items do
                                // not.

    var otherItems = 0;

    if (uuid) {
      // Check if it was the last timeseries in the chart.
      otherItems += _.filter(
        State.selections,
        function (selection) {
          return selection.active && selection.timeseries !== uuid && selection.order === order;
        }
      ).length;
    }

    if (otherItems === 0) {
      State.selections.forEach(function (selection) {
        if (selection.order > order) {
          selection.order--;

          // TimeseriesService.timeseries get an order when fetched. Set
          // this when changing order of timeseries in
          // TimeseriesService.timeseries.
          var fetchedTimeseries = _.find(
            TimeseriesService.timeseries,
            function (fts) { return fts.id === selection.uuid; }
          );
          if (fetchedTimeseries) {
            fetchedTimeseries.order = selection.order;
          }

        }
      });

      DataService.assets.forEach(function (asset) {
        if (asset.entity_name === 'leveecrosssection' &&
          asset.crosssection.active && asset.crosssection.order > order) {
          asset.crosssection.order--;
        }
        _.forEach(asset.properties, function (property) {
          if (property.order > order) { property.order--; }
        });
      });

      DataService.geometries.forEach(function (geometry) {
        _.forEach(geometry.properties, function (property) {
          if (property.order > order) { property.order--; }
        });
      });

    }

  };

  return {
    getActiveCountAndOrder: getActiveCountAndOrder,
    removeItemFromPlot: removeItemFromPlot
  };

}]);
