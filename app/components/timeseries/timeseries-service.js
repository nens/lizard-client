/**
 * Service to handle timeseries retrieval.
 */
angular.module('timeseries')
  .service("TimeseriesService", ['CabinetService',
    function (CabinetService) {

    this._getTimeseries = function (id, timeState, minPoints) {
      return CabinetService.timeseries.get({
        object: id,
        min_points: minPoints,
        start: parseInt(timeState.start, 10),
        end: parseInt(timeState.end, 10)
      });
    };

    /**
     * @function
     * @memberOf timeseries.TimeseriesService
     * @description gets timeseries from service
     */
    this.getTimeSeriesForObject = function (
        objectId,
        start,
        end,
        minPoints,
        defer
      ) {

      // maximum number of timeseries events, more probably results in a
      // memory error.
      var MAX_NR_TIMESERIES_EVENTS = 25000;
      var promise = this._getTimeseries(
        objectId,
        {
          start: start,
          end: end
        },
        minPoints
      ).then(function (response) {

         // Filter out the timeseries with too little measurements. And ts
         // without parameter unit info.
        var filteredResult = [];
        angular.forEach(response.results, function (ts) {
          var msg = '';
          if (ts.events.length > 1 &&
              ts.events.length < MAX_NR_TIMESERIES_EVENTS &&
              ts.parameter_referenced_unit) {
            filteredResult.push(ts);

          // Else: output a message to the console and an error to sentry.
          } else if (ts.events.length > MAX_NR_TIMESERIES_EVENTS) {
            msg = 'Timeseries: '
              + ts.uuid
              + ' has: '
              + ts.events.length
              + ' events, while '
              + MAX_NR_TIMESERIES_EVENTS
              + ' is the maximum supported amount';
            window.Raven.captureException(new Error(msg));
            console.info(msg);
          } else if (!ts.parameter_referenced_unit) {
            msg = 'Timeseries: '
              + ts.uuid
              + ' has no valid parameter_referenced_unit';
            window.Raven.captureException(new Error(msg));
            console.info(msg);
          }
        });

        // Legacy dataservice calls this function with a defer which is not used
        // by the timeseries directive.
        if (defer) {
          defer.notify({
            data: filteredResult,
            layerGroupSlug: 'timeseries',
            layerSlug: 'timeseries',
          });
        }
        return response; // accomadate chaining.
      });

      return promise;
    };

  }

]);

