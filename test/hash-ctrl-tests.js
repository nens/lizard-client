// hash-ctrl-tests.js

// Preferably these tests also include a test to change the hash
// and check whether the models are updated. TODO.

describe('Testing hash controller', function () {
  var $scope,
    $location,
    $rootScope,
    $controller,
    $browser,
    createController,
    hashSyncHelper;

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    $location = $injector.get('$location');
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    $browser = $injector.get('$browser');
    $scope = $rootScope.$new();
    hashSyncHelper = $injector.get('hashSyncHelper');

    // Mock MapService
    var mockMapService = {
        mapState: {
        center: {
            lat: 51.12345,
            lng: 6.12
          },
        activeLayersChanged: false,
        layers: {
          'testlayer': {
            active: true
          }
        },
      };
    }

    // Mock the mapState
    $scope.mapState = {
      center: {
          lat: 51.12345,
          lng: 6.12
        },
      activeLayersChanged: false,
      layers: {
        'testlayer': {
          active: true
        },
        'testlayer2': {
          active: false
        }
      },
      changeLayer: function (layer) {
        layer.active = !layer.active;
      }
    };

    // Mock initial time
    $scope.timeState = {start: 10};

    createController = function() {
      return $controller('hashGetterSetter', {
          '$scope': $scope,
          'hashSyncHelper': hashSyncHelper,
          'MapService': mockMapService
      });
    };
  }));

  it('should should set location on hash at creation', function () {
    var controller = createController();
    var location = hashSyncHelper.getHash().location;
    expect(location).toBe('51.1234,6.1200,10');
  });

  it('should should set layers on hash at creation', function () {
    var controller = createController();
    var layerHash = hashSyncHelper.getHash().layers;
    expect(layerHash).toBe('testlayer');
  });

  it('should should not have start on hash at creation', function () {
    var controller = createController();
    $scope.$digest();
    var start = hashSyncHelper.getHash().start;
    expect(start).not.toBeDefined();
  });

  it('should should have start on hash after change', function () {
    var controller = createController();
    $scope.timeState.start = 1405086992000; // Fri, 11 Jul 2014 13:56:32 GMT
    $scope.$digest();
    var newStart = hashSyncHelper.getHash().start;
    expect(newStart).toBe('Jul-11-2014');
  });

  it('should set timeState.at between start and end when setting timeState', function () {
    var controller = createController();

    var start = new Date(1408627740686);
    var dateString = start.toDateString()
      .slice(4) // Cut off day name
      .split(' ') // Replace spaces by hyphens
      .join('-');

    hashSyncHelper.setHash({'start': dateString});

    var end = new Date(1408627748686);
    var dateString = start.toDateString()
      .slice(4) // Cut off day name
      .split(' ') // Replace spaces by hyphens
      .join('-');    hashSyncHelper.setHash({'end': dateString});

    $scope.$broadcast('$locationChangeSuccess');

    expect($scope.timeState.at >= $scope.timeState.start
      && $scope.timeState.at <= $scope.timeState.end).toBe(true);
  });

  it('should deactivate layer when layerHash is defined but active layer is not on hash', function () {
    var controller = createController();

    hashSyncHelper.setHash({'layers': 'testlayer2'});

    $scope.$broadcast('$locationChangeSuccess');

    expect($scope.mapState.layers.testlayer.active).toBe(false);
    expect($scope.mapState.layers.testlayer2.active).toBe(true);
  })

});