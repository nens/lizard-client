app.controller('TimelineCtrl', function ($scope, $q, $resource, $http, CabinetService) {
  // TIMELINE START
  // NOTE: refactor timeline stuff in it's own controller, most stuff is local
  // to timeline scope; only temporalextent should be exposed to master / root

  $scope.$watch('timeline.temporalExtent.changedZoom', function (newVal, oldVal) {
    $scope.timeState.timeline.canceler.resolve();
    $scope.timeState.timeline.canceler = $q.defer();
    var timeseries = $resource('/api/v1/timeseries/:id/', {
      id: '@id',
      start: '@start',
      end: '@end'
    },
    {get: {method: 'GET', timeout: $scope.timeState.timeline.canceler.promise}});
    // commented by arjen to prevent 404s in dev
    //var new_data_get = timeseries.get({
      //id: 3,
      //start: $scope.timeState.start,
      //end: $scope.timeState.end
    //}, function(response){
      //$scope.timeseries = response;
      //if ($scope.timeseries.length > 0){
        //$scope.selected_timeseries = response[0];
      //} else {
        //$scope.selected_timeseries = undefined;
      //}
    //});
  });

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
      zoom: 15};
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

  /**
  * Event enabler
  */
  $scope.toggleTimeline = function () {
    if ($scope.timeState.hidden) {
      $scope.timeState.hidden = false;
      $scope.timeState.resizeTimeline();
    } else if ($scope.timeState.hidden === false) {
      $scope.timeState.hidden = true;
      $scope.timeState.resizeTimeline();
    } else {
      $scope.timeState.hidden = false;
      document.getElementById('timeline').style.height = '35px';
    }
  };

  $scope.timeState.resizeTimeline = function () {
    document.getElementById('timeline').style.visibility = 'visible';
    if ($scope.timeState.hidden === false) {
      var height = ($scope.timeState.height > 35) ? 35 + $scope.timeState.height: 80;
      document.getElementById('timeline').style.height = height + 'px';
    }
    else { document.getElementById('timeline').style.height = '0'; }
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
    var url = (name == 'Twitter') ? '/static/data/twit.json': 'static/data/melding.json';
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
