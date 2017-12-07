angular.module('export')
.directive('exportTimeseriesRasters', ['user', 'DataService', 'State', 'UtilService',

  function (user, DataService, State, UtilService) {

  function getTemporalRasters () {
    var rasterUUIDs = _.map(_.filter(State.layers, { type: 'raster' }), 'uuid');

    var dataLayers = _.filter(DataService.dataLayers, function (dataLayer) {
      return rasterUUIDs.indexOf(dataLayer.uuid) > -1
        && dataLayer.temporal;
    });
    var result = {};
    _.forEach(dataLayers, function (dataLayer) {
      result[dataLayer.slug] = dataLayer.uuid;
    });
    return result;
  }

  function getGOAs () {
    console.log("[F] getGOAs");

    var key,
        value,
        pointGeoms,
        totalGeoms = {};

    ///////////////////////////////////////////////////////////////////////////
    // Part 1/2 -- get geometries for State.geometries:
    pointGeoms = _.filter(State.geometries, function (geom) {
       return geom.geometry && geom.geometry.type === 'Point';
    });

    _.forEach(pointGeoms, function (geom) {
      key = "Point: ("
        + geom.geometry.coordinates[1]
        + ", "
        + geom.geometry.coordinates[0]
        + ")";
      value = UtilService.geomToWkt(geom.geometry);
      totalGeoms[key] = value;
    });

    ///////////////////////////////////////////////////////////////////////////
    // Part 2/2 -- get geometries for State.assets:
    DataService.assets.map(function (asset) {
       key = asset.entity_name + "$" + asset.id;
       if (State.assets.indexOf(key) > -1) {
         assetGeoms.push(asset.geometry);
         assetNames.push(key);
       }
     });


    // ...

    console.log("*** totalGeoms:", totalGeoms);

    return totalGeoms;
  }

  var link = function (scope) {
    console.log("[F] Linkkkkkerd");
    scope.isAuthenticated = user.authenticated;
    scope.data = {};
    scope.allTemporalRasters = getTemporalRasters();
    scope.allGOAs = getGOAs();

    scope.startTimeseriesRasterExport = function () {
      console.log("[dbg]");
      console.log("*** scope.isAuthenticated..............:", scope.isAuthenticated);
      console.log("*** scope.data.........................:", scope.data);
      console.log("*** scope.data.selectedTemporalRaster..:", scope.data.selectedTemporalRaster);
    }
  };

  return {
    link: link,
    scope: {},
    restrict: 'E',
    replace: true,
    templateUrl: 'export/export-timeseries-rasters.html'
  }
}]);