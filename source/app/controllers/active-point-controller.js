'use strict';

app.controller('ActivePointCtrl', ["$scope", "$filter", "CabinetService",
    "RasterService", "EventService", "TimeseriesService", "UtilService",
    "ngTableParams", "UtfGridService", "ClickFeedbackService",
  function ($scope,
            $filter,
            CabinetService,
            RasterService,
            EventService,
            TimeseriesService,
            UtilService,
            ngTableParams,
            UtfGridService,
            ClickFeedbackService
  ) {

    /**
     * pointObject is the object which holds all data of a point
     * in space. It is updated after a users click. Commonly set by
     * a click on the utf grid. The pointObject may have associated 
     * events and timeseries which may be requested from the server.
     */
    $scope.pointObject = {
      latlng: $scope.mapState.here,
      details: false, // To display details in the card
      attrs: {
        active: false,
        data: [],
        wanted: CabinetService.wantedAttrs
      },
      rain: {
        active: false,
        start: undefined,
        stop: undefined,
        aggWindow: RasterService.rainInfo.timeResolution,
        data: undefined
      },
      timeseries: {
        active: false,
        data: [],
        selectedTimeseries: null
      },
      events: {
        active: false,
        data: []
      }
    };

    ClickFeedbackService.drawClickInSpace($scope.map, $scope.pointObject.latlng);
    UtfGridService.getDataFromUTF($scope.map, $scope.pointObject.latlng)
    .then(
      function (response) {
        extendDataToPointObject(response);
        // Either way, stop vibrating
        ClickFeedbackService.stopVibration();
        if (response && response.data) {
          ClickFeedbackService.drawGeometry($scope.map, response.data.geom, response.data.entity_name);
        }
      }
    );
    // .then(TimeseriesService.getTimeseries)
    // .then(EventService.getEvents());


    var extendDataToPointObject = function (data) {
      // Return directly if no data is returned from the UTFgrid!
      if (!data.data) { return; }
      angular.extend($scope.pointObject.attrs.data, data.data);
      if (data.data) {
        var geom = JSON.parse(data.data.geom);
        $scope.pointObject.latlng = {lat: geom.coordinates[1], lng: geom.coordinates[0]};
      }
    };


    // RainService.geterain()



    // Get events
    EventService.getEvents({object: $scope.pointObject.attrs.data.entity_name +
                                    '$' +
                                    $scope.pointObject.attrs.data.id})
      .then(function (response) {
        $scope.pointObject.events.data = [];
        angular.forEach(response.features, function (feature) {
          feature.properties.geometry = feature.geometry;
          $scope.pointObject.events.data.push(feature.properties);
        });
        if ($scope.pointObject.events.data.length > 0) {
          EventService.addColor($scope.events);
          $scope.pointObject.events.active = true;
          $scope.pointObject.eventTableParams.reload();
        }
      });

    // Get timeseries
    $scope.pointObject.timeseries.data = TimeseriesService.getRandomTimeseries();
    $scope.pointObject.timeseries.selectedTimeseries = $scope.pointObject.timeseries.data[0];
    $scope.pointObject.timeseries.active = true;
    
    // Get rain
    var aggWindow = UtilService.getAggWindow($scope.timeState.start, $scope.timeState.end, window.innerWidth);
    var callback = function (response) {
      $scope.pointObject.rain.data = response;
      $scope.pointObject.rain.end = $scope.pointObject.rain.data[$scope.pointObject.rain.data.length - 1][0];
      $scope.pointObject.rain.start = $scope.pointObject.rain.data[0][0];
    };
    RasterService.getRain(
      new Date($scope.timeState.start),
      new Date($scope.timeState.end),
      $scope.mapState.here,
      aggWindow
    )
    .then(callback);

    /**
     * Parameters for ngTable.
     *
     * Controls how ngTable behaves. Don't forget to call the reload() method
     * when you refresh the data (like in an API call).
     */
    $scope.pointObject.eventTableParams = new ngTableParams({
      page: 1,
      count: 10,
      sorting: {
        timestamp_start: 'desc'
      }
    }, {
      total: 0,
      groupBy: 'category',
      getData: function ($defer, params) {
        params.total($scope.pointObject.events.data.length);
        params.count($scope.pointObject.events.data.length);
        var data = $scope.pointObject.events.data;
        var orderedData = params.sorting() ?
            $filter('orderBy')(data, params.orderBy()) :
            data;
        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(),
                                          params.page() * params.count()));
      },
    });

    console.log($scope.pointObject);
  }

]);