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

  /**
   * Wrapper function to set hard coded rain cruft.
   *
   * @param: {integer} timestamp - javascript timestamp in ms.
   */
  this.getRainWMSImages = function (timestamp) {
    var coeff = this.rainInfo.timeResolution,
        imageUrlBase = this.rainInfo.imageUrlBase,
        now = UtilService.roundTimestamp(timestamp, coeff, true);

    return this.getWMSImages(imageUrlBase, now, coeff);
  };

  /**
   * Returns object of urls of raster wms images indexed by timestamp.
   *
   * Builds object with image urls and preloads images in browser cache.
   *
   * @param {string} imageUrlBase - name of raster to get images for.
   * @param {integer} timestamp - javascript timestamp of first image in ms.
   * @param {integer} timeStep - time between images in ms.
   * @returns {object} - object of WMS image urls indexed by timestamp.
   *
   */
  this.getWMSImages = function (imageUrlBase, timestamp, timeStep) {
    if (timestamp !== undefined) {
      var utc_formatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
      var nxtDate = timestamp,
          imageUrl,
          imageUrls = {};

      for (var i = 0; i < (24); i++) {
        imageUrl = imageUrlBase + utc_formatter(new Date(nxtDate));
        (new Image()).src = imageUrl;
        imageUrls[nxtDate] = imageUrl;
        nxtDate += timeStep;
      }

      return imageUrls;
    }
  };
}]);
