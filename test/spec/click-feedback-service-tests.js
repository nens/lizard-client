describe('Testing click feedback service', function () {
  var $rootScope, ClickFeedbackService, mapState;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    ClickFeedbackService = $injector.get('ClickFeedbackService');
    var NxtMap = $injector.get('NxtMap');
    var dataLayers = window.data_layers;
    mapState = new NxtMap(angular.element('<div></div>')[0], dataLayers, {
      zoomControl: false
    });

    mapState.here = L.LatLng(51, 6);
  }));

  it('should create a clicklayer', function () {
    expect(Object.keys(mapState._map._layers).length).toEqual(0);
    ClickFeedbackService.emptyClickLayer(mapState);
    expect(Object.keys(mapState._map._layers).length).toEqual(1);
  });

});
