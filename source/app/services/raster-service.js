/**
 * Service to handle raster requests.
 */

app.service("RasterService", ["Restangular", "UtilService", "CabinetService", "$q",
  function (Restangular, UtilService, CabinetService, $q) {

  var intensityData,
      cancelers = {};

  var getData = function (layer, options) {

    var srs = 'EPSG:4326',
        agg = options.agg || '',
        wkt = UtilService.geomToWkt(options.geom),
        startString,
        endString;

    if (options.start && options.end) {
      startString = new Date(options.start).toISOString().split('.')[0];
      endString = new Date(options.end).toISOString().split('.')[0];
    }

    if (cancelers[layer.slug]) {
      cancelers[layer.slug].resolve();
    }

    var canceler = cancelers[layer.slug] = $q.defer();

    return CabinetService.raster(canceler).get({
      raster_names: layer.slug,
      geom: wkt,
      srs: srs,
      start: startString,
      stop: endString,
      agg: agg
    });
  };

  // Set by rain controller and get by timeline
  //var intensityData;

  var setIntensityData = function (data) {
    intensityData = data;
  };

  var getIntensityData = function () {
    return intensityData;
  };

    /**
   * Build the bounding box given an imageBounds
   */
  var _buildBbox = function (imgBounds) {
    return [imgBounds[0][1], imgBounds[1][0]].toString() +
      ',' + [imgBounds[1][1], imgBounds[0][0]].toString();
  };

  var buildURLforWMS = function (wmsLayer) {

    var imgBounds = [
          [wmsLayer.bounds.north, wmsLayer.bounds.west],
          [wmsLayer.bounds.south, wmsLayer.bounds.east]
        ],
        opts = wmsLayer.options,
        result = wmsLayer.url
          + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&FORMAT=image%2Fpng'
          + '&SRS=EPSG%3A4326&LAYERS=' + wmsLayer.slug
          + '&BBOX=' + _buildBbox(imgBounds);

    angular.forEach(opts, function (v, k) {
      result += '&' + k.toUpperCase() + '=' + v;
    });

    // key TIME needs to come last, so we can subsequently append it's value
    // for every frame in the animation:
    result += '&TIME=';

    return result;
  };

  /**
   * Get a list of Leaflet imageOverlays. This is used for rasters with a
   * temporal component.
   *
   * @param {integer} numCachedFrames
   * @param {float[]} imgBounds
   *
   * @return {Object[]}
   */
  var getImgOverlays = function (numCachedFrames, imgBounds) {

    var i, imgOverlays = {};

    for (i = 0; i < numCachedFrames; i++) {
      imgOverlays[i] = L.imageOverlay('', imgBounds, {opacity: 0});
    }

    return imgOverlays;
  };

  var handleElevationCurve = function (data) {
    var datarow,
        i,
        formatted = [];

    for (i in data[0]) {
      datarow = [data[0][i], data[1][i]];
      formatted.push(datarow);
    }
    return formatted;
  };

  var getTimeResolution = function (layerGroup) {

    switch (layerGroup.slug) {

    case 'rain':
      return 300000;

    case 'bath:westerschelde':
      return 15768000000;

    case 'westerschelde:diff':
      return 15768000000;

    default:
      throw new Error(
        'Tried to call RasterService.getTimeResolution() for unsupported layerGroup, i.e:',
        layerGroup
      );
    }
  };

  return {
    getTimeResolution: getTimeResolution,
    buildURLforWMS: buildURLforWMS,
    // rasterInfo: rasterInfo,
    getIntensityData: getIntensityData,
    setIntensityData: setIntensityData,
    //getRasterData: getRasterData,
    getData: getData,
    // getTemporalRaster: getTemporalRaster,
    getImgOverlays: getImgOverlays,
    handleElevationCurve: handleElevationCurve,
    //getRasterDataForExtentData: getRasterDataForExtentData,
  };

}]);
