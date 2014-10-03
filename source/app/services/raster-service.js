/**
 * Service to handle raster requests.
 */
app.service("RasterService", ["Restangular", "UtilService", "CabinetService", "$q",
  function (Restangular, UtilService, CabinetService, $q) {


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
    console.log('getting: ', layer.slug, wkt, srs, startString, endString, agg);
    return CabinetService.raster(canceler).get({
      raster_names: layer.slug,
      geom: wkt,
      srs: srs,
      start: startString,
      stop: endString,
      agg: agg
    });
  };

  /**
   * Get latlon bounds for image.
   *
   * @param {object} layerName name of layer.
   * @return {float[]} bounds in list of latlon list.
   */
  var _getImageBounds = function (layerName) {
      var bounds;
      if (layerName === 'rain') {
        bounds = [[54.28458617998074, 1.324296158471368],
                  [49.82567047026146, 8.992548357936204]];
      }
      if (layerName === 'bath:westerschelde') {
        bounds = [[51.41, 4.03],
                  [51.36, 4.17]];
      }
      if (layerName === 'westerschelde:diff') {
        bounds = [[51.41, 4.03],
                  [51.36, 4.17]];
      }
      return bounds;
    };

  /**
   * Hard coded raster variables.
   *
   * timeResolution: smallest time resolution for rain in ms (5 min.)
   * minTimeBetweenFrames: minimum time between frames in ms.
   * imageUrlBase: url to  get WMS images.
   * @param {string} layerName Name of layer on raster server
   * @return {object} Returns hashtable with info for animation.
   */
  var rasterInfo = function (layerName) {

    var info,
        wmsUrl = 'https://raster.lizard.net/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&FORMAT=image%2Fpng&SRS=EPSG:4326&LAYERS=',
        width = 500,
        height;

    if (layerName === 'rain') {
      info =  {
        "timeResolution": 300000,
        "minTimeBetweenFrames": 250,
        "imageBounds": _getImageBounds(layerName),
        "imageUrlBase": 'https://raster.lizard.net/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=' + 'demo:radar' + '&STYLES=transparent&FORMAT=image%2Fpng&SRS=EPSG%3A3857&TRANSPARENT=true&HEIGHT=497&WIDTH=525&ZINDEX=20&SRS=EPSG%3A28992&EFFECTS=radar%3A0%3A0.008&BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809&TIME=',
      };
    }
    if (layerName === 'bath:westerschelde') {
      info = {
        "timeResolution": 15768000000,
        "minTimeBetweenFrames": 1000,
        "imageBounds": _getImageBounds(layerName),
        "imageUrlBase": wmsUrl + layerName + '&STYLES=BrBG_r:-27:-2&TRANSPARENT=false'
      };
      var bbox = [info.imageBounds[0][1], info.imageBounds[1][0]].toString() +
      ',' + [info.imageBounds[1][1], info.imageBounds[0][0]].toString(),
      width = 2000,
      height = parseInt(width * ((info.imageBounds[0][0] - info.imageBounds[1][0]) / (info.imageBounds[1][1] - info.imageBounds[0][1])), 10);
      info.imageUrlBase = info.imageUrlBase + '&HEIGHT=' + height + '&WIDTH=' + width + '&ZINDEX=26&BBOX=' + bbox + '&TIME=';
    }
    if (layerName === 'westerschelde:diff') {
      info = {
        "timeResolution": 15768000000,
        "minTimeBetweenFrames": 1000,
        "imageBounds": _getImageBounds(layerName),
        "imageUrlBase": wmsUrl + 'bath:westerschelde&STYLES=jet_r:-10:10&TRANSPARENT=false'
      };
      var bbox = [info.imageBounds[0][1], info.imageBounds[1][0]].toString() +
      ',' + [info.imageBounds[1][1], info.imageBounds[0][0]].toString(),
      width = 2000;
      height = parseInt(width * ((info.imageBounds[0][0] - info.imageBounds[1][0]) / (info.imageBounds[1][1] - info.imageBounds[0][1])), 10);
      info.imageUrlBase = info.imageUrlBase + '&HEIGHT=' + height + '&WIDTH=' + width + '&ZINDEX=26&BBOX=' + bbox + '&SUBTRACT=2012-02-15&TIME=';
    }
    return info;
  };
  // Set by rain controller and get by timeline
  var intensityData;

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

  /**
   * Gets temporal raster data from server.
   *
   * @param  {int} start    start of temporal extent
   * @param  {int} stop     end of temporal extent
   * @param  {object} geom   location of temporal extent in {lat: int, lng: int} or leaflet bounds object
   * @param  {int} aggWindow width of the aggregation
   * @param  {string} agg aggregation method eg. 'sum', 'rrc'
   * @return {promise} returns a thennable promise which may resolve with temporal raster data on response
   */
  // var getTemporalRaster = function (start, stop, geom, aggWindow, rasterNames, agg) {
  //   // TODO
  //   var slug = (MapService.mapState.layers) ? MapService.mapState.layers[rasterNames].layers[0].slug : rasterNames;
  //   var stopString, startString, wkt;
  //   stopString = stop.toISOString().split('.')[0];
  //   startString = start.toISOString().split('.')[0];
  //   if (geom.lat && geom.lng) {
  //     // geom is a latLng object
  //     wkt = "POINT(" + geom.lng + " " + geom.lat + ")";
  //   } else {
  //     wkt = "POLYGON(("
  //           + geom.getWest() + " " + geom.getSouth() + ", "
  //           + geom.getEast() + " " + geom.getSouth() + ", "
  //           + geom.getEast() + " " + geom.getNorth() + ", "
  //           + geom.getWest() + " " + geom.getNorth() + ", "
  //           + geom.getWest() + " " + geom.getSouth()
  //           + "))";
  //   }
  //   return CabinetService.raster().get({
  //       raster_names: slug,
  //       geom: wkt,
  //       srs: 'EPSG:4326',
  //       start: startString,
  //       stop: stopString,
  //       window: aggWindow,
  //       agg: agg
  //     });
  // };

  var cancelers = {};

  /**
   * getRasterData gets different types of raster data from
   * the `/api/v1/raster` endpoint.
   * @param  {string} slug - String with requested raster
   * @param  {object} geom        - Object -> Leaflet.Bounds
   * @param  {object} options     - Optional object with extra params
   * @return {promise}  Restangular.get promise
   */
  // var getRasterData = function (slug, geom, start, stop, options) {

  //   var srs, agg, rasterService, canceler, stopString, startString;

  //   if (stop && start) {
  //     stopString = new Date(stop).toISOString().split('.')[0];
  //     startString = new Date(start).toISOString().split('.')[0];
  //   }

  //   if (cancelers[slug]) {
  //     cancelers[slug].resolve();
  //   }

  //   canceler = cancelers[slug] = $q.defer();

  //   srs = options.srs ? options.srs : 'EPSG:4326';
  //   agg = options.agg ? options.agg : '';

  //   return CabinetService.raster(canceler).get({
  //     raster_names: slug,
  //     geom: geom,
  //     srs: srs,
  //     start: startString,
  //     stop: stopString,
  //     agg: agg
  //   });
  // };

  var getRasterDataForExtentData = function (aggType, agg, slug, bounds) {

    var geom = "POLYGON(("
      + bounds.getWest() + " " + bounds.getSouth() + ", "
      + bounds.getEast() + " " + bounds.getSouth() + ", "
      + bounds.getEast() + " " + bounds.getNorth() + ", "
      + bounds.getWest() + " " + bounds.getNorth() + ", "
      + bounds.getWest() + " " + bounds.getSouth()
      + "))";

    if (cancelers[slug]) {
      cancelers[slug].resolve();
    }

    cancelers[slug] = $q.defer();

    var dataProm = getRasterData(slug, geom, undefined, undefined, {
      agg: aggType,
      q: cancelers[slug]
    });

    return dataProm;
  };

  /**
   * Requests data from raster service.
   *
   * @param  {object} layer     nxt defition of a layer
   * @param  {str} slug               short description of layer
   * @param  {object} agg             area object of this
   * @param  {object} bounds   mapState.bounds, containing
   * @return {promise}                a promise with aggregated data and
   *                                  the slug
   */
  var getAggregationForActiveLayer = function (layer, slug, agg, bounds) {
    var dataProm = getRasterDataForExtentData(
      layer.aggregation_type,
      agg,
      slug,
      bounds)
      .then(function (data) {
        agg.data = data;
        agg.type = layer.aggregation_type;
        if (layer.aggregation_type === 'curve') {
          // TODO: return data in a better way or rewrite graph directive
          agg.data = handleElevationCurve(data);
        }
        return {
          agg: agg,
          slug: slug
        };
      });
    return dataProm;
  };

  /**
   * Checks whether rain data, retrieved from the back-end, contains at least
   * one other value than null, so we know that data is available, and allow
   * the app to show the card.
   *
   * @returns {boolean}
   */
  var mustShowRainCard = function (mapState, point) {

    return false;

    // var activeTemporalLayer = mapState.getActiveTemporalLayer();
    // var rainIsActive =
    //         (point.temporalRaster.type === 'rain'
    //           && activeTemporalLayer
    //           && activeTemporalLayer.slug === 'rain'
    //         );

    // if (rainIsActive) {

    //   var i, rainData = point.temporalRaster.data;

    //   for (i = 0; i < rainData.length; i++) {
    //     if (rainData[i][1] !== null) {
    //       return true;
    //     }
    //   }
    // }
    // return false;
  };

  return {
    rasterInfo: rasterInfo,
    getIntensityData: getIntensityData,
    setIntensityData: setIntensityData,
    //getRasterData: getRasterData,
    getData: getData,
    //getTemporalRaster: getTemporalRaster,
    getImgOverlays: getImgOverlays,
    handleElevationCurve: handleElevationCurve,
    //getRasterDataForExtentData: getRasterDataForExtentData,
    mustShowRainCard: mustShowRainCard
  };

}]);
