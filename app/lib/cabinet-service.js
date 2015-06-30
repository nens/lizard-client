'use strict';

angular.module('lizard-nxt')
  .service("CabinetService", ["$q", "Restangular", "backendDomain", "gettextCatalog",
  function ($q, Restangular, backendDomain, gettextCatalog) {

  var geocodeResource,
      timeseriesResource,
      events;

  // for the wizard demo's
  if (window.location.host === 'nens.github.io' ||
      window.location.host === 'lizard.sandbox.lizard.net') {
    Restangular.setBaseUrl(backendDomain);
    Restangular.setDefaultHttpFields({withCredentials: true});
  }
  Restangular.setRequestSuffix('?page_size=25000');

  timeseriesResource = Restangular.one('api/v1/timeseries/');
  events = Restangular.one('api/v1/events/');

  geocodeResource = Restangular
    // Use a different base url, go directly to our friends at google.
    // They don't mind.
    .withConfig(function(RestangularConfigurer) {
      RestangularConfigurer.setBaseUrl('https://maps.googleapis.com/maps');
    })
    .one('api/geocode/json');


  /**
   * Raster resource, last stop to the server
   * @param  {promise} q             a promise to cancel previous requests
   *                                 if none is given a local 'abortGet' is
   *                                 used.
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
      .one('api/v1/raster-aggregates/')
      .withHttpConfig({timeout: localPromise.promise});
  };

  var tooltips = {
    login: gettextCatalog.getString("Inloggen"),
    logout: gettextCatalog.getString("Uitloggen"),
    profile: gettextCatalog.getString("Profiel aanpassen"),
    version: gettextCatalog.getString("Dubbelklik voor de Lizard versie"),
    openMenu: gettextCatalog.getString("Datamenu openen"),
    closeMenu: gettextCatalog.getString("Datamenu sluiten"),
    transparency: gettextCatalog.getString("Transparantie aanpassen"),
    pointTool: gettextCatalog.getString("Puntselectie"),
    lineTool: gettextCatalog.getString("Lijnselectie"),
    areaTool: gettextCatalog.getString("Scherm selectie"),
    resetQuery: gettextCatalog.getString("Resultaatvenster sluiten"),
    zoomInMap: gettextCatalog.getString("Zoom in op de kaart"),
    zoomOutMap: gettextCatalog.getString("Zoom uit op de kaart"),
    zoomInTimeline: gettextCatalog.getString("Zoom in op de tijdlijn"),
    goToNow: gettextCatalog.getString("Ga naar het heden op de tijdlijn"),
    zoomOutTimeline: gettextCatalog.getString("Zoom uit op de tijdlijn"),
    startAnim: gettextCatalog.getString("Start de animatie"),
    stopAnim: gettextCatalog.getString("Stop de animatie"),
    timelineStart: gettextCatalog.getString("Het begin van de huidige tijdlijn"),
    timelineAt: gettextCatalog.getString("Het 'nu' op de tijdlijn"),
    timelineEnd: gettextCatalog.getString("Het einde van de huidige tijdlijn")
  };

  return {
    events: events,
    tooltips: tooltips,
    geocode: geocodeResource,
    raster: rasterResource,
    timeseries: timeseriesResource,
  };
}]);
