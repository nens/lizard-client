
/**
 * @ngdoc service
 * @class EventAggregateService
 * @name EventAggregateService
 * @summary Event aggregation functions.
 * @description Functions to aggregate event series over time with d3
 */
angular.module('lizard-nxt')
  .service("EventAggregateService", ["UtilService", function (UtilService) {

    /**
     * @function aggregate
     * @memberOf EventAggregateService
     * @summary Aggregates list of geojson features by category.
     *
     * @description Uses d3.nest() to aggregate lists of geojson events by
     * interval and category, additionaly returns average duration of events
     * when timestamp_start and timestamp_end are set.
     *
     * When the `value` property of a feature is a `float` or `int`, additional
     * statistics are calculated: min, max, sum, mean,
     *
     * @param {object[]} data - list of event geojson features.
     * @param {integer} aggWindow - aggregation window in ms.
     */
    this.aggregate = function (data, aggWindow) {
      var nestedData = d3.nest()
        .key(function (d) {
          return UtilService.roundTimestamp(d.properties.timestamp_start,
                                            aggWindow);
        })
        .key(function (d) {return d.properties.category; })
        .rollup(function (leaves) {
          var stats = {
            "count": leaves.length,
            "mean_duration": d3.mean(leaves, function (d) {
              return d.properties.timestamp_end - d.properties.timestamp_start;
            })
          };

          var isFloatOrInt = parseFloat(data[0].properties.value);
          console.log(isFloatOrInt);

          if (isFloatOrInt) {
            console.log(isFloatOrInt);
          }

          return stats;
        })
        .map(data);

      console.log(nestedData);

      return nestedData;
    };

  }]);
