'use strict';

/**
 * pointObject is the contoller of the pointObject template. It gathers all data
 * belonging to a location in space. It becomes active by setting box.type to
 * 'pointObject' and is updated by broadcasting 'newPointActive'. It reads and
 * writes mapState.here.
 *
 * TODO:
 * - [ ] Include the click action on individual events into this paradigm.
 */

app.controller('pointObjectCtrl', ["$scope", "$filter", "CabinetService",
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
     * Parameters for ngTable.
     *
     * Controls how ngTable behaves. Don't forget to call the reload() method
     * when you refresh the data (like in an API call).
     */
    var eventTableParams = function () {
      return new ngTableParams({
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
    };


    /**
     * pointObject is the object which holds all data of a point
     * in space. It is updated after a users click. The pointObject
     * may have associated events and timeseries which are requested
     * from the server by the services.
     *
     * @return {object} empty pointObject.
     */
    var createPointObject = function () {
      var pointObject = {
        streetview: {
          active: false
        },
        attrs: {
          active: false,
          data: {},
          wanted: CabinetService.wantedAttrs
        },
        rain: {
          active: false,
          start: undefined,
          stop: undefined,
          aggWindow: RasterService.rainInfo.timeResolution,
          data: undefined,
          recurrenceTime: undefined
        },
        timeseries: {
          active: false,
          data: [],
          selectedTimeseries: null
        },
        events: {
          active: false,
          data: []
        },
        eventTableParams: eventTableParams()
      };
      return pointObject;
    };

    var fillPointObject = function (map, here) {
      if (here.type == 'events') {
        eventResponded(here.eventData);
      } else {
        // Give feedback to user
        ClickFeedbackService.drawClickInSpace(map, here);
      }
      // Get attribute data from utf
      UtfGridService.getDataFromUTF(map, here)
        .then(utfgridResponded(map, here))
        .then(function () {
          getRainForLocation();
        });
    };

    var utfgridResponded = function (map, here) {
      return function (response) {
        attrsResponded(response, $scope.pointObject);
        // Either way, stop vibrating click feedback.
        ClickFeedbackService.stopVibration();
        if (response && response.data) {
          $scope.pointObject.attrs.active = true;
          // Set here to location of object
          var geom = JSON.parse(response.data.geom);
          here = {lat: geom.coordinates[1], lng: geom.coordinates[0]};
          // Draw feedback around object.
          ClickFeedbackService.drawGeometry(map, response.data.geom, response.data.entity_name);
          var entity = $scope.pointObject.attrs.data.entity_name;
          var id = $scope.pointObject.attrs.data.id;
          // Get events belonging to object.
          EventService.getEvents({object: entity + '$' + id})
            .then(eventResponded);
          // Get timeseries belonging to object.
          getTimeSeriesForObject();
        } else {
          // If not hit object, threaten it as a rain click, draw rain click arrow.
          ClickFeedbackService.drawArrowHere(map, here);
        }
      };
    };

    var getRainForLocation = function () {
      var stop = new Date($scope.timeState.end);
      var start = new Date($scope.timeState.start);
      $scope.pointObject.rain.aggWindow = UtilService.getAggWindow($scope.timeState.start,
                                               $scope.timeState.end,
                                               272);  // graph is 272 px wide
      RasterService.getRain(start, stop, $scope.mapState.here, $scope.pointObject.rain.aggWindow)
        .then(rainResponded)
        .then(function () {
          // TODO: this is now an extra call to get rain recurrence time
          // refactor to one call
          RasterService.getRain(start, stop, $scope.mapState.here, $scope.pointObject.rain.aggWindow, 'rrc')
            .then(function (response) {
              $scope.pointObject.rain.recurrenceTime = response;
            }
          );
        });
    };

    var getTimeSeriesForObject = function () {
      // $scope.pointObject.timeseries.data = TimeseriesService.getRandomTimeseries();
      // $scope.pointObject.timeseries.selectedTimeseries = $scope.pointObject.timeseries.data[0];
      // $scope.pointObject.timeseries.active = true;
    };

    var rainResponded = function (response) {
      $scope.pointObject.rain.active = true;
      $scope.pointObject.rain.data = response;
      $scope.pointObject.rain.end = $scope.pointObject.rain.data[$scope.pointObject.rain.data.length - 1][0];
      $scope.pointObject.rain.start = $scope.pointObject.rain.data[0][0];
    };

    var eventResponded = function (response) {
      $scope.pointObject.events.data = [];
      angular.forEach(response.features, function (feature) {
        feature.properties.geometry = feature.geometry;
        $scope.pointObject.events.data.push(feature.properties);
      });
      if ($scope.pointObject.events.data.length > 0) {
        $scope.pointObject.events.active = true;
        EventService.addColor($scope.events);
        $scope.pointObject.eventTableParams.reload();
      }
    };

    var attrsResponded = function (data) {
      // Return directly if no data is returned from the UTFgrid
      if (!data.data) { return; }
      angular.extend($scope.pointObject.attrs.data, data.data);
    };

    $scope.pointObject = createPointObject();
    fillPointObject($scope.map, $scope.mapState.here);

    $scope.$on('newPointObject', function () {
      $scope.pointObject = createPointObject();
      fillPointObject($scope.map, $scope.mapState.here);
    });

    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer($scope.map);
    });
  }
]);