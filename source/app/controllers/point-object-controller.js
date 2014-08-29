'use strict';

/**
 * @ngdoc
 * @memberOf app
 * @class pointObjectCtrl
 * @name pointObjectCtrl
 * @description pointObject is the contoller of the pointObject template. 
 * It gathers all data belonging to a location in space. It becomes active
 * by setting box.type to 'pointObject' and is updated by broadcasting
 * 'newPointActive'. It reads and writes mapState.here.
 *
 * TODO:
 * - [ ] Include the click action on individual events into this paradigm.
 */

app.controller('pointObjectCtrl', ['$scope', '$filter', 'CabinetService',
    'RasterService', 'EventService', 'TimeseriesService', 'UtilService',
    'UtfGridService', 'ClickFeedbackService',
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

    var createPointObject, fillPointObject, _noUTF, utfgridResponded,
        getRasterForLocation, getRasterForLayer, rasterLayerResponded,
        getTimeSeriesForObject, eventResponded, attrsResponded,
        _watchAttrAndEventActivity, _recolorBlackEventFeature;

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description pointObject is the object which holds all data of a point
     * in space. It is updated after a users click. The pointObject
     * may have associated events and timeseries which are requested
     * from the server by the services.
     * 
     * @return {object} empty pointObject.
     */
    createPointObject = function () {
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

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @param  {L.LatLng} here  
     * @param  {object}   ?extra Optional extra info
     */
    fillPointObject = function (here, extra) {

      var clickedOnEvents = extra && extra.type === 'events';

      if (clickedOnEvents) {
        eventResponded(extra.eventData);
      } else {
        // Give feedback to user
        ClickFeedbackService.drawClickInSpace(here);
      }
      // Get attribute data from utf
      UtfGridService.getDataFromUTF(here)
        .then(utfgridResponded(here, clickedOnEvents), _noUTF)
        .then(function () {
          getRasterForLocation();
        });
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description errorcallback for UTFGrid
     */
    _noUTF = function () {
      ClickFeedbackService.killVibrator();
      ClickFeedbackService.removeLocationMarker();
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description callback for utfgrid
     * @param  {L.LatLng} here
     * @param  {Boolean}  showOnlyEvents if events are clicked
     * @return {function} 
     */
    utfgridResponded = function (here, showOnlyEvents) {
      return function (response) {
        if (!showOnlyEvents) {
          attrsResponded(response, $scope.pointObject);
          ClickFeedbackService.stopVibration();
        } else {
          ClickFeedbackService.stopVibration();
        }

        // Either way, stop vibrating click feedback.

        if (response && response.data) {

          $scope.pointObject.attrs.active = !showOnlyEvents;

          // Set here to location of object
          var geom = JSON.parse(response.data.geom);
          here = {lat: geom.coordinates[1], lng: geom.coordinates[0]};
          // Draw feedback around object.
          ClickFeedbackService.drawGeometry(
            response.data.geom,
            response.data.entity_name
          );
          var entity = $scope.pointObject.attrs.data.entity_name;
          var id = $scope.pointObject.attrs.data.id;
          // Get events belonging to object.
          EventService.getEvents(
            showOnlyEvents ? {} : {object: entity + '$' + id}
          )
          .then(eventResponded);
          // Get timeseries belonging to object.
          getTimeSeriesForObject();
        } else {
          // If not hit object, threaten it as a rain click, draw rain click
          // arrow.
          ClickFeedbackService.drawArrowHere(here);
        }
      };
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description Goes through layers and selects the temporal layer
     * that is active. If there is none, nothing happens.
     * @return {void}
     */
    getRasterForLocation = function () {
      var layer, lIndex, stop, start;
      for (lIndex in $scope.mapState.layers) {
        layer = $scope.mapState.layers[lIndex];
        if (layer.active && layer.temporal) {
          getRasterForLayer(layer);
        }
      }
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description Gets a layer and retrieves data based
     * on temporal extent etc.
     * @param  {object} layer Layer object, containing name, slug..
     * @return {void}
     */
    getRasterForLayer = function (layer) {
      var stop = new Date($scope.timeState.end),
          start = new Date($scope.timeState.start);
      $scope.pointObject.temporalRaster.aggWindow =
        UtilService.getAggWindow($scope.timeState.start,
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
          $scope.pointObject.temporalRaster.type = layer.slug;
          RasterService.getTemporalRaster(
            start,
            stop,
            $scope.mapState.here,
            $scope.pointObject.temporalRaster.aggWindow,
            layer.slug,
            'rrc')
              .then(function (response) {
                $scope.pointObject.temporalRaster.recurrenceTime = response;
              }
          );
        });
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description Sets data attributes if a response returned properly
     * @param  {object} response Response from rasterService. (data-array)
     * @return {void}
     */
    rasterLayerResponded = function (response) {
      $scope.pointObject.temporalRaster.active = true;
      $scope.pointObject.temporalRaster.data = response;
      $scope.pointObject.temporalRaster.end =
        $scope
         .pointObject
         .temporalRaster
         .data[$scope.pointObject.temporalRaster.data.length - 1][0];
      $scope.pointObject.temporalRaster.start =
        $scope.pointObject.temporalRaster.data[0][0];
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description placeholder for now. Should fill data object
     * with timeseries information. (Draw graphs and such);
     */
    getTimeSeriesForObject = function () {
      // $scope.pointObject.timeseries.data =
      //   TimeseriesService.getRandomTimeseries();
      // $scope.pointObject.timeseries.selectedTimeseries =
      //   $scope.pointObject.timeseries.data[0];
      // $scope.pointObject.timeseries.active = true;
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description fired when event API call responds
     * @param  {jsondata} response
     */
    eventResponded = function (response) {
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

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description returns data from UTFgrid
     * @param {jsondata} data 
     */
    attrsResponded = function (data) {
      // Return directly if no data is returned from the UTFgrid
      if (!data.data) { return; }
      angular.extend($scope.pointObject.attrs.data, data.data);
    };

    $scope.pointObject = createPointObject();
    fillPointObject($scope.mapState.here);

    $scope.$on('newPointObject', function (msg, extra) {
      $scope.pointObject = createPointObject();
      fillPointObject($scope.mapState.here, extra);
    });

    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer();
    });



    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description Give the black event circle, if present, it's initial color.
     *
     * @returns {void}
     */
    _recolorBlackEventFeature = function () {

      var feature = d3.select('.highlighted-event');

      if (feature[0][0]) {

        feature
          .classed("highlighted-event", false)
          .attr("fill", feature.attr("data-init-color"));
      }
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description watch function
     */
    _watchAttrAndEventActivity = function (n, o) {

      var checkIfAttrsActive  = $scope.pointObject.attrs.active,
          checkIfEventsActive = $scope.pointObject.events.active;

      if (checkIfEventsActive && !checkIfAttrsActive) {

        // Since we clearly clicked an event feature/circle,
        // we need to kill both the vibrator and the locationmarker:

        ClickFeedbackService.killVibrator();
        ClickFeedbackService.removeLocationMarker();

      } else if (!checkIfEventsActive && checkIfAttrsActive) {

        // Since we clicked on something else than an event
        // circle/feature, we go find the black one and give
        // it it's initial color.

        _recolorBlackEventFeature();
        ClickFeedbackService.removeLocationMarker();

      } else if (!checkIfEventsActive && !checkIfAttrsActive) {

        _recolorBlackEventFeature();
      }
    };

    // efficient $watches using a helper function.
    $scope.$watch('pointObject.attrs.active',  _watchAttrAndEventActivity);
    $scope.$watch('pointObject.events.active', _watchAttrAndEventActivity);

    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return; }

      if (!$scope.pointObject.temporalRaster.active &&
          !$scope.pointObject.attrs.active &&
          !$scope.pointObject.timeseries.active &&
          !$scope.pointObject.events.active) {
        $scope.box.type = 'extentAgg';
        console.log('daar')
      } else {
        $scope.pointObject = createPointObject();
        console.log('hier')
        fillPointObject($scope.mapState.here);
      }
    });

    $scope.mustShowRainCard = RasterService.mustShowRainCard;
  }
]);
