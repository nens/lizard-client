app.controller('TimelineCtrl', function ($scope, $q, $http, CabinetService) {
  // TIMELINE START
  // NOTE: refactor timeline stuff in it's own controller, most stuff is local
  // to timeline scope; only temporalextent should be exposed to master / root

  $scope.timeState.countCurrentEvents = function () {
    for (var key in $scope.timeState.timeline.data) {
      $scope.timeState.timeline.data[key].currentCount = 0;
      for (var j = 0; j < $scope.timeState.timeline.data[key].features.length; j++) {
        var feature = $scope.timeState.timeline.data[key].features[j];
        if (feature.inTempExtent && feature.inSpatExtent) {
          $scope.timeState.timeline.data[key].currentCount++;
        }
      }
    }
  };

  $scope.timeState.toggleTool = function () {
    if ($scope.timeState.timeline.tool === 'zoom') {
      $scope.timeState.timeline.tool = 'brush';
    } else {
      $scope.timeState.timeline.tool = 'zoom';
    }
  };

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

  $scope.timeState.toggleEvents = function (name) {
    if ($scope.timeState.timeline.data[name]) {
      if ($scope.timeState.timeline.data[name].active) {
        $scope.timeState.timeline.data[name].active = false;
      } else { $scope.timeState.timeline.data[name].active = true; }
      $scope.timeState.timeline.changed = !$scope.timeState.timeline.changed;
    } else {
      getEvents(name);
    }
    if ($scope.timeState.hidden !== false) { $scope.toggleTimeline(); }
  };
  
  var getEvents = function (name) {
    $scope.timeState.timeline.data[name] = [];
/*    CabinetService.events.get({
      type: name,
      start: $scope.timeState.start,
      end: $scope.timeState.end,
      extent: $scope.mapState.bounds
      }, function (response) {
        $scope.timeState.timeline.data[name] = response.results[0];
        $scope.timeState.timeline.data[name].count = response.count;
        $scope.timeState.timeline.data[name].active = true;
        $scope.timeState.timeline.changed = !$scope.timeState.timeline.changed;
      }
    );*/
    var url = '/static/data/' + name + '.json';
    $http.get(url)
    .success(function (response) {
      $scope.timeState.timeline.data[name] = response.results[0];
      $scope.timeState.timeline.data[name].count = response.count;
      $scope.timeState.timeline.data[name].active = true;
      $scope.timeState.timeline.changed = Date.now();
    });
  };

  // TIMELINE END 
});
