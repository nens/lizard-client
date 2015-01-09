'use strict';

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
      flowResource,
      events;

  Restangular.setRequestSuffix('?page_size=0');
  geocodeResource = Restangular.one('api/v1/geocode/');
  reverseGeocodeResource = Restangular.one('api/v1/reversegeocode/');
  timeseriesResource = Restangular.one('api/v1/timeseries/');
  events = Restangular.one('api/v1/events/');

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
    login: "Inloggen",
    logout: "Uitloggen",
    profile: "Profiel aanpassen",
    version: "Dubbelklik voor de Lizard versie", // ok, but where is the HTML for it????
    openMenu: "Datamenu openen",
    closeMenu: "Datamenu sluiten",
    transparency: "Transparantie aanpassen",
    pointTool: "Puntselectie",
    lineTool: "Lijnselectie",
    areaTool: "Scherm selectie",
    resetQuery: "Resultaatvenster sluiten",
    search: "Zoeken",
    zoomInMap: "Zoom in op de kaart",
    zoomOutMap: "Zoom uit op de kaart",
    zoomInTimeline: "Zoom in op de tijdlijn",
    goToNow: "Ga naar het heden op de tijdlijn",
    zoomOutTimeline: "Zoom uit op de tijdlijn",
    startAnim: "Start de animatie",
    stopAnim: "Stop de animatie",
    timelineStart: "Het begin van de huidige tijdlijn",
    timelineAt:"Het 'nu' op de tijdlijn",
    timelineEnd: "Het einde van de huidige tijdlijn"
  };

  return {
    //eventTypes: eventTypes,
    events: events,
    tooltips: tooltips,
    geocode: geocodeResource,
    raster: rasterResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    panZoom: null,
  };
}]);
