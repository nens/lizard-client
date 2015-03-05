/**
 * Service to handle raster requests.
 */
angular.module('lizard-nxt')
  .service("RasterService", ["Restangular",
                             "UtilService",
                             "CabinetService",
                             "LeafletService",
                             "$q",
  function (Restangular, UtilService, CabinetService, LeafletService, $q) {

  var intensityData,
      cancelers = {};

  var getData = function (layer, options) {

    // TODO: get this from somewhere
    var GRAPH_WIDTH = UtilService.getCurrentWidth();

    var srs = 'EPSG:4326',
        agg = options.agg || '',
        wkt = UtilService.geomToWkt(options.geom),
        startString,
        endString,
        aggWindow;

    if (options.start && options.end) {
      startString = new Date(options.start).toISOString().split('.')[0];
      endString = new Date(options.end).toISOString().split('.')[0];
    }

    aggWindow = options.aggWindow || UtilService.getAggWindow(options.start,
      options.end, GRAPH_WIDTH);

    var canceler;
    // getData can have own deferrer to prevent conflicts
    if (options.deferrer) {
      var deferSlug = options.deferrer.origin;
      canceler = options.deferrer.deferred;
      if (cancelers[options.deferrer.origin]) {
        cancelers[options.deferrer.origin].resolve();
      }
      cancelers[options.deferrer.origin] = canceler;
    }
    // if it doesn't have a deferrer in the options
    // use the layer slug..
      else {
      if (cancelers[layer.slug]) {
        cancelers[layer.slug].resolve();
      }

      canceler = cancelers[layer.slug] = $q.defer();
    }

    return CabinetService.raster(canceler).get({
      raster_names: layer.slug,
      geom: wkt,
      srs: srs,
      start: startString,
      stop: endString,
      agg: agg,
      styles: options.styles,
      window: aggWindow
    });
  };

  /**
   * Build the bounding box given an imageBounds
   */
  var _buildBbox = function (imgBounds) {
    return [imgBounds[0].x, imgBounds[0].y].toString() +
      ',' + [imgBounds[1].x, imgBounds[1].y].toString();
  };

  /**
   * Returns wms url as used by the non-tiled layer for animation.
   *
   * @param  {object} wmsLayer   nxt map layer instance with options and slug.
   * @param  {object} map        current leaflet map
   * @param  {string} store         name of store rain-5min|rain-hour etc.
   * @param  {boolean} singleTile when single it returns a proper tilesize
   *                              otherwise just 256x256px.
   * @return {string}            url
   */
  var buildURLforWMS = function (wmsLayer, map, store, singleTile) {
    var layerName = store || wmsLayer.slug,
        bounds = map.getBounds(),
        DEFAULT_TILE_SIZE = 256; // in px

    var imgBounds = [
      LeafletService.CRS.EPSG3857.project(bounds.getSouthWest()),
      LeafletService.CRS.EPSG3857.project(bounds.getNorthEast()),
    ],
    opts = wmsLayer.options,
    result = wmsLayer.url
      + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&FORMAT=image%2Fpng'
      + '&SRS=EPSG%3A3857&LAYERS=' + layerName
      + '&BBOX=' + _buildBbox(imgBounds);

    if (singleTile) {
      var size = map.getPixelBounds().getSize();
      opts.height = Math.round(size.y / size.x * DEFAULT_TILE_SIZE);
      opts.width = Math.round(size.x / size.y  * DEFAULT_TILE_SIZE);
    } else {
      // Serve square tiles
      opts.height = DEFAULT_TILE_SIZE;
      opts.width = DEFAULT_TILE_SIZE;
    }

    angular.forEach(opts, function (v, k) {
      result += UtilService.buildString('&', k.toUpperCase(), "=", v);
    });

    // key TIME needs to come last, so we can subsequently append it's value
    // for every frame in the animation:
    result += '&TIME=';

    return result;
  };

  var getMinTimeBetweenFrames = function (layerGroup) {

    if (layerGroup.slug === 'rain') {
      return 100;
    } else {
      return 1000;
    }

  };

  return {
    getMinTimeBetweenFrames: getMinTimeBetweenFrames,
    buildURLforWMS: buildURLforWMS,
    getData: getData,
  };

}]);
