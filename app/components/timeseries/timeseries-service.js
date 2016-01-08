/**
 * Service to handle timeseries retrieval.
 */
angular.module('timeseries')
  .service("TimeseriesService", ['CabinetService', '$q',
    function (CabinetService, $q) {

    var localPromises = {};

    this._getTimeseries = function (id, timeState, minPoints, aggWindow) {
      // Cancel consecutive calls for the same ts.
      if (localPromises[id]) {
        localPromises[id].resolve();
      }
      localPromises[id] = $q.defer();
      var params = {
        object: id,
        start: timeState.start ? parseInt(timeState.start, 10): undefined,
        end: timeState.end ? parseInt(timeState.end, 10): undefined,
        timeout: localPromises[id].promise
      };

      minPoints ? params.min_points = minPoints : params.window = aggWindow;

      return CabinetService.timeseries.get(params);
    };

    /**
     * @function
     * @memberOf timeseries.TimeseriesService
     * @description gets timeseries from service
     *
     * @param {str} objectID asset identifyer. <entityname>$<id>
     * @param {int} start get timeserie data from in epoch ms
     * @param {int} end get timeserie data till in epoch ms
     * @param {int} minPoints mutual exlcusive with aggWindow, for lines, ask
     *                        for minimally the graphs width amount of pixels.
     * @param {int} aggWindow mutual exclusive with minPoints, for barcharts,
     *                        as for timestate.aggWindow so timeseries are
     *                        aggregated to a sensible size.
     *
     */
    this.getTimeSeriesForObject = function (
        objectId,
        start,
        end,
        minPoints,
        aggWindow,
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
        minPoints,
        aggWindow
      ).then(function (response) {

         // Filter out the timeseries with too little measurements. And ts
         // without parameter unit info.
        var filteredResult = [];
        angular.forEach(response.results, function (ts) {
          var msg = '';
          if (ts.events === null) {
            filteredResult.push(ts);
          } else if (ts.events.length > 1 &&
              ts.events.length < MAX_NR_TIMESERIES_EVENTS) {

            if (ts.parameter_referenced_unit === null) {
              ts.parameter_referenced_unit = {};
            }

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
        //
        // TODO: when we refactored the dashboard/time-ctx we can strip
        // timeseries from the data-service and remove this.
        if (defer) {
          defer.notify({
            data: filteredResult,
            layerGroupSlug: 'timeseries',
            layerSlug: 'timeseries',
          });
        }

        response.results = filteredResult;
        return response; // accomadate chaining.
      });

      return promise;
    };

  }

]);

