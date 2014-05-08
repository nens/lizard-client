/**
 * Service to handle raster requests.
 */
app.service("RasterService", ["Restangular", function (Restangular) {

  /**
   * Returns list of urls of raster wms images.
   *
   * @param {string} rasterName - name of raster to get images for
   * @param {integer} timestamp - javascript timestamp of first image in ms
   * @returns {list} - list of WMS image urls
   *
   */
  this.getWMSImages = function (rasterName, timestamp) {
    var imageUrlBase = 'https://raster.lizard.net/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=demo%3Aradar&STYLES=transparent&FORMAT=image%2Fpng&SRS=EPSG%3A3857&TRANSPARENT=true&HEIGHT=497&WIDTH=525&ZINDEX=20&SRS=EPSG%3A28992&EFFECTS=radar%3A0%3A0.008&BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809&TIME=';
    if (timestamp !== undefined) {
      var utc_formatter = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
      // The rain wms only accepts requests for every 5th minute exact
      // round to nearest 5 minutes
      var coeff = 1000 * 60 * 5;
      var now = parseInt((timestamp + (coeff / 2)) / coeff) * coeff;
      // correct for time zone offset in ms
      // TODO: check if this offset is right ??
      var timeZoneOffsetMs = (new Date(now)).getTimezoneOffset() * 60 * 1000;
      now = now - timeZoneOffsetMs;
      // TODO: cleanup browser cache
      // build object with images and preload images in browserCache
      var nxtDate = now,
          imageUrl,
          imageUrls = {};
      for (var i = 0; i < (24); i++) {
        imageUrl = imageUrlBase + utc_formatter(new Date(nxtDate));
        (new Image()).src = imageUrl;
        imageUrls[nxtDate] = imageUrl;
        nxtDate += coeff;
      }
      return imageUrls;
    }
  };
}]);
