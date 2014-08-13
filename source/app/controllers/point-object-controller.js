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
    "UtfGridService", "ClickFeedbackService",
  function ($scope,
            $filter,
            CabinetService,
            RasterService,
            EventService,
            TimeseriesService,
            UtilService,
            UtfGridService,
            ClickFeedbackService
  ) {

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
        temporalRaster: {
          type: undefined,
          active: false,
          start: undefined,
          stop: undefined,
          aggWindow: RasterService.rasterInfo().timeResolution,
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
        }
      };
      return pointObject;
    };

    var fillPointObject = function (map, here, extra) {

      if (extra) {
        if (extra.type === 'events') {
          eventResponded(extra.eventData);
        }
      } else {
        // Give feedback to user
        ClickFeedbackService.drawClickInSpace(map, here);
      }
      // Get attribute data from utf
      UtfGridService.getDataFromUTF(map, here)
        .then(utfgridResponded(map, here))
        .then(function () {
          getRasterForLocation();
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

    /** 
     * Goes through layers and selects the temporal layer
     * that is active. If there is none, nothing happens.
     * @return {void} 
     */
    var getRasterForLocation = function () {
      var layer, lIndex, stop, start;
      for (lIndex in $scope.mapState.layers) {
        layer = $scope.mapState.layers[lIndex];
        if (layer.active && layer.temporal) {
          getRasterForLayer(layer);
        }
      }
    };

    /**
     * Gets a layer and retrieves data based
     * on temporal extent etc.
     * @param  {object} layer Layer object, containing name, slug..
     * @return {void}
     */
    var getRasterForLayer = function (layer) {
      var stop = new Date($scope.timeState.end),
          start = new Date($scope.timeState.start);
      $scope.pointObject.temporalRaster.aggWindow = UtilService.getAggWindow($scope.timeState.start,
                                               $scope.timeState.end,
                                               272);  // graph is 272 px wide
      RasterService.getTemporalRaster(
        start, 
        stop, 
        $scope.mapState.here, 
        $scope.pointObject.temporalRaster.aggWindow, 
        layer.slug)
        .then(rasterLayerResponded)
        .then(function () {
          if (layer.name === "Regen") {
            // TODO: find another way to do this
            $scope.pointObject.temporalRaster.type = 'rain';
            RasterService.getTemporalRaster(start, stop, $scope.mapState.here, $scope.pointObject.temporalRaster.aggWindow, layer.slug, 'rrc')
              .then(function (response) {
                $scope.pointObject.temporalRaster.recurrenceTime = response;
              }
            );
          }
        });
    };

    /**
     * Sets data attributes if a response returned properly
     * @param  {object} response Response from rasterService. (data-array)
     * @return {void}
     */
    var rasterLayerResponded = function (response) {
      $scope.pointObject.temporalRaster.active = true;
      $scope.pointObject.temporalRaster.data = response;
      $scope.pointObject.temporalRaster.end = $scope.pointObject.temporalRaster.data[$scope.pointObject.temporalRaster.data.length - 1][0];
      $scope.pointObject.temporalRaster.start = $scope.pointObject.temporalRaster.data[0][0];
    };

    var getTimeSeriesForObject = function () {
      // $scope.pointObject.timeseries.data = TimeseriesService.getRandomTimeseries();
      // $scope.pointObject.timeseries.selectedTimeseries = $scope.pointObject.timeseries.data[0];
      // $scope.pointObject.timeseries.active = true;
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
      }
    };

    var attrsResponded = function (data) {
      // Return directly if no data is returned from the UTFgrid
      if (!data.data) { return; }
      angular.extend($scope.pointObject.attrs.data, data.data);
    };

    $scope.pointObject = createPointObject();
    fillPointObject($scope.map, $scope.mapState.here);

    $scope.$on('newPointObject', function (msg, extra) {
      $scope.pointObject = createPointObject();
      fillPointObject($scope.map, $scope.mapState.here, extra);
    });

    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer($scope.map);
    });
  }
]);