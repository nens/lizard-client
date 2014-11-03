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

    createController = function () {
      $controller('MasterCtrl', {
        '$scope': $scope
      });

      $scope.mapState.getActiveTemporalLayerGroup = function () {};

      $scope.$digest();
    };

  }));

  it('should set box type to line when tool is toggled to line', function () {
    createController();
    $scope.toggleTool('line');
    $scope.$digest();
    expect($scope.box.type).toBe('line');
  });

  it('should set box type to point when tool is toggled to point again', function () {
    createController();
    $scope.toggleTool('line');
    $scope.$digest();
    $scope.toggleTool('point');
    expect($scope.box.type).toBe('point');
  });

});