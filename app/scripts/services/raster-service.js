/**
 * Service to handle raster requests.
 */
angular.module('lizard-nxt')
  .service("RasterService", ["Restangular", "UtilService", "CabinetService",
    "$q", "LeafletService",

  function (Restangular, UtilService, CabinetService, $q, LeafletService) {

  var intensityData,
      cancelers = {};

  var getData = function (layer, options) {

    // TODO: get this from somewhere
    var GRAPH_WIDTH = window.innerwidth;

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
      agg: agg,
      window: aggWindow
    });
  };

  /**
   * Build the bounding box given an imageBounds
   */
  var _buildBbox = function (bounds) {
    var northWest = LeafletService.CRS.EPSG3857.project(new LeafletService.LatLng(
          bounds.north, bounds.west
        )),
        southEast = LeafletService.CRS.EPSG3857.project(new LeafletService.LatLng(
          bounds.south, bounds.east
        ));

    return [northWest.x, northWest.y].toString() +
      ',' + [southEast.x, southEast.y].toString();
  };

  var buildURLforWMS = function (wmsLayer) {
    var opts = wmsLayer.options,
        result = wmsLayer.url
          + '?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&FORMAT=image%2Fpng'
          + '&SRS=EPSG%3A3857&LAYERS=' + wmsLayer.slug
          + '&BBOX=' + _buildBbox(wmsLayer.bounds);

    angular.forEach(opts, function (v, k) {
      result += UtilService.buildString('&', k.toUpperCase(), "=", v);
    });

    // key TIME needs to come last, so we can subsequently append it's value
    // for every frame in the animation:
    result += '&TIME=';

    return result;
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

  return {
    buildURLforWMS: buildURLforWMS,
    getData: getData,
    handleElevationCurve: handleElevationCurve,
  };

}]);
