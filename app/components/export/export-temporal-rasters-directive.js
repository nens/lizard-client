angular.module('export')
.directive('exportTemporalRasters', ['State', 'DataService', 'ExportTemporalRastersService',
function (State, DataService, ExportTemporalRastersService) {

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
    console.log("[F] link");

    // initialize the datepicker
    var dateEl = $('#datepicker-export.input-daterange');
    dateEl.datepicker({
      format: 'dd-mm-yyyy'
    });
    // bind the hide event to updateDates
    dateEl.on('hide', function () {});

    var timeState = {
      start: new Date(State.temporal.start),
      end: new Date(State.temporal.end)
    };

    // initialize the datepicker with the right dates
    dateEl.find('#datepicker-export-start').datepicker(
      'setDate', timeState.start);
    dateEl.find('#datepicker-export-end').datepicker(
      'setDate', timeState.end);

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

    scope.formattedGeoms = formattedPointGeoms.concat(formattedAssetGeoms);
    scope.activeTemporalRasters = getActiveTemporalRasters() || [];
    scope.hasActiveTemporalRasters = scope.activeTemporalRasters.length > 0;

    if (!scope.hasActiveTemporalRasters) {
      scope.selectedRaster = null;
    } else {
      scope.selectedRaster = scope.activeTemporalRasters[0];
    }

    scope.dbg = function () {
      console.log("[F] dbg")
      console.log("*** scope.selectedRaster....:", scope.selectedRaster);
      console.log("*****> selectedGeom (idx)...:", scope.selectedGeomIdx);
      console.log("*****> selectedGeom (obj)...:", scope.formattedGeoms[scope.selectedGeomIdx]);
    };

    scope.startRasterExport = function () {

      var theSelectedGeom = scope.formattedGeoms[scope.selectedGeomIdx];

      ExportTemporalRastersService.startExport(
        State.temporal.start,
        State.temporal.end,
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