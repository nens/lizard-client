'use strict';

angular.module('lizard-nxt')
  .service("CabinetService", [
           "$q", "Restangular", "backendDomain", "gettextCatalog",
  function ($q, Restangular, backendDomain, gettextCatalog) {

  var geocodeResource,
      timeseriesResource,
      events,
      wmsGetFeatureInfo;

  // for the wizard demo's
  if (window.location.host === 'nens.github.io' ||
      window.location.host === 'lizard.sandbox.lizard.net') {
    Restangular.setBaseUrl(backendDomain);
    Restangular.setDefaultHttpFields({withCredentials: true});
  }

  timeseriesResource = Restangular.one('api/v2/timeseries/');
  events = Restangular.one('api/v2/events/?page_size=25000');
  var regions = Restangular.one('api/v2/regions/?page_size=100');

  // Wms getFeatureInfo goes through a proxy. Specify url as a param.
  wmsGetFeatureInfo = Restangular.one('proxy/');

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
      .one('api/v2/raster-aggregates/')
      .withHttpConfig({timeout: localPromise.promise});
  };

  /**
   * Create tooltips for the current language.
   *
   * Tooltips are dynamic. When the language changes they have to update. This
   * function fetches the correct values from gettext and return a tooltip
   * object.
   * @return {tooltips} tooltip object with translated tooltips.
   */
  var createTooltips = function () {
    return {
      login: gettextCatalog.getString("Log in"),
      logout: gettextCatalog.getString("Log out"),
      profile: gettextCatalog.getString("Modify profile"),
      version: gettextCatalog.getString(
        "Double click for lizard version number"),
      openMenu: gettextCatalog.getString("Open data menu"),
      closeMenu: gettextCatalog.getString("Close data menu"),
      transparency: gettextCatalog.getString("Adjust opacity"),
      pointTool: gettextCatalog.getString("Point selection"),
      lineTool: gettextCatalog.getString("Line selection"),
      areaTool: gettextCatalog.getString("View selection"),
      resetQuery: gettextCatalog.getString("Close result window"),
      zoomInMap: gettextCatalog.getString("Zoom in on the map"),
      zoomOutMap: gettextCatalog.getString("Zoom out on the map"),
      zoomInTimeline: gettextCatalog.getString("Zoom in on timeline"),
      goToNow: gettextCatalog.getString("Go to the present in timeline"),
      zoomOutTimeline: gettextCatalog.getString("Zoom out of timeline"),
      startAnim: gettextCatalog.getString("Start animation"),
      stopAnim: gettextCatalog.getString("Stop animation"),
      timelineStart: gettextCatalog.getString("Start of current timeline"),
      timelineAt: gettextCatalog.getString("The 'now' of the timeline"),
      timelineEnd: gettextCatalog.getString("End of current timeline")
    };
  };

  return {
    events: events,
    createTooltips: createTooltips,
    geocode: geocodeResource,
    raster: rasterResource,
    timeseries: timeseriesResource,
    wmsGetFeatureInfo: wmsGetFeatureInfo,
    regions: regions
  };
}]);
