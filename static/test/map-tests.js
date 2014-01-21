// map-tests.js

describe('Testing map directive', function () {

  var $compile, $rootScope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      window.data_bbox = {
        "west": 3.04,
        "east": 7.58,
        "north": 53.63,
        "south": 50.57
      };
    }));

  it('should have loaded leaflet library inside the directive', function() {
    var element = angular.element('<map></map>');
    element = $compile(element)($rootScope);
    expect(element.text()).toEqual('Map data © OpenStreetMap contributors');
  });

  it('should have no layers', function() {
    var element = angular.element('<map></map>');
    element = $compile(element)($rootScope);
    var map = element.scope().map;
    expect(map._layers).toEqual({});
  });

  // TODO: test subdirectives.

});


describe('Testing map subdirectives', function() {

  var $compile, $rootScope;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function(_$compile_, _$rootScope_){
      $compile = _$compile_;
      $rootScope = _$rootScope_;
  }));

  // TODO: test subdirectives.

  /*
  * This testing resulted in a TODO for map directives.
  */
  // it('should have a layerswitcher', function() {
  //   var element = angular.element('<map ng-controller="MasterCtrl" layer-switch layers="mapState.layers"></map>');
  //   element = $compile(element)($rootScope);
  //   scope = element.scope();
  //   scope.$digest();

  //   var layer = scope.mapState.layers[0];
  //   expect(layer.initiated).toEqual(true);
  // });

});