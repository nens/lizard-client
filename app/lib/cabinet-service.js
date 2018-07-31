'use strict';

/**
 * This mythical portal goes back to the early days of lizard-client. It never
 * had a clear scope, but it should function as a simple wrapper around
 * endpoints. Abstracting away api versions and backend location.
 *
 * NOTE this service also includes tooltips used in element titles.
 * NOTE not all lizard resources are queried through this service.
 */
angular.module('lizard-nxt')
  .service("CabinetService", [
           "$q", "Resource", "backendDomain", "gettextCatalog",
  function ($q, Resource, backendDomain, gettextCatalog) {

  // for the wizard demo's
  if (window.location.host === 'nens.github.io' ||
      window.location.host === 'lizard.sandbox.lizard.net') {
    Resource.setBaseUrl(backendDomain);
    Resource.setDefaultHttpFields({withCredentials: true});
  }

  var timeseriesResource = new Resource.Endpoint('api/v3/timeseries/');
  var regions = new Resource.Endpoint('api/v3/regions/?page_size=500');

  // Wms getFeatureInfo goes through a proxy. Specify url as a param.
  var wmsGetFeatureInfo = new Resource.Endpoint('proxy/');

  var geocodeResource = new Resource.Endpoint('api/v3/geocode/');

  /**
   * Raster resource, last stop to the server
   * @param  {object} q             a promise to cancel previous requests
   *                                 if none is given a local 'abortGet' is
   *                                 used.
   *                                 At the next request without a promise, the
   *                                 abortGet is cancelled.
   * @return {Resource}  a gettable resource
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
    return new Resource.Endpoint('api/v3/raster-aggregates/');
  };

  var rasterInfoResource = new Resource.Endpoint('api/v3/rasters/?page_size=500');

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
      timelineEnd: gettextCatalog.getString("End of current timeline"),
      openTimeline: gettextCatalog.getString("Open timeline"),
      closeTimeline: gettextCatalog.getString("Close timeline")
    };
  };

  return {
    createTooltips: createTooltips,
    geocode: geocodeResource,
    raster: rasterResource,
    rasterInfo: rasterInfoResource,
    timeseries: timeseriesResource,
    wmsGetFeatureInfo: wmsGetFeatureInfo,
    regions: regions
  };
}]);
