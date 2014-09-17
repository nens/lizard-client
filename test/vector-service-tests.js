describe('Testing VectorService', function () {
  var $scope, $rootScope, VectorService, MapService;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector, $compile) {
    $rootScope = $injector.get('$rootScope');
    VectorService = $injector.get('VectorService');
    MapService = $injector.get('MapService');
  }));

  it('should retrieve data on call.', function () {
    var elem = document.querySelector('body').appendChild(
      document.createElement('div')
      );
    MapService.createMap(elem, {
      bounds: window.data_bounds.all
    });
    MapService.initiateMapEvents();
    var bounds = MapService.mapState.bounds;
    var geom = "POLYGON(("
      + bounds.getWest() + " " + bounds.getSouth() + ", "
      + bounds.getEast() + " " + bounds.getSouth() + ", "
      + bounds.getEast() + " " + bounds.getNorth() + ", "
      + bounds.getWest() + " " + bounds.getNorth() + ", "
      + bounds.getWest() + " " + bounds.getSouth()
      + "))";
    VectorService.getData('jean', geom).then(
      function (response) {
        console.log(response)
      });
    expect(VectorService.dataStore).toBe(undefined);
  });

});