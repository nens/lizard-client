// point-object-ctrl-tests.js

describe('Testing point object controller', function () {
  var $scope,
    $rootScope,
    $controller,
    $q,
    createController,
    UtfGridService,
    ClickFeedbackService

  beforeEach(module('lizard-nxt'));
  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $controller = $injector.get('$controller');
    $q = $injector.get('$q');
    $scope = $rootScope.$new();

    // Mock a map on $scope
    $scope.map = {};
    $scope.mapState = {
      here: {lat: 52, lng: 6}
    };
    UtfGridService = {
      getDataFromUTF: function (map, here) {return $q.defer().promise; }
    };
    ClickFeedbackService = {
      drawClickInSpace: function (map, here) {return true; }
    };

    createController = function () {
      return $controller('pointObjectCtrl', {
          '$scope': $scope,
          'UtfGridService': UtfGridService,
          'ClickFeedbackService': ClickFeedbackService
        });
    };

  }));

  it('should create a pointObject on scope at creation', function () {
    var controller = createController();
    expect($scope.pointObject).toBeDefined();
  });

});
