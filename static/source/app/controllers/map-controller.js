app.controller('MapCtrl', function ($scope, $location) {

  // document this function
  $scope.$watch('keyPressed', function (newVal, oldVal) {
    if (newVal === 51) {
      $scope.mapState.activeBaselayer = 3;
      $scope.switchBaseLayer();
    } else if (newVal === 52) {
      $scope.mapState.activeBaselayer = 4;
      $scope.switchBaseLayer();
    } else if (newVal === 49) {
      $scope.mapState.activeBaselayer = 1;
      $scope.switchBaseLayer();
    } else if (newVal === 50) {
      $scope.mapState.activeBaselayer = 2;
      $scope.switchBaseLayer();
    } else if (newVal === 53) {
      $scope.events.toggleEvents("Twitter");
    } else if (newVal === 54) {
      $scope.events.toggleEvents("Meldingen");
    }
  });

  $scope.toggleLayerInfo = function (layername) {
    if (layername === 'Hoogtekaart') {
      $scope.keyPressed = 51;
    } else if (layername === 'Landgebruik') {
      $scope.keyPressed = 52;
    }
  };

});
