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

  it('should set box type to line when tool is toggled to line', function () {
    createController();
    $scope.toggleTool('line');
    $scope.$digest();
    expect($scope.box.type).toBe('line');
  });

  it('should set box type to area when tool is toggled to line again', function () {
    createController();
    $scope.toggleTool('line');
    $scope.$digest();
    $scope.toggleTool('line');
    expect($scope.box.type).toBe('area');
  });

});