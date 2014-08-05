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

    // Mock a map on $scope
    $scope.map = {
      getCenter: function () { 
        return {
          lat: 51.12345,
          lng: 6.12
        };
      },
      getZoom: function () {
        return 10;
      }
    };

    // Mock the mapState
    $scope.mapState = {
      activeLayersChanged: false,
      layers: {
        'testlayer': {
          active: true
        }
      },
    };

    // Mock initial time
    $scope.timeState = {start: 10};

    createController = function() {
      return $controller('hashGetterSetter', {
          '$scope': $scope,
          'hashSyncHelper': hashSyncHelper
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

});