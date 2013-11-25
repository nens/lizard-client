app.controller('MapCtrl', function ($scope) {
  $scope.$on('PanZoomeroom', function (message, value) {
    $scope.panZoom = value;
    //console.log('PanZoomeroom', value);
  });

  $scope.switchBaseLayer = function () {
    for (var i in $scope.mapState.baselayers) {
      if ($scope.mapState.baselayers[i].id === $scope.mapState.activeBaselayer) {
        $scope.mapState.baselayers[i].active = true;
      } else {
        $scope.mapState.baselayers[i].active = false;
      }
    }
    if ($scope.box.type === 'landuse' || $scope.box.type === 'elevation') {
      $scope.box.type = 'empty';
    }
    $scope.mapState.baselayerChanged = Date.now(); 
  };

  // Capture keypress. Maybe a features. Now for dev
  $scope.keyPress = function ($event) {
    // Capture both capital and lower case letters
    if ($event.which === 51) {
      $scope.mapState.activeBaselayer = 3;
      $scope.switchBaseLayer();
      $scope.box.type = 'elevation';
    } else if ($event.which === 52) {
      $scope.mapState.activeBaselayer = 4;
      $scope.switchBaseLayer();
      $scope.box.type = 'landuse';
    } else if ($event.which === 49) {
      $scope.mapState.activeBaselayer = 1;
      $scope.switchBaseLayer();
    } else if ($event.which === 50) {
      $scope.mapState.activeBaselayer = 2;
      $scope.switchBaseLayer();
    }

  };

  $scope.toggleLayerGroup = function (layergroup) {
    var grouplayers = layergroup.layers;
    for (var i in grouplayers) {
      for (var j in $scope.mapState.layers) {
        if ($scope.mapState.layers[j].id === grouplayers[i]) {
          $scope.mapState.layers[j].active = layergroup.active;
        }
      }
    }
    $scope.mapState.changed = Date.now();
  };

  // NOTE REFACTOR CANDIDATE
  // use toggleTool() in ng-click in index.html
  $scope.toggleLayerSwitcher = function () {
    if ($scope.mapState.enabled) {
      $scope.mapState.enabled = false;
      $scope.mapState.disabled = true;
    }
    else {
      $scope.mapState.enabled = true;
      $scope.mapState.disabled = false;
    }
  };
  // END REFACTOR CANDIDATE

  $scope.changed = function () {
    $scope.mapState.changed = Date.now();
  };

  $scope.zoomToTheMagic = function (layer) {
    $scope.layerToZoomTo = layer;
    $scope.zoomToLayer = !$scope.zoomToLayer;
  };
});
