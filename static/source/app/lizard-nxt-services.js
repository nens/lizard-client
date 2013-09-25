var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("CabinetService", ["$resource", "$rootScope",
  function ($resource, $rootScope) {

  var layergroups = window.layerGroups;
  var layers = window.layers;
  var baselayers = window.baseLayers;

  var searchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups,
      timeseriesLocationObjectResource,
      timeseriesResource;
  
  searchResource = $resource('/api/v1/search/');
  geocodeResource = $resource('/api/v1/geocode/');
  reverseGeocodeResource = $resource('/api/v1/reversegeocode/');
  timeseriesLocationObjectResource = $resource('/api/v1/timeseries/?object=:object_type$:id', {
    object_type: '@object_type',
    id: '@id',
  });
  // timeseriesResource = $resource('/api/v1/timeseries/:id/', {
  //   id: '@id'
  // });
  timeseriesResource = $resource('/static/data/tijdserie.json', {
    id: '@id'
  });

  //NOTE: what does this do? Try to get rid of it
  $rootScope.$broadcast('LayersRetrieved');

  return {
    layergroups: layergroups,
    layers: layers,
    baselayers: baselayers,
    search: searchResource,
    geocode: geocodeResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    timeseriesLocationObject: timeseriesLocationObjectResource,
    panZoom: null
  };
}]);



//NOTE this seems like a superfluous service; let's try to get rid of it
services.service("Omnibox", [function () {
  var box = {
    query: null,
    disabled: false,
    showCards: false,
    type: 'empty',
    content: 'empty',
    changed: Date.now()
  };

  // TODO: These functions should go to the directive
  box.open = function (type) {
    box.type = type;
    box.showCards = true;
  };

  box.close = function () {
    box.type = 'empty';
    box.showCards = false;
  };

  box.get_profile = function () {
    return "ok";
  };

  return box;
}]);

services.service("KpiService", function () {

   // helper var for watch expressions
  var kpichanged = true;
  // later read this dynamically from source (database)
  var thresholds = {'warning': 7, 'error': 5};
  var categories = ['tevredenheid_burger',
                    'toestand_infrastructuur',
                    'omgevingseffect',
                    'goed_gebruik',
                    'planrealisatie'];

  // temporary lookup table for display names
  var cat_dict = { 'tevredenheid_burger': 'Tevredenheid',
                   'toestand_infrastructuur': 'Toestand',
                   'omgevingseffect': 'Omgevingseffect',
                   'goed_gebruik': 'Gebruik',
                   'planrealisatie': 'Planrealisatie'};


  var kpiData = {};
  var areadata = {};
  // this is for the geojson selector
  var slct_area = null;

  return {
    kpichanged: kpichanged,
    thresholds: thresholds,
    categories: categories,
    cat_dict: cat_dict,
    kpiData: kpiData,
    areadata: areadata,
    slct_area: slct_area
  };
});
