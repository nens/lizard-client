app.controller('TimelineCtrl', function ($scope, $q, $resource) {
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

  $scope.timeline.toggleHideTimeline = function () {
    if ($scope.timeline.hidden) {
      document.getElementById('timeline').removeAttribute('style');
      $scope.timeline.hidden = false;
    } else {
      console.log('-' + $scope.timeline.height + 'px');
      var lower = ($scope.timeline.height > 30) ? $scope.timeline.height + 5: 0;
      document.getElementById('timeline').style.bottom = '-' + lower + 'px';
      $scope.timeline.hidden = true;
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
      zoom: 13};
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
  // TIMELINE END 
});
