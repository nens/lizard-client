/*jshint bitwise: false */
/**
 * Lizard-client global state selections.
 */

var KEY_SEP = '+';

angular.module('global-state')
  .service('DashboardChartService', [
    'AssetService',
    'DataService',
    'DBCardsService',
    'TimeseriesService',
    'UtilService',
    'State',
    'ChartCompositionService',
    function (
      AssetService, DataService, DBCardsService, TimeseriesService,
      UtilService, State, ChartCompositionService) {

      /*
         Keys are strings like 'asset-<uuid>-timeseries-<uuid>', values
         are objects that keep track of the chart's color, and so on.
         The 'uuid' field of the objects is the same as the key.
         The key is used in ChartCompositionService to track in which chart
         this dashboardChart is currently shown, if any.
         Never remove from this! It's nice for users if a color they set at one
         point is remembered.
      */
      var nextColor = 0;

      var getDefaultColor = function () {
        var colors = UtilService.GRAPH_COLORS;
        var color = colors[nextColor % (colors.length - 1)];
        nextColor++;
        return color;
      };

      var getKeyForAssetTimeseries = function(tsUuid) {
        return 'timeseries' + KEY_SEP + tsUuid;
      };

      var getKeyForRasterGeometry = function(raster, geometry) {
        if (geometry.geometry) {
          geometry = geometry.geometry;
        }

        var coordString = geometry.coordinates[0] + KEY_SEP + geometry.coordinates[1];
        var key = ['raster', raster.uuid, 'geometry', coordString].join(KEY_SEP);
        return key;
      };

      var getKeyForRasterAsset = function(raster, asset) {
        return ['raster', raster.uuid, 'asset', AssetService.getAssetKey(asset)].join(KEY_SEP);
      };

      var timeseriesDashboardKeys = function(activeAssets) {
        var result = [];
        activeAssets.forEach(function (asset) {
          asset.timeseries.forEach(function (ts, i) {
            result.push(getKeyForAssetTimeseries(ts.uuid));
          });
0        });
        return result;
      };

      var rasterGeometryDashboardKeys = function(rasters, geometries) {
        var result = [];
        rasters.forEach(function (raster) {
          geometries.forEach(function (geometry, i) {
            geometry = geometry.geometry; // Yes.
            if (geometry.type !== 'Point') { return; }
            result.push(getKeyForRasterGeometry(raster, geometry));
          });
        });
        return result;
      };

      var rasterAssetDashboardKeys = function(rasters, assets) {
        var result = [];
        rasters.forEach(function (raster) {
          assets.forEach(function (asset, i) {
            if (AssetService.isNestedAsset(asset.entity_name)) {
              return;
            }

            var geometry = asset.geometry;
            if (geometry.type !== 'Point') { return; }
            result.push(getKeyForRasterAsset(raster, asset));
          });
        });
        return result;
      };

      var updateDashboardCharts = function(
        activeTemporalRasterLayers, activeAssets, activeGeometries, activeEventseries) {
        /*
           Generate a list of all dashboard chart keys (currentDashboard keys) related to the
           current layers, assets, geometries.
           Any charts in the current ChartCompositionService that are not in that list
           should be removed from the ChartComposition, apparently some layer or asset was
           turned off elsewhere.
         */
        var currentDashboardKeys = [];

        currentDashboardKeys = currentDashboardKeys.concat(
          timeseriesDashboardKeys(activeAssets));
        currentDashboardKeys = currentDashboardKeys.concat(
          rasterGeometryDashboardKeys(activeTemporalRasterLayers, activeGeometries));
        currentDashboardKeys = currentDashboardKeys.concat(
          rasterAssetDashboardKeys(activeTemporalRasterLayers, activeAssets));

        ChartCompositionService.deleteChartsNotIn(currentDashboardKeys);
      };

      var createRasterGeometryChart = function(parts) {
        // Parts is ['raster', '708dcc', 'geometry', '5.6565', '20.000'];
        var key = parts.join(KEY_SEP);
        var geometry = {
          type: 'Point',
          coordinates: [parseFloat(parts[3]), parseFloat(parts[4])]
        };
        var rasterUuid = parts[1];
        var rasterDataLayer = DataService.getDataLayer(rasterUuid);

        return {
          uuid: key,
          type: "raster",
          geometry: geometry,
          color: getDefaultColor(),
          raster: rasterUuid,
          unit: rasterDataLayer.unit,
          reference_frame: rasterDataLayer.reference_frame,
          description: rasterDataLayer.quantity,
          measureScale: rasterDataLayer.scale
        };
      };

      var createRasterAssetChart = function(parts) {
        // Parts is ['raster', '708dcc', 'asset', 'measuringstation$14']
        var key = parts.join(KEY_SEP);
        var rasterUuid = parts[1];
        var assetKey = parts[3];
        var rasterDataLayer = DataService.getDataLayer(rasterUuid);

        return {
          uuid: key,
          type: "raster",
          asset: assetKey,
          color: getDefaultColor(),
          raster: rasterUuid,
          unit: rasterDataLayer.unit,
          reference_frame: rasterDataLayer.reference_frame,
          description: rasterDataLayer.quantity,
          measureScale: rasterDataLayer.scale
        };
      };

      var findTimeseriesAndAsset = function (timeseriesId) {
        for (var i=0; i < State.assets.length; i++) {
          var asset = DataService.getAssetByKey(State.assets[i]);
          if (!asset.timeseries) continue;
          for (var j=0; j < asset.timeseries.length; j++) {
            var timeseries = asset.timeseries[j];
            if (timeseries.uuid.indexOf(timeseriesId) !== -1) {
              return {
                timeseries: timeseries,
                asset: asset
              };
            }
          }
        }
      };

      var createTimeseriesChart = function(parts) {
        // Parts is ['timeseries', '32322233221']
        var key = parts.join(KEY_SEP);

        var timeseriesAndAsset = findTimeseriesAndAsset(parts[1]);
        var ts = timeseriesAndAsset.timeseries;
        var asset = timeseriesAndAsset.asset;
        return {
          uuid: key,
          type: "timeseries",
          timeseries: parts[1],
          color: getDefaultColor(),
          unit: ts.unit,
          reference_frame: ts.reference_frame,
          description: (asset.name || asset.code) + ', ' + ts.parameter,
          measureScale: ts.scale
        };
      };

      var createChart = function (key) {
        var parts = key.split(KEY_SEP);
        switch (parts[0]) {
          case 'raster':
            if (parts[2] == 'geometry') {
              return createRasterGeometryChart(parts);
            } else {
              return createRasterAssetChart(parts);
            }
          case 'timeseries':
            return createTimeseriesChart(parts);
          default:
            console.error("Unknown key type!", key);
        }
      }

      var getOrCreateChart = function (key) {
        if (!ChartCompositionService.dashboardCharts[key]) {
          ChartCompositionService.dashboardCharts[key] = createChart(key);
        }
        return ChartCompositionService.dashboardCharts[key];
      };

      var isChartActive = ChartCompositionService.isKeyActive;

      var toggleChart = function (key) {
        if (isChartActive(key)) {
          ChartCompositionService.removeSelection(key);
        } else {
          ChartCompositionService.addSelection(null, key);
        }

        DataService.buildDashboard();
        TimeseriesService.syncTime();
      };

      /**
       * Checks whether this datatype is supported for graphs.
       *
       * @return {Boolean} datatype support
       */
      var dbSupportedData = function (type, property) {
        var temporal = property.temporal && type === 'Point';

        var events = property.format === 'Vector' && type !== 'LineString';

        var other = type !== 'Point'
                 && property.scale !== 'nominal'
                 && property.scale !== 'ordinal';

        return temporal || events || other;
      };

      /**
       * Finds metadata for a timeseries selection.
       * metadata search can be limited to a geometry.
       *
       * @param  {object}  geometry   either an asset or a geometry from the
       *                              State.
       * @param  {object}  selection  selection from the State.
       * @return {object} asset, timeseries or geometry metadata, including a
       *                  match attribute that states whether a selection belongs
       *                  to the geometry.
       */
      var getTimeseriesMetaData = _.curry(function (geometry, selection) {
        // if no asset is given, iterate over all assets if the asset is a
        // geometry instead no timeseries are found so this will return undefined
        var assets = geometry !== undefined ? [geometry] : DataService.assets;
        var tsMetaData = { match: false };
        var valueType;
        _.forEach(assets, function (a) {
          tsMetaData = _.find(a.timeseries, function (ts) {
            return ts.uuid === selection.timeseries;
          });
          if (tsMetaData === undefined) {
            tsMetaData = { match: false };
          } else {
            tsMetaData.match = true;
          }
          tsMetaData.type = 'timeseries';
        });
        return tsMetaData;
      });

      /**
       * Finds metadata for a raster selection.
       * metadata search can be limited to a geometry.
       *
       * @param  {object}  geometry   either an asset or a geometry from the
       *                              State.
       * @param  {object}  selection  selection from the State.
       * @return {object} asset, timeseries or geometry metadata, including a
       *                  match attribute that states whether a selection belongs
       *                  to the geometry.
       */
      var getRasterMetaData = _.curry(function (geometry, selection) {
        var geomRaster, idGeomFunction, geomType, geomAsset;
        if (selection.asset) {
          geomType = "asset";
          idGeomFunction = function(a) { return a.entity_name + "$" + a.id; };
          geomRaster = _.find(DataService.assets, function (asset) {
            geomAsset = asset;
            return idGeomFunction(geomAsset) === selection.asset;
          });
        } else {
          geomType = "geom";
          idGeomFunction = function(g) { return g.geometry.coordinates.toString(); };
          geomRaster = _.find(DataService.geometries, function (geom) {
            geomAsset = geom;
            return idGeomFunction(geom) === selection.geom;
          });
        }
        geometry = geometry || geomRaster;
        var props = { match: false };
        if (geomRaster && geomRaster.properties) {
          var assetProps = geomRaster.properties[selection.raster];
          if (assetProps) {
            props = assetProps;
            var assetCode = idGeomFunction(geometry);
            props.match = selection[geomType] === assetCode &&
                          dbSupportedData(geometry.geometry.type, props);
          }
        }
        return props;
      });

      var getEventseriesMetaData = function getEventseriesMetaData(geometry, selection) {
        if (geometry.geometry.coordinates.toString() !== selection.geomType) {
          return {match: false};
        }

        return {
          type: 'eventseries',
          quantity: selection.quantity,
          match: true
        };
      };

    var _rasterComparatorFactory = function (comparatorType) {
      return function (existingSelection, newSelection) {
        return existingSelection.type === "raster" &&  // prevent undefined === undefined = true for raster
          existingSelection[comparatorType] &&  // prevent undefined === undefined = true for comparator type
          existingSelection.raster === newSelection.raster &&
          existingSelection[comparatorType] === newSelection[comparatorType]; // only keep one selection if both raster and comparator type are equal
      };
    };

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
    var uuidGenerator = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
      function(c) {
        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    };

    var initializeGeomEventseriesSelections = function (geomObject) {
      if (!geomObject.geometry || geomObject.geometry.type !== 'Point' ||
          !geomObject.properties) {
        return false;
      }

      var eventSelections = [];
      var i = 0;
      _.forOwn(geomObject.properties, function (props, layerUuid) {
        if (props.type !== 'eventseries') {
          return;
        }

        if (!props.data || !props.data.length) {
          return;
        }

        eventSelections.push({
          uuid: uuidGenerator(),
          type: 'eventseries',
          active: false,
          order: 0,
          data: props.data, // Why not just add it here
          quantity: props.data.length,
          measureScale: props.scale,
          url: props.url,
          layer: layerUuid,
          geomType: geomObject.geometry.coordinates.toString(),
          color: UtilService.GRAPH_COLORS[i % (UtilService.GRAPH_COLORS.length)]
        });
        i++;
      });

      if (i === 0) {
        // If eventSelections is empty (this happens if-and-only-if i === 0),
        // there is no need to update State.selections
        return;
      }

      State.selections = _.unionWith(
        State.selections,
        eventSelections,
        function (stateSelection, eventSelection) {
          return (
            stateSelection.type === eventSelection.type &&
            stateSelection.url === eventSelection.url &&
            stateSelection.geomType === eventSelection.geomType &&
            stateSelection.layer === eventSelection.layer
          );
        }
      );
    };

    return {
      timeseriesMetaData: getTimeseriesMetaData,
      rasterMetaData: getRasterMetaData,
      initializeGeomEventseriesSelections: initializeGeomEventseriesSelections,
      dbSupportedData: dbSupportedData,
      toggleChart: toggleChart,
      updateDashboardCharts: updateDashboardCharts,
      getKeyForAssetTimeseries: getKeyForAssetTimeseries,
      getKeyForRasterGeometry: getKeyForRasterGeometry,
      getKeyForRasterAsset: getKeyForRasterAsset,
      getOrCreateChart: getOrCreateChart,
      isChartActive: isChartActive
    };
  }]);
