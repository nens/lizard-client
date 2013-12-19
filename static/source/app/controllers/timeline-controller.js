app.controller('TimelineCtrl', function ($scope, $q, $resource, $http, CabinetService) {
  // TIMELINE START
  // NOTE: refactor timeline stuff in it's own controller, most stuff is local
  // to timeline scope; only temporalextent should be exposed to master / root

  $scope.$watch('timeline.temporalExtent.changedZoom', function (newVal, oldVal) {
    $scope.timeline.canceler.resolve();
    $scope.timeline.canceler = $q.defer();
    var timeseries = $resource('/api/v1/timeseries/:id/', {
      id: '@id',
      start: '@start',
      end: '@end'
    },
    {get: {method: 'GET', timeout: $scope.timeline.canceler.promise}});
    // commented by arjen to prevent 404s in dev
    //var new_data_get = timeseries.get({
      //id: 3,
      //start: $scope.timeline.temporalExtent.start,
      //end: $scope.timeline.temporalExtent.end
    //}, function(response){
      //$scope.timeseries = response;
      //if ($scope.timeseries.length > 0){
        //$scope.selected_timeseries = response[0];
      //} else {
        //$scope.selected_timeseries = undefined;
      //}
    //});
  });

  $scope.timeline.countCurrentEvents = function () {
    for (var key in $scope.timeline.data) {
      $scope.timeline.data[key].currentCount = 0;
      for (var j = 0; j < $scope.timeline.data[key].features.length; j++) {
        var feature = $scope.timeline.data[key].features[j];
        if (feature.inTempExtent && feature.inSpatExtent) {
          $scope.timeline.data[key].currentCount++;
        }
      }
    }
  };

  $scope.timeline.toggleTool = function () {
    if ($scope.timeline.tool === 'zoom') {
      $scope.timeline.tool = 'brush';
    } else {
      $scope.timeline.tool = 'zoom';
    }
  };

  $scope.timeline.zoomTo = function (geometry) {
    var panZoom = {
      lat: geometry.coordinates[1],
      lng: geometry.coordinates[0],
      zoom: 15};
    $scope.panZoom = panZoom;
    $scope.mapState.moved = Date.now();
  };

  $scope.timeline.zoom = {
    in: function () {
      $scope.timeline.zoom.changed = 'in';
    },
    out: function () {
      $scope.timeline.zoom.changed = 'out';
    },
    interval: function (interval) {
      $scope.timeline.interval = interval;
      $scope.timeline.zoom.changed = interval;
    }
  };

  /**
  * Event enabler
  */
  $scope.toggleTimeline = function () {
    console.log("Timeline is hidden:", $scope.timeline.hidden);
    if ($scope.timeline.hidden) {
      $scope.timeline.hidden = false;
      $scope.timeline.resizeTimeline();
    } else if ($scope.timeline.hidden === false) {
      $scope.timeline.hidden = true;
      $scope.timeline.resizeTimeline();
    } else {
      $scope.timeline.hidden = false;
      document.getElementById('timeline').style.height = '35px';
    }
  };

  $scope.timeline.resizeTimeline = function () {
    console.log("Timeline is hidden:", $scope.timeline.hidden);
    console.log("Timeline is:", $scope.timeline.height);
    if ($scope.timeline.hidden === false) {
      var height = ($scope.timeline.height > 30) ? 35 +$scope.timeline.height: 35;
      document.getElementById('timeline').style.height = height + 'px';
    }
    else { document.getElementById('timeline').style.height = '0'; }
  };

  $scope.timeline.toggleEvents = function (name) {
    if ($scope.timeline.data[name]) {
      if ($scope.timeline.data[name].active) {
        $scope.timeline.data[name].active = false;
      } else { $scope.timeline.data[name].active = true; }
      $scope.timeline.changed = !$scope.timeline.changed;
    } else {
      getEvents(name);
    }
  };
  
  var getEvents = function (name) {
    $scope.timeline.data[name] = [];
/*    CabinetService.events.get({
      type: name,
      start: $scope.timeline.temporalExtent.start,
      end: $scope.timeline.temporalExtent.end,
      extent: $scope.mapState.bounds
      }, function (response) {
        $scope.timeline.data[name] = response.results[0];
        $scope.timeline.data[name].count = response.count;
        $scope.timeline.data[name].active = true;
        $scope.timeline.changed = !$scope.timeline.changed;
      }
    );*/
    var url = (name == 'Twitter') ? '/static/data/twit.json': 'static/data/melding.json';
    $http.get(url)
    .success(function (response) {
      $scope.timeline.data[name] = response.results[0];
      $scope.timeline.data[name].count = response.count;
      $scope.timeline.data[name].active = true;
      $scope.timeline.changed = !$scope.timeline.changed;
    });
  };

  // TIMELINE END 
});
