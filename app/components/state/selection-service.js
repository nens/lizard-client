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

    /**
     * Returns a function that finds metadata for a selection.
     * metadata search can be limited to a geometry.
     *
     * @param  {object}  geometry   either an asset or a geometry from the
     *                              State.
     * @return {function} function that returns either asset or geometry
     *                    metadata or timeseries metadata.
     */
    var getMetaData = function(geometry){
      return function(selection){
        if (selection.timeseries) {
          return getTimeseriesMetaData(geometry, selection);
        } else if (selection.raster) {
          return getRasterMetaData(geometry, selection);
        }};
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
        DBCardsService.removeSelectionFromPlot(selection);
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
    var uuidGenerator = function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
      function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
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

    /**
     * initializes timeseries selections for a certain asset or geometry.
     *
     * @param  {object} asset|geometry  a DataService asset with timeseries.
     * @return {object} asset or geometry data.
     */
    var initializeRasterSelections = function (geomObject, geomType) {
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

    return {
      timeseriesMetaData: getTimeseriesMetaData,
      rasterMetaData: getRasterMetaData,
      initializeAsset: initializeAssetSelections,
      initializeRaster: initializeRasterSelections,
      getMetaDataFunction: getMetaData,
      dbSupportedData: dbSupportedData,
      toggle: toggleSelection
    };
  }]);