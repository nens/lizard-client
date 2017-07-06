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
  'TimeseriesUtilService',
  'RelativeToSurfaceLevelService',
  function ($q, State, $http, notie, UtilService, DataService, TsUService, RTSLService) {
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
        service.syncTime();
      },
      enumerable: true
    });

    this.syncTime = function () {
      var groupedTimeseries = {temporalBars: [], temporalLines: []};

      _.forEach(State.selected.timeseries, function(ts) {
        if (ts.active) {
          if (ts.measureScale === "ratio") {
            groupedTimeseries.temporalBars.push(ts.uuid);
          } else {
            groupedTimeseries.temporalLines.push(ts.uuid);
          }
        }
      });

      var getActiveTimeseries = function(actives, useMinPoints, noDefer, graphType) {
        if (actives.length === 0) {
          var defer = $q.defer();
          defer.resolve([]);
          return defer.promise;
        } else {
          return service._getTimeseries(
            actives,
            State.temporal,
            useMinPoints && service.minPoints,
            noDefer,
            graphType
          );
        }
      };

      var promise = $q.all([
        getActiveTimeseries(
          groupedTimeseries.temporalLines, true, false, 'temporalLines'),
        getActiveTimeseries(
          groupedTimeseries.temporalBars, false, true, 'temporalBars')
      ]).then(function (response) {
        var barsAndLinesTimeseries = _.concat(response[0], response[1]);
        console.log('TimeseriesService.timeseries:', service.timeseries);
        return barsAndLinesTimeseries;
      })
      .then(function (barsAndLinesTimeseries) {
        // Called asynchronously, so check if timeseries is still in state and
        // active.
        service.timeseries = _.filter(
          barsAndLinesTimeseries,
          function (ts) { return _.some(
            State.selected.timeseries,
            function (stateTs) {
              return ts.id === stateTs.uuid && stateTs.active;
            });
          });
        return service.timeseries;
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

    var localPromiseLines = {};
    var localPromiseBars = {};

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
     * @param {str} uuids asset identifyer. <entityname>$<id>
     * @param {object} timeState contains time parameters: start {int},
     *                           end {int}(get timeserie data from and till
     *                           in epoch ms) and aggWindow {str} (mutual
     *                           exclusive with minPoints, for barChart, ask
     *                           for the aggregation window.)
     * @param {int} minPoints mutual exlcusive with timeState.aggWindow, for
     *                        lines, ask for minimally the graphs width amount
     *                        of pixels.
     */
    this._getTimeseries = function (uuids, timeState, minPoints, noReject, graphType) {

      var localPromise = graphType === 'temporalLines'
        ? localPromiseLines
        : localPromiseBars;

      if (!noReject){
        // Cancel consecutive calls.
        if (localPromise.reject) {
          localPromise.resolve({data: {results: []}});
        }
        localPromise = $q.defer();
      }

      var id = uuids.join(',');
      var params = {
        uuid: id,
        start: timeState.start ? parseInt(timeState.start, 10): undefined,
        end: timeState.end ? parseInt(timeState.end, 10): undefined,
      };

      if (graphType === 'temporalLines' && RTSLService.get()) {
        params.relative_to = 'surface_level';
      }

      if (minPoints) {
        params.min_points = minPoints;
      } else {
        // TODO: aggwindow should be month, second, some other timeunit.
        var aggWindow;
        if (timeState.aggWindow <= 1000) {
          aggWindow = "second";
        } else if (timeState.aggWindow <= 60000) {
          aggWindow = "minute";
        } else if (timeState.aggWindow <= 300000) {
          aggWindow = "5min";
        } else if (timeState.aggWindow <= 3600000) {
          aggWindow = "hour";
        } else if (timeState.aggWindow <= 86400000) {
          aggWindow = "day";
        } else if (timeState.aggWindow <= 604800000) {
          aggWindow = "week";
        } else if (timeState.aggWindow <= 2678400000) {
          aggWindow = "month";
        } else {
          aggWindow = "year";
        }

        params.window = aggWindow;
        // We aggregate temporally using sum. This is what we want for rain and
        // this also seems to be a logical default for other parameters.
        params.fields = 'sum';
      }

      return $http({
        url: 'api/v3/timeseries/',
        method: 'GET',
        params: params,
        timeout: localPromise.promise
      })

      // Bind field to succes function so we can use it as the y key for graphs.
      .then(function (response) {
        var result = response.data.results;
        result.field = this.field;
        return result;
      }.bind({field: params.fields}), errorFn)

      .then(TsUService.filterTimeseries, errorFn)
      .then(TsUService.formatTimeseriesForGraph);
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
            color: colors[i % (colors.length - 1)],
            measureScale: ts.scale
          };
        }),
        'uuid'
      );
      return asset;
    };
  }
]);


/**
 * Service to handle timeseries retrieval.
 */
angular.module('timeseries')
       .service('TimeseriesUtilService', [
         'WantedAttributes', 'DataService', 'State', 'RelativeToSurfaceLevelService',
         function (WantedAttributes, DataService, State, RTSLService) {

    /**
     * Looks up timeseries in State.selected.timeseries and copies color and order.
     * TimeseriesService.timeseries are not persistent when toggled.
     * asset.timeseries is persistent till a user removes it from selection.
     *
     * @param {object} graphTimeseries timeseriesSerivce.timeseries timeseries
     *                                 object.
     */
    var addTimeseriesProperties = function (graphTimeseries) {
      var EMPTY = '...';
      var ts; // initialize undefined and set when found.
      var assetOfTs;

      /**
       * Recursively search asset and nested asset for timeseries and set
       * variables ts and assetOfTs.
       **/
      var setAssetAndTs = function (asset) {
        ts = _.find(asset.timeseries, { 'uuid': graphTimeseries.id });
        if (ts) { assetOfTs = asset; }
        if (!ts && asset.selectedAsset) { return setAssetAndTs(asset.selectedAsset); }
        return ts === undefined; // Break out early
      };

      _.forEach(DataService.assets, setAssetAndTs);

      if (ts) {
        graphTimeseries.parameter = ts.parameter || EMPTY;
        graphTimeseries.unit = ts.unit || EMPTY;
        graphTimeseries.location = ts.location || EMPTY;
        graphTimeseries.name = ts.name || EMPTY;
        graphTimeseries.reference_frame = ts.reference_frame;
        graphTimeseries.thresholds = [];

        var tsActive = _.find(State.selected.timeseries, {'uuid': ts.uuid });
        if (tsActive && tsActive.active) {
          assetOfTs.ts = graphTimeseries.ts;
        }
      }

      if (assetOfTs) {
        _.forEach(
          WantedAttributes[assetOfTs.entity_name].rows,
          function (attr) {
            // Construct a string like "m (NAP)" to compare to valueSuffix, as
            // the timeseries object has that in two separate values now.
            var unitAndReference = (
              graphTimeseries.unit +
               (graphTimeseries.reference_frame ? ' ('+graphTimeseries.reference_frame+')' : '')
            );

            if (attr.valueSuffix === unitAndReference) {
              // This attribute is to be shown in a chart with this unit and reference
              var value = parseFloat(assetOfTs[attr.attrName]);

              if (!isNaN(value)) {
                var name = assetOfTs.name || '...';

                var surface_level = parseFloat(
                  DataService.getPropFromAssetOrParent(
                    assetOfTs, 'surface_level'));

                var threshold = {
                  value: value,
                  name: name + ': ' + attr.keyName,
                  // These two are added so thresholds can optionally be
                  // shown relative to surface level.
                  reference_frame: graphTimeseries.reference_frame,
                  surface_level: surface_level
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

      var yKey = timeseries.field || 'value';
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
        keys: { x: 'timestamp', y: yKey }
      };

      var result = [];
      timeseries.forEach(function (ts) {
        var graphTimeseries = angular.copy(graphTimeseriesTemplate);

        graphTimeseries.data = ts.events;
        graphTimeseries.id = ts.uuid;
        graphTimeseries.valueType = ts.value_type;
        graphTimeseries.measureScale = ts.observation_type.scale;

        graphTimeseries.start = ts.start;
        graphTimeseries.end = ts.end;

        graphTimeseries = addTimeseriesProperties(graphTimeseries);
        result.push(graphTimeseries);
      });
      return result;
    };

    var filterTimeseries = function (results) {

      // maximum number of timeseries events, more probably results in a
      // memory error.
      var MAX_NR_TIMESERIES_EVENTS = 25000;

      var filteredResult = [];
      filteredResult.field = results.field;

      angular.forEach(results, function (ts) {
        var msg = '';
        if (ts.events === null) {
          filteredResult.push(ts);
        } else if (ts.events.length < MAX_NR_TIMESERIES_EVENTS) {

          if (ts.observation_type === null) {
            ts.observation_type = {};
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

    return {
      filterTimeseries: filterTimeseries,
      formatTimeseriesForGraph: formatTimeseriesForGraph,
      addTimeseriesProperties: addTimeseriesProperties
    };

  }

]);


/* Service that stores whether we are currently showing heights relative to surface level */
angular.module('timeseries').service('RelativeToSurfaceLevelService', [
  function () {
    // *wrapped* boolean indicating we want the timeseries value (y-axis) to be
    // relative to the asset's "surface_level" value (boolean set to true) or
    // we want it to be the absolute value (boolean set to false);

    // NB! This wrapping is required for syncing multiple directive scopes to
    // this value: if the boolean does not gets wrapped, every directive's scope
    // gets a local copy and will tehrefor not be updated in-sync with updating
    // the value in the service
    var service = this;

    this.relativeToSurfaceLevel = {'value': false};

    this.get = function() {
      return service.relativeToSurfaceLevel.value;
    };

    this.toggle = function() {
      service.relativeToSurfaceLevel.value = !service.relativeToSurfaceLevel.value;
    };
  }
]);
