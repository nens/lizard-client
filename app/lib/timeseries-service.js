/**
 * Service to handle timeseries retrieval.
 */
angular.module('lizard-nxt')
  .service("TimeseriesService", ['CabinetService',
    function (CabinetService) {
    var getTimeseries = function (id, timeState, minPoints) {
      return CabinetService.timeseries.get({
        object: id,
        min_points: minPoints,
        start: parseInt(timeState.start, 10),
        end: parseInt(timeState.end, 10)
      });
    };

    return {
      getTimeseries: getTimeseries
    };
  }

]);

