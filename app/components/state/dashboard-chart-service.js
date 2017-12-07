/* Used for separating parts of keys */
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
        });
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
        rasterLayers, assets, activeGeometries, activeEventseries) {
        /*
           Generate a list of all dashboard chart keys (currentDashboard keys) related to the
           current layers, assets, geometries.
           Any charts in the current ChartCompositionService that are not in that list
           should be removed from the ChartComposition, apparently some layer or asset was
           turned off elsewhere.
         */
        var allDashboardKeys = [].concat(
          rasterGeometryDashboardKeys(rasterLayers, activeGeometries),
          rasterAssetDashboardKeys(rasterLayers, assets)
        );

        var activeLayers = rasterLayers.filter(function (layer) {
          return (layer.active || layer.fetching);
        });

        var activeAssets = assets.filter(function (asset) {
          return State.assets.indexOf(AssetService.getAssetKey(asset)) !== -1;
        });

        var currentDashboardKeys = [].concat(
          rasterGeometryDashboardKeys(rasterLayers, activeGeometries),
          rasterAssetDashboardKeys(rasterLayers, activeAssets)
        );

        ChartCompositionService.deleteChartsNotIn(allDashboardKeys, currentDashboardKeys);
      };

      var deleteChartsForAsset = function(assetId) {
        var asset = DataService.getAssetByKey(assetId);
        if (!asset) return;

        asset.timeseries.forEach(function (ts) {
          var uuid = ts.uuid;
          var key = getKeyForAssetTimeseries(uuid);
          ChartCompositionService.removeChart(key);
        });
      };

      var createRasterGeometryChart = function(parts, allowEmpty) {
        // Parts is ['raster', '708dcc', 'geometry', '5.6565', '20.000'];
        var key = parts.join(KEY_SEP);
        var geometry = {
          type: 'Point',
          coordinates: [parseFloat(parts[3]), parseFloat(parts[4])]
        };
        var rasterUuid = parts[1];
        var rasterDataLayer = DataService.getDataLayer(rasterUuid);

        if (!rasterDataLayer) {
          // XXXV1; Return temporary chart. This is necessary for restoring old
          // favourites that don't have the async parts of charts in them, can be
          // removed when V1 favourites are not relevant anymore.
          if (allowEmpty) {
            return {
              needsUpdate: true,
              type: 'raster',
              uuid: key,
              geometry: geometry,
              color: getDefaultColor(),
              raster: rasterUuid
            };
          } else {
            return null;
          }
        } else {
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
        }
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
          if (!asset || !asset.timeseries) continue;
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

      var createTimeseriesChart = function(parts, allowEmpty) {
        // Parts is ['timeseries', '32322233221']
        var key = parts.join(KEY_SEP);

        var timeseriesAndAsset = findTimeseriesAndAsset(parts[1]);
        // XXXV1; Return temporary chart. This is necessary for restoring old
        // favourites that don't have the async parts of charts in them, can be
        // removed when V1 favourites are not relevant anymore.
        if (!timeseriesAndAsset) {
          if (allowEmpty) {
            return {
              uuid: key,
              type: "timeseries",
              needsUpdate: true,
              color: getDefaultColor()
            };
          } else {
            return null;
          }
        }

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

      var createChart = function (key, allowEmpty) {
        var parts = key.split(KEY_SEP);
        switch (parts[0]) {
          case 'raster':
            if (parts[2] == 'geometry') {
              return createRasterGeometryChart(parts, allowEmpty);
            } else {
              return createRasterAssetChart(parts);
            }
          case 'timeseries':
            return createTimeseriesChart(parts, allowEmpty);
          default:
            console.error("Unknown key type!", key);
        }
      }

      var getOrCreateChart = function (key) {
        var chart = ChartCompositionService.dashboardCharts[key];

        if (!chart) {
          chart = createChart(key);
        } else if (chart.needsUpdate) {
          // XXXV1; This is horrible, especially the call to syncTime(). Only needed
          // for V1 favourites.
          var newChart = createChart(key, true);
          if (!newChart.needsUpdate) {
            newChart.color = chart.color;
            chart = newChart;
            TimeseriesService.syncTime();
          }
        }

        ChartCompositionService.dashboardCharts[key] = chart;
        return chart;
      };

      var isChartActive = ChartCompositionService.isKeyActive;

      var toggleChart = function (key) {
        if (isChartActive(key)) {
          ChartCompositionService.removeChart(key);
        } else {
          ChartCompositionService.addChart(null, key);
        }

        DataService.buildDashboard();
        TimeseriesService.syncTime();
      };

      /* XXXV1: Can be removed when there are no favourites with VERSION = 1 in the
         database anymore. */
      var translateSelections = function (selections) {
        // Keep the active selections only
        var dashboardCharts = {};
        selections = selections.filter(function (sel) { return sel.active; });
        if (!selections.length) return;

        // Order them by 'order'
        selections.sort(function (a, b) { return a.order - b.order; });

        // Highest order, used to make empty chart composition
        var maxOrder = selections[selections.length -1].order;
        var composedCharts = [];
        for (var i=0; i <= maxOrder; i++) {
          composedCharts.push([]);
        }

        selections.forEach(function (selection) {
          var chart;
          if (selection.type === 'timeseries') {
            chart = createTimeseriesChart(['timeseries', selection.timeseries], true);
          } else if (selection.type === 'raster' && selection.geom) {
            var geomParts = selection.geom.split(',');
            chart = createRasterGeometryChart(
              ['raster', selection.raster, 'geometry', geomParts[0], geomParts[1]], true);
          } else {
            return; // Not a selection we can handle
          }

          chart.color = selection.color;
          dashboardCharts[chart.uuid] = chart;
          composedCharts[selection.order].push(chart.uuid);
        });

        return {
          dashboardCharts: dashboardCharts,
          composedCharts: composedCharts
        };
      };

      return {
        toggleChart: toggleChart,
        updateDashboardCharts: updateDashboardCharts,
        deleteChartsForAsset: deleteChartsForAsset,
        getKeyForAssetTimeseries: getKeyForAssetTimeseries,
        getKeyForRasterGeometry: getKeyForRasterGeometry,
        getKeyForRasterAsset: getKeyForRasterAsset,
        getOrCreateChart: getOrCreateChart,
        isChartActive: isChartActive,
        translateSelections: translateSelections
      };
    }]);
