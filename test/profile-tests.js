// raster-aggregate-tests.js

describe('Testing profile directive', function() {

  // Difficult to test in an isolated way
  // depends on quite a number of stuff.

  var $compile, $rootScope, $httpBackend, element, scope, clickhere, drawLine;
  
  /**
   * Creates a leaflet click event.
   */
  clickhere = function (latlngPoint) {
    scope.map.fireEvent('click', {
      latlng: latlngPoint,
      layerPoint: scope.map.latLngToLayerPoint(latlngPoint),
      containerPoint: scope.map.latLngToContainerPoint(latlngPoint)
    });
    return;
  };

  /**
   * This happens 6 or so times in this test. Best create a function
   */
  drawLine = function () {
    scope.tools.active = 'profile';
    scope.$digest();
    var point = new L.LatLng(51.93694307939275, 5.959932804107666),
        point2 = new L.LatLng(51.93679755726212, 5.959927439689636);
        
    clickhere(point);
    scope.map.fireEvent('mousemove', {
      latlng: point2,
      layerPoint: scope.map.latLngToLayerPoint(point2),
      containerPoint: scope.map.latLngToContainerPoint(point2)
    });
    clickhere(point2);
    return [point, point2];
  }

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function (_$compile_, _$rootScope_, _$httpBackend_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;

    element = angular.element('<div ng-controller="MasterCtrl">'
      +'<map rasterprofile></map></div>');
    element = $compile(element)($rootScope);
    scope = element.scope();

  }));

  it('should register and save first click point', function () {
    scope.tools.active = 'profile';
    scope.$digest();
    var point = new L.LatLng(52.0, 5.3);
        
    clickhere(point);
    expect(scope.first_click).toEqual(point);
  });

  it('should create a draw layer with a svg container', function () {
    scope.tools.active = 'profile';
    scope.$digest();
    var point = new L.LatLng(52.0, 5.3);
        
    clickhere(point);
    var container = scope.line_marker._container;
    expect(container.localName).toBe("g");
  });

  it('should create a lastClick', function () {
    var points = drawLine();
    expect(scope.lastClick).toEqual(points[1]);
  });

  it('should create a polyline layer with a line between two points', function () {
    var points = drawLine();  
    expect(scope.line_marker._latlngs).toEqual(points);
  });

  it('should retrieve data based on the line', function () {
    // Mock the backend for the specific request. The mock data is in mocks.js
    $httpBackend.when('GET', '/api/v1/rasters/?page_size=0&agg=&geom='
      + 'LINESTRING(663456.6849153925+6788731.974905157,663456.087751'
      + '1089+6788705.699676682)&raster_names=elevation&srs=EPSG:3857')
      .respond(rasterMock);
    drawLine();

    scope.$digest();
    $httpBackend.flush();
    expect(scope.box.content.data).toBe(rasterMock);
  });

  it('should remove the line layer after deactivation of tool', function () {
    // first draw the line.
    $httpBackend.when('GET', '/api/v1/rasters/?page_size=0&agg=&geom='
      + 'LINESTRING(663456.6849153925+6788731.974905157,663456.087751'
      + '1089+6788705.699676682)&raster_names=elevation&srs=EPSG:3857')
      .respond('');
    drawLine();

    scope.tools.active = 'none';
    scope.$digest();
    var layers = Object.keys(scope.map._layers);
    var id = scope.line_marker._leaflet_id;
    expect(layers).not.toContain(id.toString());
  });
});
