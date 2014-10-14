/**
 * Service to handle raster requests.

 -- TMP ---------------------------------------
 RAIN; BOOTSTRAPPED FROM BACK-END:

     "rain": {
        "layers": [
            {
                "slug": "demo:radar",
                "type": "WMS",
                "min_zoom": 0,
                "max_zoom": 31,
                "z_index": 2,
                "url": "http://raster.lizard.net/wms",
                "tiled": false,
                "temporal": true,
                "aggregation_type": "none",
                "opacity": 1.0,
                "options": {
                    "styles": "BrBG_r:-27:-2",
                    "transparent": false,
                    "effects": "radar:0:0.008"
                },
                "bounds": {
                    "west": 1.324296158471368,
                    "east": 8.992548357936204,
                    "north": 54.28458617998074,
                    "south": 49.82567047026146
                }
            },
            {
                "slug": "radar/basic",
                "type": "Store",
                "min_zoom": 0,
                "max_zoom": 31,
                "z_index": 2,
                "url": "/api/v1/rasters",
                "tiled": false,
                "temporal": true,
                "aggregation_type": "none",
                "opacity": 1.0,
                "options": {},
                "bounds": {}
            }
        ],
        "id": 6,
        "name": "Regen",
        "slug": "rain",
        "active": false,
        "order": 3,
        "baselayer": false
    },
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
