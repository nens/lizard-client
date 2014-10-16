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
   * Get latlon bounds for image.
   *
   * @param {object} layerName name of layer.
   * @return {float[]} bounds in list of latlon list.
   */
  // var _getImageBounds = function (layerName) {
  //   if (layerName === 'rain') {
  //     return [[54.28458617998074, 1.324296158471368],
  //             [49.82567047026146, 8.992548357936204]];
  //   }
  //   else if (
  //     layerName === 'bath:westerschelde'
  //     || layerName === 'westerschelde:diff'
  //   )
  //   {
  //     return [[51.41, 4.03],
  //             [51.36, 4.17]];
  //   }
  // };

  // var _getHeight = function (width, imgBounds) {
  //   return parseInt(
  //     width * (
  //       (imgBounds[0][0] - imgBounds[1][0]) / (imgBounds[1][1] - imgBounds[0][1])
  //     ), 10
  //   );
  // };

  // var _getOptsForWMS = function (lgSlug) {

  //   var imgBounds;

  //   switch (lgSlug) {

  //   case 'rain':
  //     return {
  //       'LAYERS': 'demo:radar',
  //       'SRS': 'EPSG:28992',
  //       'STYLES': 'transparent',
  //       'TRANSPARENT': true,
  //       'WIDTH': 525,
  //       'HEIGHT': 497,
  //       'ZINDEX': 20,
  //       'EFFECTS': 'radar:0:0:008',
  //       'BBOX': '147419.974,6416139.595,1001045.904,7224238.809',
  //       'TIME': undefined
  //     };

  //   case 'bath:westerschelde':
  //     imgBounds = _getImageBounds('bath:westerschelde');
  //     return {
  //       'LAYERS': 'bath:westerschelde',
  //       'STYLES': 'BrBG_r:-27',
  //       'TRANSPARENT': false,
  //       'WIDTH': 2000,
  //       'HEIGHT': _getHeight(2000, imgBounds),
  //       'ZINDEX': 26,
  //       'BBOX': _buildBbox(imgBounds),
  //       'TIME': undefined
  //     };
  //   }
  // };

    /**
   * Build the bounding box given an imageBounds
   */
  var _buildBbox = function (imgBounds) {
    return [imgBounds[0][1], imgBounds[1][0]].toString() +
      ',' + [imgBounds[1][1], imgBounds[0][0]].toString();
  };

  var buildURLforWMS = function (wmsLayer) {

    /**
     * valid URL (for rain):
     *
     * https://raster.lizard.net/wms
     * ?SERVICE=WMS
     * &REQUEST=GetMap
     * &VERSION=1.1.1
     * &LAYERS=demo:radar
     * &STYLES=transparent
     * &FORMAT=image%2Fpng
     * &SRS=EPSG%3A3857
     * &TRANSPARENT=true
     * &HEIGHT=497
     * &WIDTH=525
     * &ZINDEX=20
     * &SRS=EPSG%3A28992
     * &EFFECTS=radar%3A0%3A0.008
     * &BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809
     * &TIME=2014-01-25T22:00:00
     *
     * full:
     * https://raster.lizard.net/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=demo:radar&STYLES=transparent&FORMAT=image%2Fpng&SRS=EPSG%3A3857&TRANSPARENT=true&HEIGHT=497&WIDTH=525&ZINDEX=20&SRS=EPSG%3A28992&EFFECTS=radar%3A0%3A0.008&BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809&TIME=2014-01-25T22:00:00
     */

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

    // hardcoded...
    result += '&TIME=2014-01-25T22:00:00';

    console.log('Finish building URL for WMS:', result);
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
