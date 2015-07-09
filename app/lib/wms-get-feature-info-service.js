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
   * It creates a small bbox around options.geom and gets data of that bbox. This
   * is how wms getFeatureInfo works.
   *
   * @param  {string}   callee  optional string indicating the origin of the call.
   * @param  {NxtLayer} layer   nxt layer.
   * @param  {object}   options options that contain geom.
   * @return {promise}          promise that resolves with wms response object.
   *                            Or promise that gets rejected when geometry is
   *                            not a leaflet LatLng or undefined.
   *
   */
  var getData = function (callee, layer, options) {


    if (options.geom === undefined
      || !(options.geom instanceof LeafletService.LatLng)) {
      var defer = $q.defer();
      defer.reject();
      return defer.promise;
    }

    var BOUNDING_BOX_PADDING = 0.001,
        BOUNDING_BOX_PIXEL_SIZE = 2,
        PIXEL_SPACE_COORD = 1;

    var params = {
      SERVICE: 'WMS',
      VERSION: '1.1.1',
      REQUEST: 'GetFeatureInfo',
      INFO_FORMAT: 'application/json',
      LAYERS: layer.slug,
      QUERY_LAYERS: layer.slug,
      STYLES: '', // required.
      SRS: "EPSG:4326",
      BBOX: options.geom.lng
        + ','
        + options.geom.lat
        + ','
        + (options.geom.lng + BOUNDING_BOX_PADDING)
        + ','
        + (options.geom.lat + BOUNDING_BOX_PADDING),
      WIDTH: BOUNDING_BOX_PIXEL_SIZE,
      HEIGHT: BOUNDING_BOX_PIXEL_SIZE,
      X: PIXEL_SPACE_COORD,
      Y: PIXEL_SPACE_COORD
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

