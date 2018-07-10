angular.module('export').service('ExportRastersService', function () {

  var _selected = { raster: null };

  this.resetSelectedRaster = function () {
    _selected.raster = null;
  };

  this.setSelectedRaster = function (shortUuid) {
    _selected.raster = shortUuid;
  };

  this.hasSelectedRaster = function () {
    return _selected.raster !== null;
  };

  this.getSelectedRaster = function () {
    return _selected.raster;
  };

  return this;
});
