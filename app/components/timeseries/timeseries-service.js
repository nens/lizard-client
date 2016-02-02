/**
 * Service to handle timeseries retrieval.
 */
angular.module('timeseries')
  .service("TimeseriesService", ['$q', 'State', '$http', 'notie',
    function ($q, State, $http, notie) {

    var GRAPH_WIDTH = 320; // Width of drawing area of box graphs.

    // Contains timeseries metadata and data as comes from api. It mirrors
    // State.seletected.timeseries.
    this.timeseries = [];

    this.minPoints = GRAPH_WIDTH; // default

    var service = this;

    var _timeseries = [];
    Object.defineProperty(State.selected, 'timeseries', {
      get: function () { return _timeseries; },
      set: function (timeseries) {
        if (timeseries.length) {
          service.syncTime(timeseries);
          _timeseries = timeseries;
        }
        else { _timeseries = []; }
      }
    });

    this.syncTime = function (timeseries) {
      this._getTimeseries(timeseries || State.selected.timeseries, State.temporal, service.minPoints)
      .then(function (ts) {
        service.timeseries = ts;
        console.log('TimeseriesService.timeseries:', service.timeseries);
      });
    };

    var localPromises = {};


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
    this._getTimeseries = function (uuids, timeState, minPoints) {
      // Cancel consecutive calls for the same ts.
      var id = uuids.join(',');
      if (localPromises[id]) {
        localPromises[id].reject('consecutive');
      }
      localPromises[id] = $q.defer();
      var params = {
        uuid: id,
        start: timeState.start ? parseInt(timeState.start, 10): undefined,
        end: timeState.end ? parseInt(timeState.end, 10): undefined,
      };

      minPoints ? params.min_points = minPoints : params.window = timeState.aggWindow;

      return $http({
        url: 'api/v2/timeseries/',
        method: 'GET',
        params: params
      })

      .then(function (response) { return response.data; }, errorFn)
      .then(filterTimeseries, null)
      .then(formatTimeseriesForGraph, null);
    };

    var errorFn = function (err) {
      if (err.status === 420) {
        notie.confirm(
          'Lizard is crunching on your timeseries data and can not keep up.',
          'Ok, sorry.',
          'Hurry!',
          function () {
            notie.alert(4, 'No worries!', 1);

            // Refetch data
            service.syncTime();
          });

        // Cancel normal operations
        return $q.reject(err);
      } else if (err.status >= 500 && err.status < 600) {
        notie.alert(3, 'Lizard is temporarily broken, we will be back!', 3);
        // Cancel normal operations
        return $q.reject(err);
      }
      return err; // continue anyway
    };

    this.getTimeSeriesForAsset = function (asset) {
      // Get ts if asset has ts at the back but not yet at the front.
      if (asset.num_timeseries && asset.timeseries === undefined) {
        return $http({
          url: 'api/v2/timeseries/',
          method: 'GET',
          params: { object: asset.entity_name + '$' + asset.id }
        })

        .then(function (response) {
          if (response.data.results.length) {
            asset.timeseries = response.data.results;
          }
          return asset;
        });
      }

      else {
        var defer = $q.defer();
        defer.resolve(asset);
        return defer.promise;
      }

    };

    var formatTimeseriesForGraph = function (ts) {

      var graphTimeseries = {
        data: [],
        labels: {
          x: '',
          y: ''
        },
        keys: { x: 'timestamp', y: { y0: 'min', y1: 'max' } }
      };

      var result = [];
      ts.forEach(function (ts) {
        graphTimeseries.data = ts.events;
        result.push(graphTimeseries);
      });
      return result;

    };

    var filterTimeseries = function (response) {

      // maximum number of timeseries events, more probably results in a
      // memory error.
      var MAX_NR_TIMESERIES_EVENTS = 25000;

      var filteredResult = [];

      angular.forEach(response.results, function (ts) {
        var msg = '';
        if (ts.events === null) {
          filteredResult.push(ts);
        } else if (ts.events.length < MAX_NR_TIMESERIES_EVENTS) {

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

      return filteredResult;
    };

  }

]);
