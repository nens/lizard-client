/**
 * Service to handle getFeatureInfo requests for wms layers.
 */
angular.module('lizard-nxt')
.service("WmsGetFeatureInfoService", [

  "CabinetService",
  "$q",
  'State',

  function (CabinetService, $q, State) {

  var getData = function (callee, layer, options) {

    var params = {
      SERVICE: 'WMS',
      VERSION: '1.1.1',
      REQUEST: 'GetFeatureInfo',
      FORMAT: 'image/png',
      INFO_FORMAT: 'application/json',
      LAYERS: layer.slug,
      QUERY_LAYERS: layer.slug,
      STYLES: '', // required..
      SRS: "EPSG:4326",
      BBOX: options.geom.lng
        + ','
        + options.geom.lat
        + ','
        + (options.geom.lng + 0.001)
        + ','
        + (options.geom.lat + 0.001),
      WIDTH: 2,
      HEIGHT: 2,
      X: 1,
      Y: 1
    };

    var url = layer.url + '/?';
    for (var key in params) {
        if (url != "") {
            url += "&";
        }
        url += key + "=" + params[key];
    }
    console.log(url);

    return CabinetService.wmsGetFeatureInfo.get({url:url});
  };

  return {
    getData: getData,
  };

}]);

