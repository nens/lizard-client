/**
 * Service to handle raster requests.
 */
app.service("RasterService", ["Restangular", "UtilService",
  function (Restangular, UtilService) {

  /**
   * Hard coded rain variables.
   *
   * timeResolution: smallest time resolution for rain in ms (5 min.)
   * imageUrlBase: url to  get WMS rain images.
   */
  this.rainInfo = {
    "timeResolution": 300000,
    "imageUrlBase": 'https://raster.lizard.net/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=demo%3Aradar&STYLES=transparent&FORMAT=image%2Fpng&SRS=EPSG%3A3857&TRANSPARENT=true&HEIGHT=497&WIDTH=525&ZINDEX=20&SRS=EPSG%3A28992&EFFECTS=radar%3A0%3A0.008&BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809&TIME='
  };

}]);
