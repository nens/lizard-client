/**
 * Service to handle timeseries retrieval.
 */
angular.module('lizard-nxt')
  .service("TimeseriesService", ['CabinetService',
    function (CabinetService) {
    var getTimeseries = function (id, timeState) {
      return CabinetService.timeseries.get({
        object: id,
        start: timeState.start,
        end: timeState.end
      });
    };

    return {
      getTimeseries: getTimeseries
    };

  }

]);

