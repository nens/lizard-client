angular.module('export')
.directive('exportTemporalRasters', ['State', 'DataService',
  'ExportTemporalRastersService', 'user', '$timeout',
function (State, DataService, ExportTemporalRastersService, user, $timeout) {

  function getSelectedPointGeoms () {
    var pointGeoms = _.filter(State.geometries, function (geom) {
      return geom.geometry && geom.geometry.type === 'Point';
    });
    return pointGeoms.map(function (geom) { return geom.geometry });
  };

  function getSelectedAssetGeoms () {
    var selectedAssetsKeys = State.assets,
        key,
        assetGeoms = [],
        assetNames = [];
    DataService.assets.map(function (asset) {
      key = asset.entity_name + "$" + asset.id;
      if (selectedAssetsKeys.indexOf(key) > -1) {
        assetGeoms.push(asset.geometry);
        assetNames.push(key);
      }
    });
    return [assetGeoms, assetNames];
  };

  function getActiveTemporalRasters () {
    var temporalRasters = _.filter(DataService.dataLayers, {
      temporal: true,
      type: 'raster'
    });

    var temporalRasterUuids = temporalRasters.map(function (tempRaster) {
      return tempRaster.uuid;
    });

    var activeTemporalRasterUuids = [];
    temporalRasterUuids.forEach(function (uuid) {
      var stateLayer = _.find(State.layers, { uuid: uuid });
      if (stateLayer && stateLayer.active) {
        activeTemporalRasterUuids.push(uuid);
      }
    });

    var activeTemporalRasters = _.filter(DataService.dataLayers,
      function (dataLayer) {
        return activeTemporalRasterUuids.indexOf(dataLayer.uuid > -1);
      }
    );

    return activeTemporalRasters;
  };

  var link = function (scope) {

    scope.isAuthenticated = user.authenticated;

    // Initialize timeState/make sure that it is updated when user changes the
    // values in the from/to-datepicker (a.k.a "Prepare the temporal part for
    // your export"):
    var timeState = {
      start: new Date(State.temporal.start),
      end: new Date(State.temporal.end)
    };

    $timeout(function () {
      var dateEl = $('#datepicker-export-rasters.input-daterange');
      dateEl.datepicker({ format: 'dd-mm-yyyy' });
      dateEl.find('#datepicker-export-start').datepicker(
        'setDate', timeState.start);
      dateEl.find('#datepicker-export-end').datepicker(
        'setDate', timeState.end);
      dateEl.on('hide', function (e) {
        if (e.target.name === 'end')   { timeState.end = new Date(e.date); }
        if (e.target.name === 'start') { timeState.start = new Date(e.date); }
      });
    });

    // Prepare the spatial part for your export:
    var assetInfo = getSelectedAssetGeoms();
    var assetGeoms = assetInfo[0];
    var assetNames = assetInfo[1];
    var formattedAssetGeoms = assetGeoms.map(function (geom, idx) {
      return {
        name: 'Asset: ' + assetNames[idx],
        geom: geom
      }
    });
    var pointGeoms = getSelectedPointGeoms();
    var formattedPointGeoms = pointGeoms.map(function (geom) {
      return {
        name: 'Point: (' + geom.coordinates[1] + ", " + geom.coordinates[0] + ")",
        geom: geom
      }
    });
    scope.formattedGeoms = formattedPointGeoms.concat(formattedAssetGeoms);

    scope.selectedGeomIdx = null;
    scope.formattedGeoms = formattedPointGeoms.concat(formattedAssetGeoms);
    scope.activeTemporalRasters = getActiveTemporalRasters();
    scope.hasActiveTemporalRasters = scope.activeTemporalRasters.length > 0;
    console.log("[dbg] scope.hasActiveTemporalRasters:", scope.hasActiveTemporalRasters);

    scope.hasGeoms = scope.formattedGeoms.length > 0;
    scope.selectedRaster = scope.hasActiveTemporalRasters
      ? scope.activeTemporalRasters[0]
      : null;

    scope.userCanExportTemporalRasters =
      scope.hasActiveTemporalRasters &&
      scope.hasGeoms

    scope.dbg = function () {
      console.log("[F] dbg")
      console.log("*** scope.isAuthenticated...:", scope.isAuthenticated);
      console.log("*** scope.selectedRaster....:", scope.selectedRaster);
      console.log("*****> selectedGeom (idx)...:", scope.selectedGeomIdx);
      console.log("*****> selectedGeom (obj)...:", scope.formattedGeoms[scope.selectedGeomIdx]);
    };

    scope.startRasterExport = function () {

      scope.dbg();

      var theSelectedGeom = scope.formattedGeoms[scope.selectedGeomIdx];

      ExportTemporalRastersService.startExport(
        timeState.start.getTime(),
        timeState.end.getTime(),
        scope.selectedRaster,
        theSelectedGeom.geom
      );
    }
  };

  return {
    link: link,
    scope: {},
    templateUrl: 'export/export-temporal-rasters.html',
    replace: true,
    restrict: 'E'
  };
}]);