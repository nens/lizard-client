/*jshint bitwise: false */
/**
 * Lizard-client global state selections.
 */
angular.module('global-state')
  .service('SelectionService', [
    'DataService',
    'DBCardsService',
    'TimeseriesService',
    'UtilService',
    'State',
    function (
      DataService, DBCardsService, TimeseriesService, UtilService, State) {

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
      console.log("[F] SelService.getTimeseriesMetaData");
      // if no asset is given, iterate over all assets if the asset is a
      // geometry instead no timeseries are found so this will return undefined


      var assets = geometry !== undefined ? [geometry] : DataService.assets;


      var tsMetaData = { match: false };
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
        // console.log("AAAAAAAAAAAAAAAAA");
        var assetProps = geomRaster.properties[selection.raster];
        if (assetProps) {
          // console.log("BBBBBBBBBBBBBBBBBB");
          props = assetProps;
          var assetCode = idGeomFunction(geometry);

          props.match = selection[geomType] === assetCode &&
            dbSupportedData(geometry.geometry.type, props);
        }
      }
      // console.log("PROPS now looks like:", props);
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
        var plots = DBCardsService.getActiveCountAndOrder();
        selection.order = plots.count > 0
          ? plots.order + 1
          : 0;
      } else {
        // DBCardsService.removeSelectionFromPlot(selection);
      }
      selection.active = !selection.active;

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
      console.log("[F] initializeAssetSelections; asset:", asset);
      var colors = UtilService.GRAPH_COLORS;
      console.log("[dbg] 3 (pre): State.selections:", State.selections);
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
      console.log("[dbg] 3 (post): State.selections:", State.selections);
      return asset;
    };

    /**
     * initializes timeseries selections for a certain asset or geometry.
     *
     * @param  {object} asset|geometry  a DataService asset with timeseries.
     * @return {object} asset or geometry data.
     */
    var initializeRasterSelections = function (geomObject, geomType) {
      console.log("[F] initializeRasterSelections; geomObject:", geomObject);

      // We clicked an asset while also having a temporal raster active:
      // a selection comes into existence with e.g. the following two attrs:
      //
      // selection.asset = 'pumpstation$303'
      // selection.type = 'raster'
      var geomId = geomType === 'asset' ?
        geomObject.entity_name + "$" + geomObject.id :
        geomObject.geometry.coordinates.toString();
      var colors = UtilService.GRAPH_COLORS;
      console.log("[dbg] 2 (pre): State.selections:", State.selections);
      State.selections = _.unionWith(
        State.selections,
        _.filter(State.layers,
            function(layer) {return layer.type === 'raster' && !layer.asset;}
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
      console.log("[dbg] 2 (post): State.selections:", State.selections);
      return geomObject;
    };

    var initializeGeomEventseriesSelections = function (geomObject) {
      console.log("[F] initializeGeomEventseriesSelections; geomObject:", geomObject);
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
      console.log("[dbg] 1 (pre): State.selections:", State.selections);
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
      console.log("[dbg] 1 (post): State.selections:", State.selections);
      };

    return {
      timeseriesMetaData: getTimeseriesMetaData,
      rasterMetaData: getRasterMetaData,
      initializeAsset: initializeAssetSelections,
      initializeRaster: initializeRasterSelections,
      initializeGeomEventseriesSelections: initializeGeomEventseriesSelections,
      getMetaDataFunction: getMetaData,
      dbSupportedData: dbSupportedData,
      toggle: toggleSelection
    };
  }]);
