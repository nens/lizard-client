/**
 * Service to handle timeseries retrieval.
 */
angular.module('timeseries')
.service("TimeseriesService", [
  '$q',
  'State',
  '$http',
  'notie',
  'UtilService',
  'DataService',
  'WantedAttributes',
  function ($q, State, $http, notie, UtilService, DataService, WantedAttributes) {

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
        console.log('State.selected.timeseries:', timeseries);
        _timeseries = timeseries;
        service.syncTime(timeseries);
      },
      enumerable: true
    });

    this.syncTime = function (timeseries) {
      var promise = {};

      var actives = State.selected.timeseries.map(function (ts) {
        return ts.active && ts.uuid;
      });

      // Return empty timeseries when empty selection
      if (actives.length === 0) {
        var defer = $q.defer();
        defer.resolve([]);
        promise = defer.promise;
      }

      else {
        promise = this._getTimeseries(
          actives,
          State.temporal,
          service.minPoints
        );
      }

      promise.then(function (ts) {
        service.timeseries = ts;
        console.log('TimeseriesService.timeseries:', service.timeseries);
      })


      .then(function (results) {
        // Called asynchronously, so check if timeseries is still in state and
        // active.
        return _.filter(
          results,
          function (ts) { return _.some(
            State.selected.timeseries,
            function (stateTs) {
              return ts.uuid === stateTs.uuid && stateTs.active;
            });
          });

      })

      .then(function (ts) {

        if (service.onTimeseriesChange) {
          service.onTimeseriesChange();
        }
        // accomadate chaining;
        return ts;

      });
      return promise;
    };

    var localPromise = {};

    /**
     * Color is stored with the ts metadata in asset.timeseries of every asset
     * in DataService.assets. This function searches in the selected timeseries
     * in timeseriesService.timeseries to update the color.
     *
     * @param  {object} changedTS timeseries metadata object
     */
    this.onColorChange = function (changedTS) {
      var ts = _.find(service.timeseries, function (o) {
        return o.id === changedTS.uuid;
      });
      if (ts) {
        ts.color = changedTS.color;
        service.onTimeseriesChange();
      }
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
    this._getTimeseries = function (uuids, timeState, minPoints) {
      // Cancel consecutive calls.
      if (localPromise.reject) {
        localPromise.resolve({data: {results: []}});
      }

      localPromise = $q.defer();

      var id = uuids.join(',');
      var params = {
        uuid: id,
        start: timeState.start ? parseInt(timeState.start, 10): undefined,
        end: timeState.end ? parseInt(timeState.end, 10): undefined,
      };

      if (minPoints) {
        params.min_points = minPoints;
      } else {
        params.window = timeState.aggWindow;
      }

      return $http({
        url: 'api/v2/timeseries/',
        method: 'GET',
        params: params,
        timeout: localPromise.promise
      })

      .then(function (response) {
        return response.data.results;
      }, errorFn)

      .then(filterTimeseries, errorFn)
      .then(formatTimeseriesForGraph, null);
    };

    var errorFn = function (err) {
      if (err.status === 420 || err.status === -1) {
        // Cancel normal operations
        return $q.reject(err);
      }
      else if (err.status >= 500 && err.status < 600) {
        notie.alert(3, 'Lizard encountered a problem retrieving your timeseries.', 3);
        // Cancel normal operations
        return $q.reject(err);
      }
      window.Raven.captureException(err);
      return err; // continue anyway
    };

    this.initializeTimeseriesOfAsset = function (asset) {
      var colors = UtilService.GRAPH_COLORS;
      State.selected.timeseries = _.unionBy(
        State.selected.timeseries,
        asset.timeseries.map(function (ts, i) {
          return {
            uuid: ts.uuid,
            active: false,
            order: 0,
            color: colors[i % (colors.length - 1)]
          };
        }),
        'uuid'
      );
      return asset;
    };

    /**
     * Looks up timeseries in State.selected.timeseries and copies color and order.
     * TimeseriesService.timeseries are not persistent when toggled.
     * asset.timeseries is persistent till a user removes it from selection.
     *
     * @param {object} graphTimeseries timeseriesSerivce.timeseries timeseries
     *                                 object.
     */
    var addColorAndOrderAndUnitAndTresholds = function (graphTimeseries) {
      var EMPTY = '...';
      var ts; // initialize undefined and set when found.
      var assetOfTs;

      /**
       * Recursively search asset and nested asset for timeseries and set
       * variables ts and assetOfTs.
       **/
      var setAssetAndTs = function (asset) {
        if (asset.selectedAsset) { return setAssetAndTs(asset.selectedAsset); }

        else {
          ts = _.find(asset.timeseries, { 'uuid': graphTimeseries.id });
          if (ts) { assetOfTs = asset; }
        }

        return ts === undefined; // Break out early
      };

      _.forEach(DataService.assets, setAssetAndTs);

      if (ts) {
        graphTimeseries.parameter = ts.parameter || EMPTY;
        graphTimeseries.unit = ts.unit || EMPTY;
        graphTimeseries.location = ts.location || EMPTY;
        graphTimeseries.name = ts.name || EMPTY;
        if (ts.reference_frame) {
          graphTimeseries.unit += ' (' + ts.reference_frame + ')';
        }
        graphTimeseries.thresholds = [];
      }

      if (assetOfTs) {
        var threshold = {value: null, name: ''};
        _.forEach(
          WantedAttributes[assetOfTs.entity_name].rows,
          function (attr) {
            if (attr.valueSuffix === graphTimeseries.unit) {
              var value = parseFloat(assetOfTs[attr.attrName]);
              if (!isNaN(value)) {

                var name = assetOfTs.name === '' ? '...' : assetOfTs.name;

                threshold = {
                  value: value,
                  name: name + ': ' + attr.keyName
                };
                graphTimeseries.thresholds.push(threshold);
              }
            }
          }
        );
      }

      var tsState = _.find(
        State.selected.timeseries,
        { 'uuid': graphTimeseries.id }
      );

      // In db with crosssections it is possible to not have state of a ts.
      if (tsState) {
        graphTimeseries.color = tsState.color;
        graphTimeseries.order = tsState.order;
      }

      return graphTimeseries;
    };

    var formatTimeseriesForGraph = function (timeseries) {

      var graphTimeseriesTemplate = {
        id: '', //uuid
        data: [],
        unit: '',
        color: '', // Defined on asset.timeseries
        order: '', // Defined on asset.timeseries
        valueType: '',
        labels: {
          x: '',
          y: ''
        },
        keys: { x: 'timestamp', y: { y0: 'min', y1: 'max' } }
      };

      var result = [];
      timeseries.forEach(function (ts) {
        var graphTimeseries = angular.copy(graphTimeseriesTemplate);
        graphTimeseries.data = ts.events;
        graphTimeseries.id = ts.uuid;
        graphTimeseries.valueType = ts.value_type;
        graphTimeseries = addColorAndOrderAndUnitAndTresholds(graphTimeseries);
        result.push(graphTimeseries);
      });
      return result;

    };

    var filterTimeseries = function (results) {

      // maximum number of timeseries events, more probably results in a
      // memory error.
      var MAX_NR_TIMESERIES_EVENTS = 25000;

      var filteredResult = [];

      angular.forEach(results, function (ts) {
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
        }
      });

      return filteredResult;
    };

  }

]);
