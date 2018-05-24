/**
 * Service to handle timeseries retrieval.
 */
angular.module('timeseries').service("TimeseriesService", [
  '$q',
  'State',
  '$http',
  'notie',
  'UtilService',
  'DataService',
  'TimeseriesUtilService',
  'ChartCompositionService',
  'RelativeToSurfaceLevelService',
  'gettextCatalog',
  '$timeout',
  function ($q, State, $http, notie, UtilService,
            DataService, TsUService, ChartCompositionService,
            RTSLService, gettextCatalog, $timeout) {
    // *wrapped* boolean indicating we want the timeseries value (y-axis) to be
    // relative to the asset's "surface_level" value (boolean set to true) or
    // we want it to be the absolute value (boolean set to false);

    // NB! This wrapping is required for syncing multiple directive scopes to
    // this value: if the boolean does not gets wrapped, every directive's scope
    // gets a local copy and will tehrefor not be updated in-sync with updating
    // the value in the service
    var service = this;

    var GRAPH_WIDTH = 320; // Width of drawing area of box graphs.

    // Contains timeseries metadata and data as comes from api. Since bars and
    // lines

    var _barTimeseries = [];
    var _lineTimeseries = [];

    var _setTimeseries = function (timeseriesIn) {
      if (timeseriesIn !== undefined && timeseriesIn.length > 0 &&
          timeseriesIn[0].measureScale) {
        if (timeseriesIn[0].measureScale !== "ratio") {
          _barTimeseries = timeseriesIn;
        } else {
          _lineTimeseries = timeseriesIn;
        }
        DataService.buildDashboard();
      }
    };

    Object.defineProperty(service, 'timeseries', {
      get: function () { return _barTimeseries.concat(_lineTimeseries); },
      set: _setTimeseries,
      enumerable: true
    });

    this.minPoints = GRAPH_WIDTH; // default

    /**
     * Collects timeseries data from the backend.
     *
     * @return {array} array of two angular promises: the first one for lines,
     *                 the second one for bars (data with a ratio scale).
     */
    this.syncTime = function () {
      var isDashboard = State.context === 'charts';

      var groupedCharts = {
        temporalBars: [],
        temporalLines: [],
      };


      if (isDashboard) {
        ChartCompositionService.getActiveCharts().forEach(function (chart) {
          var scale = chart.measureScale === "ratio" ? "temporalBars" :
                      "temporalLines";

          if (chart.timeseries) {
            groupedCharts[scale].push({
              timeseries: chart.timeseries,
              isActive: function () {
                return ChartCompositionService.isKeyActive(chart.uuid);
              }
            });
          }
        });
      } else {
        DataService.allActiveAssets().forEach(function (assetKey) {
          if (State.selectedForAssets[assetKey] && State.selectedForAssets[assetKey].timeseries) {
            var ts = State.selectedForAssets[assetKey].timeseries;
            var scale = ts.scale === "ratio" ? "temporalBars" : "temporalLines";

            groupedCharts[scale].push({
              timeseries: ts.uuid,
              isActive: function () {
                // Return true if asset is still in State.assets and this timeseries
                // is still selected.
                return (
                  State.assets.indexOf(assetKey) !== -1 &&
                  State.selectedForAssets[assetKey].timeseries.uuid === ts.uuid);
              }
            });
          }
        });
      }

      var activeTimeseries = function(charts, minPoints, chartType) {
        // Return empty timeseries when empty selection
        var timeseriesPromise;
        if (charts.length === 0) {
          var defer = $q.defer();
          defer.resolve([]);
          timeseriesPromise = defer.promise;
        } else {
          timeseriesPromise =  service._getTimeseries(
            charts.map(function (chart) { return chart.timeseries; }),
            State.temporal,
            minPoints && service.minPoints,
            chartType
          );
        }

        timeseriesPromise.then(function (response) {
          service.timeseries = response;
          return service.timeseries;
        });

        return timeseriesPromise;
      };

      return [
        activeTimeseries(groupedCharts.temporalLines, true, 'lines'),
        activeTimeseries(groupedCharts.temporalBars, false, 'bars')
      ];
    };

    var localPromise = {lines: {}, bars: {}, crosssections: {}};

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
    this._getTimeseries = function (uuids, timeState, minPoints, chartType) {

      // Cancel consecutive calls.
      if (localPromise[chartType].reject) {
        localPromise[chartType].resolve({data: {results: []}});
      }
      localPromise[chartType] = $q.defer();

      var id = uuids.join(',');
      var params = {
        uuid: id,
        start: timeState.start ? parseInt(timeState.start, 10): undefined,
        end: timeState.end ? parseInt(timeState.end, 10): undefined,
      };

      if (chartType === 'lines' && RTSLService.get()) {
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
        timeout: localPromise[chartType].promise
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
      console.error('errorFn called:', err);
      if (err.status === 420 || err.status === -1) {
        // Cancel normal operations
        return $q.reject(err);
      }
      else if (err.status >= 500 && err.status < 600) {
        notie.alert(
          3,
          gettextCatalog.getString(
            'Lizard encountered a problem retrieving your timeseries.'),
          3
        );
        // Cancel normal operations
        return $q.reject(err);
      }
      window.Raven.captureException(err);
      return err; // continue anyway
    };


    this.zoomToInterval = function (intervalText, selectedTimeseries) {
      var now = (new Date()).getTime();
      var start, end, intervalMs;
      switch(intervalText) {
        case "one_year":
          intervalMs = 31536000000; // one year in ms
          end = now;
          start = end - intervalMs;
          break;
        case "three_months":
          intervalMs = 7884000000; // three months in ms (avg)
          end = now;
          start = end - intervalMs;
          break;
        case "two_weeks":
          intervalMs = 1209600000; // two weeks in ms
          end = now;
          start = end - intervalMs;
          break;
        case "timesteps_range":
          var activeTs = _.find(service.timeseries, { id: selectedTimeseries.uuid });
          if (activeTs) {
            start = activeTs.start;
            end = activeTs.end;
          }

          break;
        case 'timesteps_range_all_active':
          var charts = ChartCompositionService.getActiveCharts();

          charts.forEach(function (chart) {
            var chartStart, chartEnd;

            if (chart.type === 'raster') {
              var dataLayer = _.find(DataService.dataLayers, { uuid: chart.raster });
              chartStart = dataLayer.firstValueTimestamp;
              chartEnd = dataLayer.lastValueTimestamp;
            } else if (chart.type === 'timeseries') {
              var ts = _.find(service.timeseries, { id: chart.timeseries });
              chartStart = ts.start;
              chartEnd = ts.end;
            }

            if (chartStart && chartEnd) {
              start = start ? Math.min(start, chartStart) : chartStart;
              end = end ? Math.max(end, chartEnd) : chartEnd;
            }
          });
          break;
        default:
         console.error(
            "Unknown interval '" +
            intervalText +
            "' for temporal zoom; allowed values are " +
            "'one_year', 'three_months', 'two_weeks', 'timesteps_range' and " +
            "'timesteps_range_all_active'"
          );
      }

      if (!(start && end)) {
        return;
      }

      // If start and end are at the same point in time (i.e. we have a
      // timeseries with only a single measured value), we "pad" the space
      // to have decent visualization.
      if (start === end) {
        var defaultAggWindow = 3600000 * 24 * 7; // 1 week, in ms
        var aggWindow = defaultAggWindow;
        end = start + aggWindow;
      }

      // We toggle State.temporal.timelineMoving to trigger the correct
      // angular $watch in the timeline-directive.
      State.temporal.timelineMoving = !State.temporal.timelineMoving;
      State.temporal.at = start;
      State.temporal.start = start;
      State.temporal.end = end;

      $timeout(function () {
        // We reset State.temporal.timelineMoving (a-sync, compliant with
        // angular $digest cycle).
        State.temporal.timelineMoving = !State.temporal.timelineMoving;
      });
    };
  }
]);


/**
 * Service to handle timeseries retrieval.
 */
angular.module('timeseries').service('TimeseriesUtilService', [
  'WantedAttributes', 'DataService', 'State', 'RelativeToSurfaceLevelService',
  function (WantedAttributes, DataService, State, RTSLService) {

    /**
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

      return graphTimeseries;
    };

    var formatTimeseriesForGraph = function (timeseries) {

      var yKey = timeseries.field || 'value';
      var result = [];

      timeseries.forEach(function (ts) {
        var graphTimeseries = {
          id: ts.uuid,
          data: ts.events,
          measureScale: ts.observation_type.scale,
          valueType: ts.value_type,
          keys: { x: 'timestamp', y: yKey },
          start: ts.start,
          end: ts.end
        };

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
      addTimeseriesProperties: addTimeseriesProperties  // Export so unit test can call it
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
