angular.module('omnibox')
.service('DBCardsService', [
  'DataService',
  'TimeseriesService',
  function (DataService, TimeseriesService) {

  /**
   * Loops over all the items that can be plotted and return the count and the
   * highest order.
   *
   * @return {{count: int, order: int}}
   */
  var getActiveCountAndOrder = function () {

    var orders = [];
    var actives = 0;

    DataService.assets.forEach(function (asset) {
      var lowestTS = _.maxBy(
        asset.timeseries,
        function (ts) {
          if (ts.active) { actives++; }
          return ts.active && ts.order; }
      );
      if (lowestTS) { orders.push(lowestTS.order); }

      _.forEach(
        asset.properties,
        function (property) {
          if (property.active) {
            actives++;
            orders.push(property.order);
          }
        }
      );
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
    var uuid = item.uuid; // Timeseries have a uuid. Other plottable items do
                          // not.

    var otherItems = 0;

    if (item.uuid) {

      DataService.assets.forEach(function (asset) {
        otherItems += _.filter(
          asset.timeseries,
          function (ts) {
            return ts.active && ts.uuid !== uuid && ts.order === order;
          }
        ).length;
      });

    }

    if (otherItems === 0) {

      DataService.assets.forEach(function (asset) {
        if (asset.timeseries) {
          asset.timeseries.forEach(function (ts) {
            if (ts.order > order) {
              ts.order--;

              // TimeseriesService.timeseries get an order when fetched. Set
              // this when changing order of timeseries in
              // TimeseriesService.timeseries.
              var fetchedTimeseries = _.find(
                TimeseriesService.timeseries,
                function (fts) { return fts.id === ts.uuid; }
              );
              if (fetchedTimeseries) {
                fetchedTimeseries.order = ts.order;
              }

            }
          });
        }
      });

      DataService.assets.forEach(function (asset) {
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
