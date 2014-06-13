app.service("CabinetService", ["$q", "Restangular",
  function ($q, Restangular) {

  var layergroups = window.layerGroups;
  var layers = window.layers;
  var baselayers = window.baseLayers;
  var overlayers = window.overLayers;
  var eventTypes = window.event_types;
  var lastVisitUtime = window.last_visit_utime;

  var termSearchResource,
      bboxSearchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups,
      timeseriesLocationObjectResource,
      timeseriesResource;
  
  Restangular.setRequestSuffix('?page_size=0');
  // termSearchResource = $resource('/api/v1/search/',{isArray: true});
  // bboxSearchResource = $resource('/api/v1/search/',{isArray: true});
  geocodeResource = Restangular.one('api/v1/geocode/');
  reverseGeocodeResource = Restangular.one('api/v1/reversegeocode/');
  timeseriesResource = Restangular.one('api/v1/timeseries/');

  var abortGet;
  var rasterResource = function () {
    if (abortGet) {
      abortGet.resolve();
    }
    abortGet = $q.defer();
    return Restangular
      .one('api/v1/rasters/')
      .withHttpConfig({timeout: abortGet.promise});
  };

  return {
    layergroups: layergroups,
    layers: layers,
    baselayers: baselayers,
    overlayers: overlayers,
    eventTypes: eventTypes,
    // termSearch: termSearchResource,
    // bboxSearch: bboxSearchResource,
    geocode: geocodeResource,
    raster: rasterResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    panZoom: null,
    lastVisitUtime: lastVisitUtime
  };
}]);
