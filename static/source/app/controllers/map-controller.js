app.controller('MapCtrl', function ($scope) {
  $scope.$on('PanZoomeroom', function (message, value) {
    $scope.panZoom = value;
    //console.log('PanZoomeroom', value);
  });

  $scope.$watch('mapState.activeBaselayer', function () {
    for (var i in $scope.mapState.baselayers) {
      if ($scope.mapState.baselayers[i].id === $scope.mapState.activeBaselayer) {
        var layer = $scope.mapState.baselayers[i]
      }
    }
      if (layer.name === 'Landgebruik' && layer.active) {
        $scope.box.type = 'landuse';
      } else if (layer.name === 'Landgebruik' && !layer.active) {
        $scope.box.type = 'empty';
      } else if (layer.name === 'Hoogtekaart' && layer.active) {
        $scope.box.type = 'elevation';
      } else if (layer.name === 'Hoogtekaart' && !layer.active) {
        $scope.box.type = 'empty';
      }

  });

  $scope.switchBaseLayer = function () {
    for (var i in $scope.mapState.baselayers) {
      if ($scope.mapState.baselayers[i].id === $scope.mapState.activeBaselayer) {
        $scope.mapState.baselayers[i].active = true;
      } else {
        $scope.mapState.baselayers[i].active = false;
      }
    }
    $scope.mapState.baselayerChanged = Date.now();
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
