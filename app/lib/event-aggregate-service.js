
/**
 * @ngdoc service
 * @class EventAggregateService
 * @name EventAggregateService
 * @summary Event aggregation functions.
 * @description Functions to aggregate event series over time with d3
 */
angular.module('lizard-nxt')
  .service("EventAggregateService", ["UtilService", function (UtilService) {

    this.colorMap = {};

    this.colorScale = {};

    var that = this;

    /**
     * @function timeCatComparator
     * @summary comparator function to use for javascript array sort.
     *
     * @description Sorts arrays of object on properties timestamp and category
     */
    var timeCatComparator = d3.comparator()
      .order(d3.ascending, function (d) { return d.timestamp; })
      .order(d3.ascending, function (d) { return d.category; });

    /**
     * @function _buildColorScale
     * @summary TODO
     * @description TODO
     *
     * @param {string} baseColor - hex color.
     * @returns {array[]} list of hex colors.
     */
    this._buildColorScale = function (baseColor) {

      var MAXCATS = 7;

      var colorScale = ['#00F', '#DDD', '#0F0'];

      return colorScale;
    };

    /**
     * @function _getColor
     * @summary helper function to get color for category
     *
     * @param {string} category - Category name.
     * @param {string} baseColor - hex color.
     * @returns {string} HTML HEX color code.
     */
    var _getColor = function (category, baseColor) {

      if (!that.colorScale.hasOwnProperty(baseColor)) {
        that.colorScale[baseColor] = that._buildColorScale(baseColor);
      }

      if (!that.colorMap.hasOwnProperty(category)) {
        var numCategories = Object.keys(that.colorMap).length;
        that.colorMap[category] = that.colorScale[baseColor][numCategories - 1];
      }

      return that.colorMap[category];
    };

    /**
     * @function _getValue
     * @summary helper function to get value property of geojson feature.
     *
     * @param {object} d - geojson feature.
     * @returns {float} value field of properties.
     */
    var _getValue = function (d) {return parseFloat(d.properties.value); };

    /**
     * @function _getTimeIntervalDats
     * @summary helper function to get difference between timestamp_end and
     * timestamp_start
     *
     * @param {object} d - geojson feature.
     * @returns {integer} time interval in days.
     */
    var _getTimeIntervalDays = function (d) {
      return (d.properties.timestamp_end - d.properties.timestamp_start) /
              1000 / 60 / 60 / 24;
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
     * @param {string} baseColor - hex color.
     * @returns {array} - array of objects with keys
     *   for ordinal en nominal:
     *     timestamp, category, count, mean_duration
     *
     *   for ratio and interval:
     *     timestamp, mean, min, max, 
     *
     */
    this.aggregate = function (data, aggWindow, baseColor) {

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
              "mean_duration": d3.mean(leaves, _getTimeIntervalDays)
            };

            return stats;
          })
          .map(data, d3.map);
        
        // rewrite d3 nested map to array of flat objects
        nestedData
          .forEach(function (timestamp, value) {
            var tmpObj;
            value.forEach(function (category, value) {
              tmpObj = {timestamp: timestamp,
                        category: category,
                        mean_duration: value.mean_duration,
                        color: _getColor(category, baseColor),
                        count: value.count};
              aggregatedArray.push(tmpObj);
            });
          }
        );

        // sort array by timestamp and category
        aggregatedArray.sort(timeCatComparator);
      } else {

        nestedData = d3.nest()
          .key(function (d) {
            return UtilService.roundTimestamp(d.properties.timestamp_start,
                                              aggWindow);
          })
          .rollup(function (leaves) {
            var stats = {
              count: leaves.length,
              min: d3.min(leaves, _getValue),
              max: d3.max(leaves, _getValue),
              mean: d3.mean(leaves, _getValue),
              median: d3.median(leaves, _getValue),
              sum: d3.sum(leaves, _getValue),
              mean_duration: d3.mean(leaves, _getTimeIntervalDays),
            };

            return stats;
          })
          .map(data, d3.map);
        
        // rewrite d3 nested map to array of flat objects
        nestedData
          .forEach(function (timestamp, value) {
            var tmpObj = {
              color: baseColor,
              timestamp: timestamp,
              mean_duration: value.mean_duration,
              min: value.min,
              max: value.max,
              mean: value.mean,
              median: value.median,
              sum: value.sum,
              count: value.count
            };
            aggregatedArray.push(tmpObj);
          }
        );
      }

      return aggregatedArray;
    };

  }]);
