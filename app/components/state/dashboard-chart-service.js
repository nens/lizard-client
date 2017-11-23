/*jshint bitwise: false */
/**
 * Lizard-client global state selections.
 */
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

    /**
     * Returns a function that finds metadata for a selection.
     * metadata search can be limited to a geometry.
     *
     * @param  {object}  geometry   either an asset or a geometry from the
     *                              State.
     * @return {function} function that returns either asset or geometry
     *                    metadata or timeseries metadata.
     */
    var getMetaData = function(geometry) {
      return function(selection) {
        if (selection.timeseries) {
          return getTimeseriesMetaData(geometry, selection);
        } else if (selection.raster) {
          return getRasterMetaData(geometry, selection);
        } else if (selection.type === 'eventseries') {
          return getEventseriesMetaData(geometry, selection);
        }
      };
    };

    /**
     * Toggles selection active state and keeps track of the graph order for
     * selections.
     *
     * @param  {object}  geometry   either an asset or a geometry from the
     *                              State.
     * @param  {object}  selection  selection from the State.
     * @return {object} asset, timeseries or geometry metadata, including a
     *                  match attribute that states whether a selection belongs
     *                  to the geometry.
     */
    var toggleSelection = function (selection) {
      if (!selection.active) {
        // Always add selection to a new chart.
        selection.order = ChartCompositionService.addSelection(null, selection.uuid);
        selection.active = true;
      } else {
        ChartCompositionService.removeSelection(selection.uuid);
        selection.active = false;
        selection.order = -1;
      }

      if (DataService.onSelectionsChange) {
        DataService.onSelectionsChange();
      }
      TimeseriesService.syncTime();
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

    /**
     * initializes timeseries selections for a certain asset.
     *
     * @param  {object} asset   a DataService asset with timeseries.
     * @return {object} asset or geometry data.
     */
    var initializeAssetSelections = function (asset) {
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

    var mayInitializeRasterSelection = function (geomObject, geomType) {
      // We don't want duplicate selections for a point in space: when creating
      // a new selection for a geom we check whether we not already have an
      // equivalent selection for an asset, and vice versa when making a new
      // selection for an asset:
      if (geomType === 'geom') {
        // ..and this geom might correspond to an already present asset
        if (geomObject.entity_name && geomObject.id) {
          // OK, this geomObject corresponds to an asset
          var assetKey = geomObject.entity_name + '$' + geomObject.id;
          // Do we already have an selection with type='raster' && asset=<assetKey> ???
          // If so, we GTFO
          if (_.find(State.selections, { type: 'raster', asset: assetKey })) {
            // OK, this geomObject corresponds to an asset that is already present
            console.log("[!] Skipped making geom-selection(s) since it/they would be redundant");
            return false;
          }
        }
      } else if (geomType === 'asset') {
        // ..and this asset might correspond to an already present geom
        var coordString = geomObject.geometry.coordinates[0]
          + ","
          + geomObject.geometry.coordinates[1];
        if (_.find(State.selections, { type: 'raster', geom: coordString })) {
          // OK, we already have selection(s) for the point in space corresponding
          // to the asset's geometry
          console.log("[!] Skipped making asset-selection(s) since it/they would be redundant");
          return false;
        }
      }
      return true;
    };

    /**
     * initializes timeseries selections for a certain asset or geometry.
     *
     * @param  {object} asset|geometry  a DataService asset with timeseries.
     * @return {object} asset or geometry data.
     */
    var initializeRasterSelections = function (geomObject, geomType) {
      if (geomType === 'asset' && AssetService.isNestedAsset(geomObject.entity_name)) {
        // Do not care about raster intersections of nested assets, their parent
        // already does that.
        return geomObject;
      }

      if (!mayInitializeRasterSelection(geomObject, geomType)) {
        return geomObject;
      }

      var geomId = geomType === 'asset'
        ? geomObject.entity_name + "$" + geomObject.id
        : geomObject.geometry.coordinates.toString();
      var colors = UtilService.GRAPH_COLORS;

      var initialUUIDs = _.sortBy(State.selections.map(function (s) { return s.uuid }));

      State.selections = _.unionWith(
        State.selections,
        _.filter(State.layers,
                 function(layer) {
                   return layer.type === 'raster' && layer.active;
                 }
        ).map(function (layer, i) {
          var rasterSelection  = {
            uuid: uuidGenerator(),
            type: "raster",
            raster: layer.uuid,
            active: true, // Roolian?
            order: 0,
            color: colors[i + 8 % (colors.length - 1)],
            measureScale: layer.scale
          };
          rasterSelection[geomType] = geomId;
          return rasterSelection;
        }),
        _rasterComparatorFactory(geomType)
      );

      var finalUUIDs = _.sortBy(State.selections.map(function (s) { return s.uuid }));

      var removedSelections = _.difference(initialUUIDs, finalUUIDs);

      var addedSelections = _.difference(finalUUIDs, initialUUIDs);

      if (removedSelections.length === 0 && addedSelections.length === 0) {
        ;
      } else {
        if (removedSelections.length !== 0 && addedSelections.length !== 0) {
          console.log("THIS SHOULD NEVER PRINT xD");
        } else if (addedSelections.length > 0) {
          addedSelections.forEach(function (uuid) {
            ChartCompositionService.addSelection(null, uuid);
          });
        } else if (removedSelections.length > 0) {
          removedSelections.forEach(ChartCompositionService.removeSelection);
        }
      }

      return geomObject;
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

    var updateForLayerActivity = function (newStateLayers, oldStateLayers) {
      newStateLayers.forEach(function (layer) {
        var oldStateLayer = _.find(oldStateLayers, { uuid: layer.uuid });
        if (!layer.active) {
          if (oldStateLayer && oldStateLayer.active) {
            if (layer.type === 'raster') {
              // We remove all raster selections for the deactivated layer:
              var newSelections = [];
              State.selections.forEach(function (selection) {
                if (selection.raster !== layer.uuid) {
                  newSelections.push(selection);
                }
              });
              State.selections = newSelections;
            } else if (layer.type === 'assetgroup') {
              if (layer.name === 'Water') {

                // We update the ChartComposition, we make it forget all
                // unwanted selections; i.e. all TS selections are no longer
                // wanted since the Water layer was "closed"/deactivated.
                var unwantedSelections = _.filter(State.selections, { type: 'timeseries' });
                var unwantedSelectionsIDs = unwantedSelections.map(function (selection) {
                  return selection.uuid;
                });
                unwantedSelectionsIDs.map(ChartCompositionService.removeSelection);

                // We update the State object accordingly: i.e. we (i) filter out
                // all selections based on timeseries and (ii) we clear all assets:
                State.selections = _.reject(State.selections, { type: 'timeseries' });
                State.assets = [];

                // We update the DataService accordingly:
                DataService.assets = [];
              } else {
                console.warn("[!] Encountered assetgroup that isn't 'Water'. Selections might not be updated properly.");
              }
            }
          }
        } else {
          if (oldStateLayer && !oldStateLayer.active) {
            // 1) ForEach asset in State.assets-> make selection for the newly
            //    activated layer:
            DataService.assets.forEach(function (asset) {
              initializeRasterSelections(asset, 'asset');
            });

            // 2) ForEach Point geometry in State.geometries -> make selection
            //    for the newly activated layer:
            State.geometries.forEach(function (geom) {
              if (geom.geometry.type === 'Point') {
                initializeRasterSelections(geom, 'geom');
              }
            });
          }
        }
      });
    };

    return {
      timeseriesMetaData: getTimeseriesMetaData,
      rasterMetaData: getRasterMetaData,
      initializeAsset: initializeAssetSelections,
      initializeRaster: initializeRasterSelections,
      initializeGeomEventseriesSelections: initializeGeomEventseriesSelections,
      getMetaDataFunction: getMetaData,
      dbSupportedData: dbSupportedData,
      toggle: toggleSelection,
      updateForLayerActivity: updateForLayerActivity
    };
  }]);
