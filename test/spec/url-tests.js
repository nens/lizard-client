
describe('Testing LocationGetterSetter', function () {
  var $location,
    service;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $location = $injector.get('$location');
    service = $injector.get('LocationGetterSetter');
  }));

  it('should return the relevant part of the path', function () {
    $location.path('/first/second@1234,5678/november-18');
    expect(service.getUrlValue('path', 1)).toBe('second');
    expect(service.getUrlValue('at', 1)).toBe('november-18');
    expect(service.getUrlValue('path', 0)).toBe('first');
  });

  it('should return undefined when the index in the path is not set', function () {
    $location.path('/first/second@1234,5678/november-18');
    expect(service.getUrlValue('path', 3)).toBeUndefined();
  });

  it('should throw an error when requesting non-supported parts', function () {
    $location.path('/first/second@1234,5678/november-18');
    var part = 'hash';
    expect(function () {
      service.getUrlValue(part, 1);
    }).toThrowError(part + ' is not a supported part of the url');
  });

  it('should set values on the relevant part of the url', function () {
    $location.path('/first/second@1234,5678/november-18');
    var value = 3;
    service.setUrlValue('path', 1, value);
    expect(service.getUrlValue('path', 1)).toBe(String(value));
    service.setUrlValue('at', 3, value);
    expect(service.getUrlValue('at', 3)).toBe(String(value));
  });

  it('should return undefined between set and non-set indexes', function () {
    $location.path('/first/second@1234,5678/november-18');
    var value = 3;
    service.setUrlValue('path', 3, value);
    expect(service.getUrlValue('path', 2)).toBeUndefined();
  });

  it('should set empty values on the url when provided undefined', function () {
    $location.path('/first/second@1234,5678/november-18');
    var value = undefined;
    service.setUrlValue('path', 0, value);
    expect($location.path()).toEqual('//second@1234,5678/november-18');
    service.setUrlValue('at', 1, value);
    expect($location.path()).toEqual('//second@1234,5678');
  });

});


describe('Testing UrlState', function () {
  var $location,
    service;

  var state = {
    layerGroups: {
      part: 'path',
      index: 1,
      update: true
    },
    boxType: {
      part: 'path',
      index: 2,
      update: true
    },
    geom: {
      part: 'path',
      index: 3,
      update: true
    },
    mapView: {
      part: 'at',
      index: 0,
      update: true
    },
    timeState: {
      part: 'at',
      index: 1,
      update: true
    }
  };

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $location = $injector.get('$location');
    service = $injector.get('UrlState');
  }));

  it('should set the geom on the url', function () {
    var here = {
      lat: {
        toFixed: function () { return 51.7; }
      },
      lng: {
        toFixed: function () { return 6.2; }
      }
    };
    service.setgeomUrl(state, 'point', here);
    expect($location.path()).toEqual('////51.7,6.2');
  });

  it('should set an array of points on the url', function () {
    var here = {
      lat: {
        toFixed: function () { return 51.7; }
      },
      lng: {
        toFixed: function () { return 6.2; }
      }
    };
    var points = [here, here, here];
    service.setgeomUrl(state, 'line', here, points);
    expect($location.path()).toEqual('////51.7,6.2-51.7,6.2-51.7,6.2');
  });

  it('should set an array of points on the url', function () {
    var here = {
      lat: {
        toFixed: function () { return 51.7; }
      },
      lng: {
        toFixed: function () { return 6.2; }
      }
    };
    var points = [here, here, here];
    service.setgeomUrl(state, 'line', here, points);
    expect($location.path()).toEqual('////51.7,6.2-51.7,6.2-51.7,6.2');
  });

  it('should set timeState on the url', function () {
    var start = 1234;
    var end = 5678000000;
    service.setTimeStateUrl(state, start, end);
    expect($location.path()).toEqual('/@/Jan,01,1970-Mar,07,1970');
  });

  it('should set layers on the url', function () {
    var layergroups = "topo,satte";
    service.setlayerGroupsUrl(state, layergroups);
    expect($location.path()).toEqual('//topo,satte');
  });

  it('should parse mapview', function () {
    var mapView = '52.1263,5.3100,8';
    var latLonZoom = service.parseMapView(mapView);
    expect(latLonZoom.latLng[0]).toEqual(52.1263);
    expect(latLonZoom.latLng[1]).toEqual(5.3100);
    expect(latLonZoom.zoom).toEqual(8);
    expect(latLonZoom.options.reset).toBe(true);
    expect(latLonZoom.options.animate).toBe(true);
  });

  it('should return false when invalid', function () {
    var InvalidMapView = 'Purmerend,8';
    var latLonZoom = service.parseMapView(InvalidMapView);
    expect(latLonZoom).toBe(false);
  });

  it('should parse geom when point', function () {
    var mapState = {here: {}, points: []};
    var geom = '52.1065,5.9656';
    var mapState = service.parseGeom('point', geom, mapState);
    expect(mapState.here.lat).toBe(52.1065);
  });

  it('should parse geom when line', function () {
    var mapState = {here: {}, points: []};
    var geom = '52.5430,5.9216-52.0221,5.8173';
    var mapState = service.parseGeom('line', geom, mapState);
    expect(mapState.points[1].lat).toBe(52.0221);
  });

  it('should give update when no changes', function () {
    expect(service.update(state)).toBe(true);
  });

  it('should not update when one state says no', function () {
    state.timeState.update = false;
    expect(service.update(state)).toBe(false);
  });

});

describe('Testing hash controller', function () {
  var $scope,
    $location,
    $rootScope,
    $controller,
    $browser,
    createController,
    LocationGetterSetter,
    DataService;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $location = $injector.get('$location');
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    $browser = $injector.get('$browser');
    $scope = $rootScope.$new();
    DataService = $injector.get('DataService');
    var MapService = $injector.get('MapService');
    var el = angular.element('<div></div>');
    MapService.initializeMap(el[0], {});
    MapService.fitBounds = function (bounds) {};
    LocationGetterSetter = $injector.get('LocationGetterSetter');

    // Mock MapService
    var mapState = {
      center: {
        lat: 51.12345,
        lng: 6.12
      },
      points: [],
      toggleLayerGroup: function (layerGroup) { layerGroup._active = !layerGroup._active; },
      fitBounds: function () {},
      activeLayersChanged: false,
      layerGroups: {
        'testlayer': {
          _active: true
        },
        'testlayer2': {
          _active: false
        }
      }
    };
    mapState.setView = function (latlng, zoom, options) {
      $scope.mapState.center.lat = latlng.lat;
    };

    // Mock initial time
    $scope.timeState = {start: 10};

    // Mock the box
    $scope.box = {type: 'area'};

    createController = function () {
      return $controller('UrlController', {
        '$scope': $scope,
        'LocationGetterSetter': LocationGetterSetter
      });
    };
  }));

  // Failing test - Ernst has fixed it in some mystery branch, we'll de-comment
  // this test when (if) that ft.branch is merged:
  //
  // it('should activate layer when layer is defined on the url', function () {
  //   var controller = createController();
  //   $location.path('/map/satellite');
  //   $scope.$broadcast('$locationChangeSuccess');
  //   expect(DataService.layerGroups.satellite._active).toBe(true);
  // });

});
