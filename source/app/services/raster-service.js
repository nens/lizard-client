/**
 * Service to handle raster requests.
 */
app.service("RasterService", ["Restangular", "UtilService", "CabinetService", "$q",
  function (Restangular, UtilService, CabinetService, $q) {

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
    return {
    "timeResolution": 300000,
    "minTimeBetweenFrames": 250,
    "imageUrlBase": 'https://raster.lizard.net/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=' + layerName +'&STYLES=transparent&FORMAT=image%2Fpng&SRS=EPSG%3A3857&TRANSPARENT=true&HEIGHT=497&WIDTH=525&ZINDEX=20&SRS=EPSG%3A28992&EFFECTS=radar%3A0%3A0.008&BBOX=147419.974%2C6416139.595%2C1001045.904%2C7224238.809&TIME='
    };
  };

  var rainInfo = rasterInfo('demo%3Aradar');

  // Set by rain controller and get by timeline
  var intensityData;

  var setIntensityData = function (data) {
    intensityData = data;
  };

  var getIntensityData = function () {
    return intensityData;
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
  var getTemporalRaster = function (start, stop, geom, aggWindow, rasterNames, agg) {
    var stopString, startString, wkt;
    stopString = stop.toISOString().split('.')[0];
    startString = start.toISOString().split('.')[0];
    if (geom.lat && geom.lng) {
      // geom is a latLng object
      wkt = "POINT(" + geom.lng + " " + geom.lat + ")";
    } else {
      wkt = "POLYGON(("
            + geom.getWest() + " " + geom.getSouth() + ", "
            + geom.getEast() + " " + geom.getSouth() + ", "
            + geom.getEast() + " " + geom.getNorth() + ", "
            + geom.getWest() + " " + geom.getNorth() + ", "
            + geom.getWest() + " " + geom.getSouth()
            + "))";
    }
    return CabinetService.raster().get({
        raster_names: rasterNames,
        geom: wkt,
        srs: 'EPSG:4326',
        start: startString,
        stop: stopString,
        window: aggWindow,
        agg: agg
      });
  };


  /**
   * getRasterData gets different types of raster data from
   * the `/api/v1/raster` endpoint.
   * @param  {string} rasterNames - String with requested raster
   * @param  {object} geom        - Object -> Leaflet.Bounds
   * @param  {object} options     - Optional object with extra params
   * @return {promise}  Restangular.get promise
   */
  var getRasterData = function (rasterNames, geom, options) {

    var wkt, srs, agg, rasterService;

    srs = options.srs ? options.srs : 'EPSG:4326';
    agg = options.agg ? options.agg : '';

    if (options.wkt) {
      wkt = options.wkt;
    } else {
      wkt = "POLYGON(("
            + geom.getWest() + " " + geom.getSouth() + ", "
            + geom.getEast() + " " + geom.getSouth() + ", "
            + geom.getEast() + " " + geom.getNorth() + ", "
            + geom.getWest() + " " + geom.getNorth() + ", "
            + geom.getWest() + " " + geom.getSouth()
            + "))";
    }

    rasterService = (options.q) ? CabinetService.raster(options.q) : CabinetService.raster();

    return rasterService.get({
      raster_names: rasterNames,
      geom: wkt,
      srs: srs,
      agg: agg
    });
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

  var cancelers = {};

  var getRasterDataForExtentData = function (aggType, agg, slug, bounds) {

    if (cancelers[slug]) {
      cancelers[slug].resolve();
    }

    cancelers[slug] = $q.defer();

    var dataProm = getRasterData(slug, bounds, {
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
   * @param  {object} agg             extentAggregate object of this
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

    for (i = 0; i < numCachedFrames; i++)
      imgOverlays[i] = L.imageOverlay('', imgBounds, {opacity: 0});

    return imgOverlays;
  };

  return {
    rainInfo: rainInfo,
    rasterInfo: rasterInfo,
    getIntensityData: getIntensityData,
    setIntensityData: setIntensityData,
    getRasterData: getRasterData,
    getTemporalRaster: getTemporalRaster,
    getImgOverlays: getImgOverlays,
    handleElevationCurve: handleElevationCurve,
    getRasterDataForExtentData: getRasterDataForExtentData,
    getAggregationForActiveLayer: getAggregationForActiveLayer
  };

}]);
