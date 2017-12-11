angular.module('export')
.directive('exportTemporalRasters', ['State', 'DataService',
  'ExportTemporalRastersService', 'user', '$timeout',
function (State, DataService, ExportTemporalRastersService, user, $timeout) {

  function initTimeState () {
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

    return timeState;
  }

  function getSelectedGeoms () {

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

    var pointGeoms = getSelectedPointGeoms();
    var formattedPointGeoms = pointGeoms.map(function (geom) {
      return {
        name: 'Point: (' + geom.coordinates[1] + ", " + geom.coordinates[0] + ")",
        geom: geom
      }
    });

    var assetInfo = getSelectedAssetGeoms();
    var assetGeoms = assetInfo[0];
    var assetNames = assetInfo[1];
    var formattedAssetGeoms = assetGeoms.map(function (geom, idx) {
      return {
        name: 'Asset: ' + assetNames[idx],
        geom: geom
      }
    });

    return formattedPointGeoms.concat(formattedAssetGeoms);
  };

  function getActiveTemporalRasters () {
    console.log("[F] getActiveTemporalRasters");

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
        return dataLayer.temporal
          && activeTemporalRasterUuids.indexOf(dataLayer.uuid > -1);
      }
    );

    console.log("*** activeTemporalRasters:", activeTemporalRasters);
    return activeTemporalRasters;
  };

  var link = function (scope) {

    console.log("[F] linkkk");

    var timeState = initTimeState();

    scope.data = {};
    scope.isAuthenticated = user.authenticated;

    scope.formattedGeoms = getSelectedGeoms();
    scope.hasFormattedGeoms = scope.formattedGeoms.length > 0;

    scope.activeTemporalRasters = getActiveTemporalRasters();
    scope.hasActiveTemporalRasters = scope.activeTemporalRasters.length > 0;

    scope.userCanExportTemporalRasters = function () {
      return scope.hasActiveTemporalRasters
        && scope.hasGeoms;
    }

    scope.dbg = function () {
      console.log("[F] dbg")
      console.log("*** scope.isAuthenticated........:", scope.isAuthenticated);
      console.log("*** scope.data.selectedRaster....:", scope.data.selectedRaster);
      console.log("*** scope.data.selectedGeomIdx...:", scope.data.selectedGeomIdx);
      console.log("*****> theFormattedGeom..........:", scope.formattedGeoms[scope.data.selectedGeomIdx]);
    };

    scope.startRasterExport = function () {

      scope.dbg();

      var theSelectedGeom = scope.formattedGeoms[scope.data.selectedGeomIdx];

      ExportTemporalRastersService.startExport(
        timeState.start.getTime(),
        timeState.end.getTime(),
        scope.data.selectedRaster,
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