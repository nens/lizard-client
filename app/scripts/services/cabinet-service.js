angular.module('lizard-nxt')
  .service("CabinetService", ["$q", "Restangular",
  function ($q, Restangular) {

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

  var tooltips = {
    login: "inloggen",
    logout: "uitloggen",
    profile: "profiel aanpassen",
    version: "dubbelklik voor de Lizard versie", // ok, but where is the HTML for it????
    openMenu: "datamenu openen",
    closeMenu: "datamenu sluiten",
    transparency: "transparantie aanpassen",
    pointTool: "punt selectie",
    lineTool: "lijn selectie",
    areaTool: "scherm selectie",
    resetQuery: "resultaatvenster sluiten",
    search: "zoeken",
    zoomInMap: "zoom in op de kaart",
    zoomOutMap: "zoom uit op de kaart",
    zoomInTimeline: "zoom in op de tijdlijn",
    goToNow: "ga naar het heden op de tijdlijn",
    zoomOutTimeline: "zoom uit op de tijdlijn",
    startAnim: "start de animatie",
    stopAnim: "stop de animatie",
    timelineStart: "het begin van de huidige tijdlijn",
    timelineAt:"het 'nu' op de tijdlijn",
    timelineEnd: "het einde van de huidige tijdlijn"
  };

  return {
    //eventTypes: eventTypes,
    tooltips: tooltips,
    geocode: geocodeResource,
    raster: rasterResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    panZoom: null,
  };
}]);
