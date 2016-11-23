/**
 * Lizard-client global state selections.
 */
angular.module('global-state')
  .service('SelectionService', [
    'DataService',
    'DBCardsService',
    'TimeseriesService',
    function (DataService, DBCardsService, TimeseriesService) {

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

    var _getTimeseriesMetaData = function (selection, asset) {
      // if no asset is given, iterate over all assets if the asset is a
      // geometry instead no timeseries are found so this will return undefined
      var assets = asset !== undefined ? [asset] : DataService.assets;
      var tsMetaData;
      _.forEach(assets, function (a) {
        tsMetaData = _.find(a.timeseries, function (ts) {
          return ts.uuid === selection.timeseries;
        });
        if (tsMetaData === undefined) {
          tsMetaData = {match: false}
        } else {
          tsMetaData.match = true
        }
        tsMetaData.type = 'timeseries';
        return !tsMetaData;
      });
      return tsMetaData;
    };

    var _getRasterMetaData = function (selection, geometry) {
      var geomRaster, idGeomFunction, geomType, geomAsset;
      if (selection.asset) {
        geomType = "asset";
        idGeomFunction = function(a) {return a.entity_name + "$" + a.id};
        geomRaster = _.find(DataService.assets, function (asset) {
          geomAsset = asset;
          return idGeomFunction(geomAsset) === selection.asset;
        });
      } else {
        geomType = "geom";
        idGeomFunction = function(g) {return g.geometry.coordinates.toString()};
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
    };

    /**
     * Factory that returns a function that finds metadata for a selection.
     * metadata search can be limited to a geometry.
     *
     * @param  {object}  geometry   either an asset or a geometry from the
     *                              State.
     * @param  {object}  selection  selection from the State.
     * @return {object} asset, timeseries or geometry metadata, including a
     *                  match attribute that states whether a selection belongs
     *                  to the geometry.
     */
    var getMetaData = function(geometry){
      return function (selection) {
        if (selection.timeseries) {
          return _getTimeseriesMetaData(selection, geometry);
        } else if (selection.raster) {
          return _getRasterMetaData(selection, geometry);
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
        DBCardsService.removeItemFromPlot(selection);
      }

      selection.active = !selection.active;
      if (DataService.onSelectionsChange) {
        DataService.onSelectionsChange();
      }
      TimeseriesService.syncTime();
    };

    return {
      metaData: getMetaData(),
      metaDataFactory: getMetaData,
      dbSupportedData: dbSupportedData,
      toggle: toggleSelection
    };
  }]);