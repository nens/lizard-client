
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
     * @function _getValue
     * @summary helper function to get value property of geojson feature.
     *
     * @param {object} d - geojson feature.
     * @returns {float} value field of properties.
     */
    var _getValue = function (d) {return parseFloat(d.properties.value); };

    /**
     * @function _getTimeInterval
     * @summary helper function to get difference between timestamp_end and
     * timestamp_start
     *
     * @param {object} d - geojson feature.
     * @returns {integer} time interval in ms.
     */
    var _getTimeInterval = function (d) {
      return d.properties.timestamp_end - d.properties.timestamp_start;
    };

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
     * If data is empty returns empty array.
     *
     * @param {object[]} data - list of event geojson features.
     * @param {integer} aggWindow - aggregation window in ms.
     * @param {array} - array of objects with keys
     *   for ordinal en nominal:
     *     timestamp, category, count, mean_duration
     *
     *   for ratio and interval:
     *     timestamp, mean, min, max, 
     *
     */
    this.aggregate = function (data, aggWindow) {

      if (data.length === 0) {
        return [];
      }

      var isString = isNaN(parseFloat(data[0].properties.value)),
          nestedData = {},
          aggregatedArray = [];

      // if value is string, data is nominal or ordinal, calculate counts
      // per cateogry
      if (isString) {

        nestedData = d3.nest()
          .key(function (d) {
            return UtilService.roundTimestamp(d.properties.timestamp_start,
                                              aggWindow);
          })
          .key(function (d) {return d.properties.category; })
          .rollup(function (leaves) {
            var stats = {
              "count": leaves.length,
              "mean_duration": d3.mean(leaves, _getTimeInterval)
            };

            return stats;
          })
          .map(data, d3.map);
        
        // rewrite d3 nested map to array of flat objects
        nestedData
          .forEach(function (timestamp, value) {
            var tmpObj;
            value.forEach(function (category, value) {
              tmpObj = {"timestamp": timestamp,
                        "category": category,
                        "mean_duration": value.mean_duration,
                        "count": value.count};
              aggregatedArray.push(tmpObj);
            });
          }
        );
      } else {

        nestedData = d3.nest()
          .key(function (d) {
            return UtilService.roundTimestamp(d.properties.timestamp_start,
                                              aggWindow);
          })
          .rollup(function (leaves) {
            var stats = {
              "count": leaves.length,
              "min": d3.min(leaves, _getValue),
              "max": d3.max(leaves, _getValue),
              "mean": d3.mean(leaves, _getValue),
              "median": d3.median(leaves, _getValue),
              "sum": d3.sum(leaves, _getValue),
              "mean_duration": d3.mean(leaves, _getTimeInterval)
            };

            return stats;
          })
          .map(data, d3.map);
        
        // rewrite d3 nested map to array of flat objects
        nestedData
          .forEach(function (timestamp, value) {
            var tmpObj = {"timestamp": timestamp,
                      "mean_duration": value.mean_duration,
                      "min": value.min,
                      "max": value.max,
                      "mean": value.mean,
                      "median": value.median,
                      "sum": value.sum,
                      "count": value.count};
            aggregatedArray.push(tmpObj);
          }
        );
      }

      for (var i in aggregatedArray) {
        for (var j = 0; j < 100; j++) { 
          var jan = angular.copy(aggregatedArray[i]);
          jan.category = " dingen " + Math.random().toString();
          aggregatedArray.push(jan);
        }
      }

      return aggregatedArray;
    };

  }]);
