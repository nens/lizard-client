app.service("CabinetService", ["$q", "Restangular",
  function ($q, Restangular) {

  //var eventTypes = window.event_types;

  var termSearchResource,
      bboxSearchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups,
      timeseriesLocationObjectResource,
      timeseriesResource,
      flowResource;

  Restangular.setRequestSuffix('?page_size=0');
  geocodeResource = Restangular.one('api/v1/geocode/');
  reverseGeocodeResource = Restangular.one('api/v1/reversegeocode/');
  timeseriesResource = Restangular.one('api/v1/timeseries/');

  /**
   * Raster resource, last stop to the server
   * @param  {promise} q             a promise to cancel previous requests
   *                                 if none is given a local 'abortGet' is used.
   *                                 At the next request without a promise, the
   *                                 abortGet is cancelled.
   * @return {RestangularResource}  a gettable resource
   */
  var abortGet;
  var rasterResource = function (q) {
    var localPromise = q ? q : abortGet;
    if (localPromise === abortGet) {
      if (abortGet) {
        abortGet.resolve();
      }
      abortGet = $q.defer();
      localPromise = abortGet;
    }
    return Restangular
      .one('api/v1/rasters/')
      .withHttpConfig({timeout: localPromise.promise});
  };

  return {
    //eventTypes: eventTypes,
    geocode: geocodeResource,
    raster: rasterResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    panZoom: null,
  };
}]);
