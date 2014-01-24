app.controller('TimelineCtrl', function ($scope, $q, $resource, $http, CabinetService) {
  // TIMELINE START
  // NOTE: refactor timeline stuff in it's own controller, most stuff is local
  // to timeline scope; only temporalextent should be exposed to master / root


  $scope.timeState.zoomTo = function (geometry) {
    var panZoom = {
      lat: geometry.coordinates[1],
      lng: geometry.coordinates[0],
      zoom: 15
    };
    $scope.panZoom = panZoom;
    $scope.mapState.moved = Date.now();
  };

  $scope.timeState.zoom = {
    in: function () {
      $scope.timeState.zoom.changed = 'in';
    },
    out: function () {
      $scope.timeState.zoom.changed = 'out';
    },
    interval: function (interval) {
      $scope.timeState.interval = interval;
      $scope.timeState.zoom.changed = interval;
    }
  };


  // TIMELINE END 
});
