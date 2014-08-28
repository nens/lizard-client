describe('Testing MasterController', function () {
  var $scope,
    $rootScope,
    $controller,
    createController;

  beforeEach(module('lizard-nxt'));

  beforeEach(inject(function ($injector) {
    $controller = $injector.get('$controller');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    createController = function() {
      $controller('MasterCtrl', {
          '$scope': $scope
      });
      $scope.$digest();
    };

  }));

  it('should set box type to intersect when tool is toggled to intersect', function () {
    createController();
    $scope.toggleTool('intersect');
    $scope.$digest();
    expect($scope.box.type).toBe('intersect');
  });

  it('should set box type to extentAggregate when tool is toggled to intersect again', function () {
    createController();
    $scope.toggleTool('intersect');
    $scope.$digest();
    $scope.toggleTool('intersect');
    expect($scope.box.type).toBe('extentAggregate');
  });

});