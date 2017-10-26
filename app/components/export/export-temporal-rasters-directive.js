angular.module('export')
.directive('exportTemporalRasters', ['State', 'DataService',
function (State, DataService) {

  function getSelectedPointGeoms () {
    var pointGeoms = _.filter(State.geometries, function (geom) {
      return geom.geometry && geom.geometry.type === 'Point';
    });
    return pointGeoms.map(function (geom) { return geom.geometry });
  };

  function getSelectedAssetGeoms () {
    var selectedAssetsKeys = State.assets,
        key,
        assetGeoms = [];
    DataService.assets.map(function (asset) {
      key = asset.entity_name + "$" + asset.id;
      if (selectedAssetsKeys.indexOf(key) > -1) {
        assetGeoms.push(asset.geometry);
      }
    });
    return assetGeoms;
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

    scope.sayHi = function () {
      console.log("Hi there!");
    }

    scope.ls = ["foo", "bar", "baz"];

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
    var assetGeoms = getSelectedAssetGeoms();

    scope.activeTemporalRasters = getActiveTemporalRasters();
  };

  return {
    link: link,
    scope: {},
    templateUrl: 'export/export-temporal-rasters.html',
    replace: true,
    restrict: 'E'
  };
}]);