/**
 * Service to handle getFeatureInfo requests for wms layers.
 */
angular.module('lizard-nxt')
.service("WmsGetFeatureInfoService", [

  "LeafletService",
  "CabinetService",
  "$q",
  'State',

  function (LeafletService, CabinetService, $q, State) {

  /**
   * Gets data from wmsGetFeatureInfo resource of cabinetService.
   *
   * It takes the private _map leaflet map from the private _leafletLayer to
   * provide the wms server with a clue of what the user clicked on. It is a
   * nasty technique that will bite us when we ask for a featureInfo of a latLng
   * without having a map. This is the way wms works. It works if the layer has
   * a _leafletLayer._map otherwise it rejects the promise.
   *
   * @param  {string}   callee  optional string indicating the origin of the
   *                            call.
   * @param  {NxtLayer} layer   nxt layer.
   * @param  {object}   options options that contain geom.
   * @return {object}          promise that resolves with wms response object.
   *                            Or promise that gets rejected when geometry is
   *                            not a leaflet LatLng or undefined.
   *
   */
  var getData = function (callee, layer, options) {

    if (options.geom === undefined
      || !(options.geom instanceof LeafletService.LatLng)
      || !(layer._leafletLayer)
      || !(layer._leafletLayer._map)) {
      var defer = $q.defer();
      defer.reject();
      return defer.promise;
    }

    // NOTE: its ugly we know. See description above.
    var map = layer._leafletLayer._map;

    var size = map.getSize(),
        bbox = map.getBounds().toBBoxString(),
        point = map.latLngToLayerPoint(options.geom);

    var params = {
      SERVICE: 'WMS',
      VERSION: '1.1.1',
      REQUEST: 'GetFeatureInfo',
      INFO_FORMAT: 'application/json',
      LAYERS: layer.slug,
      QUERY_LAYERS: layer.slug,
      STYLES: '', // required.
      SRS: "EPSG:4326",
      BBOX: bbox,
      WIDTH: size.x,
      HEIGHT: size.y,
      X: point.x,
      Y: point.y
    };

    var url = layer.url + '/?';
    for (var key in params) {
        if (url != "") {
            url += "&";
        }
        url += key + "=" + params[key];
    }

    return CabinetService.wmsGetFeatureInfo.get({url:url});
  };

  return {
    getData: getData,
  };

}]);

