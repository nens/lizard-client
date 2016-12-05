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
  function ($q, State, $http, notie, UtilService, DataService, TsUService) {

    // TODO: I think this is part of a database (and thus the data-service)
    // and of the omnibox. Furthermore this contains selection stuff. I think
    // this should be put in their appropriate places. It might be a good idea
    // to put this behind an interface.

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
        if (service.onTimeseriesChange) {
          service.onTimeseriesChange();
        }
      }
    };

    Object.defineProperty(service, 'timeseries', {
      get: function () { return _barTimeseries.concat(_lineTimeseries); },
      set: _setTimeseries,
      enumerable: true
    });

    this.minPoints = GRAPH_WIDTH; // default


    var _selections = [];
    Object.defineProperty(State, 'selections', {
      get: function () { return _selections; },
      set: function (selections) {
        console.log('State.selections:', selections);
        _selections = selections;
        service.syncTime(selections);
      },
      enumerable: true
    });

    /**
     * Finds timeseries, asset or geometry data for a selection.
     *
     * @param  {object}  selection   a selection from State.selections
     * @return {object} asset or geometry data.
     */
    this.findProperty = function (selection) {
      if (selection.timeseries) {
        return _.find(this.timeseries, function (ts) {
          return selection.timeseries === ts.id
        });
      }
      return DataService.findProperty(selection);
    };


    /**
     * Collects timeseries data from the backend.
     *
     * @return {array} array of two angular promises: the first one for lines,
     *                 the second one for bars (data with a ratio scale).
     */
    this.syncTime = function () {

      var groupedSelections = {
        temporalBars: {timeseries: [], rasters: []},
        temporalLines: {timeseries: [], rasters: []}
      };

      _.forEach(State.selections, function(selection){
        if(selection.active){
          var scale = selection.measureScale == "ratio" ? "temporalBars" :
            "temporalLines";
          if (selection.timeseries) {
            groupedSelections[scale].timeseries.push(selection.timeseries)
          } else if (selection.rasters) {
            groupedSelections[scale].rasters.push(selection.timeseries)
          }
        }
      });

      var activeTimeseries = function(actives, minPoints, chartType){
        // Return empty timeseries when empty selection
        var timeseriesPromise;
        if (actives.length === 0) {
          var defer = $q.defer();
          defer.resolve([]);
          timeseriesPromise = defer.promise;
        } else {
          timeseriesPromise =  service._getTimeseries(
            actives,
            State.temporal,
            minPoints && service.minPoints,
            chartType
          );
        }

        timeseriesPromise.then(function (response) {
          service.timeseries = _.filter(
            response,
            function (ts) { return _.some(
              State.selections,
              function (stateTs) {
                return ts.id === stateTs.timeseries && stateTs.active;
              });
            });
          console.log('TimeseriesService.timeseries:', service.timeseries);
          return service.timeseries;
        });

        return timeseriesPromise
      };

      return [
        activeTimeseries(groupedSelections.temporalLines.timeseries, true,
          'lines'),
        activeTimeseries(groupedSelections.temporalBars.timeseries, false,
          'bars')
      ]

    };

    var localPromise = {lines: {}, bars: {}, crosssections: {}};

    /**
     * Color is stored with the ts metadata in asset.timeseries of every asset
     * in DataService.assets. This function searches in the selected timeseries
     * in timeseriesService.timeseries to update the color.
     *
     * @param  {object} changedTS timeseries metadata object
     */
    this.onColorChange = function (changedTS) {
      var ts = _.find(service.timeseries, function (o) {
        return o.id === changedTS.timeseries;
      });
      if (ts) {
        ts.color = changedTS.color;
        if (service.onTimeseriesChange) {
          service.onTimeseriesChange();
        }
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
      if (minPoints) {
        params.min_points = minPoints;
      } else {
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
        url: 'api/v2/timeseries/',
        method: 'GET',
        params: params,
        timeout: localPromise[chartType].promise
      })

      .then(function (response) {
        return response.data.results;
      }, errorFn)

      .then(TsUService.filterTimeseries, errorFn)
      .then(TsUService.formatTimeseriesForGraph, null);
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

    var _rasterComparatorFactory = function (comparatorType) {
      return function (existingSelection, newSelection) {
        return existingSelection.type === "raster" &&  // prevent undefined === undefined = true for raster
          existingSelection[comparatorType] &&  // prevent undefined === undefined = true for comparator type
          existingSelection.raster === newSelection.raster &&
          existingSelection[comparatorType] === newSelection[comparatorType]; // only keep one selection if both raster and comparator type are equal
    }};

    var _timeseriesComparator = function(existingSelection, newSelection){
        return existingSelection.type === "timeseries" &&
            existingSelection.timeseries === newSelection.timeseries;
    };

    /**
     * Generates UUID
     *
     * Taken from:
     * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript/#answer-2117523
     *
     * Disclaimer:
     * Since we use Math.random there is a somewhat higher chance of collision
     * than other higher quality random number generator like we use in the
     * Lizard backend.
     */
    var uuidGenerator = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
      function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });

    /**
     * initializes timeseries selections for a certain asset.
     *
     * @param  {object} asset   a DataService asset with timeseries.
     * @return {object} asset or geometry data.
     */
    this.initializeTimeseriesOfAsset = function (asset) {
      var colors = UtilService.GRAPH_COLORS;
      State.selections = _.unionWith(
        State.selections,
        asset.timeseries.map(function (ts, i) {
          return {
            uuid: uuidGenerator(),
            type: "timeseries",
            timeseries: ts.uuid,
            active: false,
            order: 0,
            color: colors[i % (colors.length - 1)],
            measureScale: ts.scale
          };
        }),
        _timeseriesComparator
      );
      return asset;
    };

    /**
     * initializes timeseries selections for a certain asset or geometry.
     *
     * @param  {object} asset|geometry  a DataService asset with timeseries.
     * @return {object} asset or geometry data.
     */
    this.initializeRasterTimeseries = function (geomObject, geomType) {
      var geomId = geomType === 'asset' ?
        geomObject.entity_name + "$" + geomObject.id :
        geomObject.geometry.coordinates.toString();
      var colors = UtilService.GRAPH_COLORS;
      State.selections = _.unionWith(
        State.selections,
        _.filter(State.layers,
            function(layer) {return layer.type === 'raster'}
        ).map(function (layer, i) {
          var rasterSelection  = {
            uuid: uuidGenerator(),
            type: "raster",
            raster: layer.uuid,
            active: false,
            order: 0,
            color: colors[i + 8 % (colors.length - 1)],
            measureScale: layer.scale
          };
          rasterSelection[geomType] = geomId;
          return rasterSelection;
        }),
        _rasterComparatorFactory(geomType)
      );
      return geomObject;
    };
  }

]);


/**
 * Service to handle timeseries retrieval.
 */
angular.module('timeseries')
.service('TimeseriesUtilService', ['WantedAttributes', 'DataService', 'State',
  function (WantedAttributes, DataService, State) {

    /**
     * Looks up timeseries in State.selections and copies color and order.
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
        State.selections,
        { 'timeseries': graphTimeseries.id }
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
        keys: { x: 'timestamp', y: 'value' }
      };

      var result = [];
      timeseries.forEach(function (ts) {
        var graphTimeseries = angular.copy(graphTimeseriesTemplate);
        graphTimeseries.data = ts.events;
        if (graphTimeseries.data && graphTimeseries.data.length > 0) {
          // The y key is not always 'value' for bar charts. We get the y key
          // from the data.
          var yKey = _.filter(
              Object.keys(graphTimeseries.data[0]),
              function(x){ return x !== graphTimeseries.keys.x; }
          );
          if (yKey.length === 1 && graphTimeseries.keys.y !== yKey[0]) {
            graphTimeseries.keys.y = yKey[0];
          }
        }
        graphTimeseries.id = ts.uuid;
        graphTimeseries.valueType = ts.value_type;
        graphTimeseries.measureScale = ts.observation_type.scale;
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

    return {
      filterTimeseries: filterTimeseries,
      formatTimeseriesForGraph: formatTimeseriesForGraph,
      addTimeseriesProperties: addTimeseriesProperties
    };

  }

]);
