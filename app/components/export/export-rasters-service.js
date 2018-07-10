angular.module('export').service('ExportRastersService', function () {

  var _selected = { raster: null };

  this.resetSelectedRaster = function () {
    console.log("[F] RESET");
    _selected.raster = null;
  };

  this.setSelectedRaster = function (shortUuid) {
    console.log("[F] SET: setSelectedRaster to value:", shortUuid);
    _selected.raster = shortUuid;
  };

  this.hasSelectedRaster = function () {
    return _selected.raster !== null;
  };

  this.getSelectedRaster = function () {
    console.log("[F] GET: getSelectedRaster (value:", _selected.raster + ")");
    return _selected.raster;
  };

  return this;
});
