/**
 * Service to handle raster requests.
 */
angular.module('lizard-nxt')
  .service("RasterService", ["State",
                             "UtilService",
                             "CabinetService",
                             "LeafletService",
                             "$q",
                             "$http",
  function (State, UtilService, CabinetService, LeafletService, $q, $http) {

  var intensityData,
      cancelers = {};

  var getData = function (options) {

    var srs = 'EPSG:4326',
        agg = options.agg || '',
        startString,
        endString,
        aggWindow;

    if (options.start && options.end) {
      startString = new Date(options.start).toISOString().split('.')[0];
      endString = new Date(options.end).toISOString().split('.')[0];
    }

    aggWindow = options.aggWindow || State.temporal.aggWindow;

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
      if (cancelers[options.uuid]) {
        cancelers[options.uuid].resolve();
      }

      canceler = cancelers[options.uuid] = $q.defer();
    }

    var requestOptions = {
      rasters: options.uuid,
      srs: srs,
      start: startString,
      stop: endString,
      agg: agg,
      styles: options.styles,
      window: aggWindow
    };

    if (options.id) {
      requestOptions.geom_id = options.id;
      requestOptions.boundary_type = options.boundary_type;
    } else {
      requestOptions.geom = UtilService.geomToWkt(options.geom);
    }
    console.log(CabinetService.raster(canceler).get(requestOptions));
    return CabinetService.raster(canceler).get(requestOptions);
  };

  var getTimesteps = function (options) {
    return $http({
        method: 'GET',
        url: 'api/v2/rasters/' + options.uuid + '/timesteps/',
        params: {start: options.start, end: options.end}
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
  var buildURLforWMS = function (url, map, singleTile, wmsOpts, options) {
    options = options || {};
    wmsOpts = wmsOpts || {};
    var bounds = options.bounds || map.getBounds(),
        DEFAULT_TILE_SIZE = 256; // in px

    var imgBounds = [
      LeafletService.CRS.EPSG3857.project(bounds.getSouthWest()),
      LeafletService.CRS.EPSG3857.project(bounds.getNorthEast()),
    ],

    result = url
      + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&FORMAT=image%2Fpng'
      + '&SRS=EPSG%3A3857'
      + '&BBOX=' + _buildBbox(imgBounds);

    if (singleTile) {
      var size = options.size || map.getPixelBounds().getSize();
      wmsOpts.height = Math.round(size.y / size.x * DEFAULT_TILE_SIZE);
      wmsOpts.width = Math.round(size.x / size.y  * DEFAULT_TILE_SIZE);
    } else {
      // Serve square tiles
      wmsOpts.height = DEFAULT_TILE_SIZE;
      wmsOpts.width = DEFAULT_TILE_SIZE;
    }


    angular.forEach(wmsOpts, function (v, k) {
      result += UtilService.buildString('&', k.toUpperCase(), "=", v);
    });

    // key TIME needs to come last, so we can subsequently append it's value
    // for every frame in the animation:
    result += '&TIME=';

    return result;
  };

  return {
    buildURLforWMS: buildURLforWMS,
    getData: getData,
    getTimesteps: getTimesteps
  };

}]);
