app.controller('MapCtrl', function ($scope, $location) {

  $scope.$on('PanZoomeroom', function (message, value) {
    $scope.panZoom = value;
    //console.log('PanZoomeroom', value);
  });

  //NOTE: rewrite baseLayers to same concept as toggleTool so you don't have to
  // keep active state per layer, only check the active layer, the rest is not
  // active per definition
  //
  // pass layername / id as argument to function
  // switchBaseLayer can be called from ng-click event
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
    if ($scope.mapState.activeBaselayer === 3) {
      $scope.box.type = 'elevation';
    } else if ($scope.mapState.activeBaselayer === 4) {
      $scope.box.type = 'landuse';
    }
    $scope.mapState.baselayerChanged = Date.now();
  };

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


  $scope.zoomToTheMagic = function (layer) {
    $scope.layerToZoomTo = layer;
    $scope.zoomToLayer = !$scope.zoomToLayer;
  };
});
