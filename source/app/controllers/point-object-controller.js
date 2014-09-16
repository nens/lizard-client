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
 * - [ ] Remove all hardcoded shit. Mirror extentaggregate and loop through
 *       all layers and perform generic actions based on layer types.
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
          aggWindow: 0,
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
        ClickFeedbackService.emptyClickLayer();
        eventResponded(extra.eventData, clickedOnEvents);
      } else {
        // Give feedback to user
        ClickFeedbackService.drawClickInSpace(here);
        // Get attribute data from utf
        UtfGridService.getDataFromUTF(here)
          .then(utfgridResponded(here, clickedOnEvents), _noUTF(here));
      }

    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description errorcallback for UTFGrid
     */
    _noUTF = function (here) {
      return function () {
        $scope.pointObject.attrs.active = false;
        ClickFeedbackService.drawArrowHere(here);
        getRasterForLocation(here);
      };
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description callback for utfgrid
     * @param  {L.LatLng} here
     * @param  {Boolean}  showOnlyEvents if events are clicked
     *
     * @summary Callback to handle utfGrid responses.
     *
     * @description When utfGrid responded with data, this function tries to
     * get object related data from the server. When an event layer is active,
     * showOnlyEvents is true and no object related data is retrieved from the
     * server.
     *
     * Objected related data retrieved from server:
     *
     * - Timeseries: EventService.getEvents()
     * - Events: getTimeSeriesForObject()
     * @return {function}
     */
    utfgridResponded = function (here, showOnlyEvents) {
      return function (response) {
        if (!showOnlyEvents) {
          attrsResponded(response, $scope.pointObject);
        }

        // Either way, stop vibrating click feedback.
        ClickFeedbackService.stopVibration();

        if (response && response.data) {

          $scope.pointObject.attrs.active = !showOnlyEvents;

          // Set here to location of object
          var geom = JSON.parse(response.data.geom);
          // Snap the click to the center of the object
          here = {lat: geom.coordinates[1], lng: geom.coordinates[0]};
          // Draw feedback around object.
          ClickFeedbackService.drawGeometry(
            response.data.geom,
            response.data.entity_name
          );
          var entity = $scope.pointObject.attrs.data.entity_name;
          var id = $scope.pointObject.attrs.data.id;
          // Get events belonging to object.
          if (!showOnlyEvents) {
            EventService.getEvents({object: entity + '$' + id})
              .then(eventResponded);
          }
          // Get timeseries belonging to object.
          getTimeSeriesForObject();
        } else {
          $scope.pointObject.attrs.active = false;
          // If not hit object, treat it as a rain click, draw rain click
          // arrow.
          ClickFeedbackService.drawArrowHere(here);
        }
        // Get raster data for the snapped here
        getRasterForLocation(here);
      };
    };

    /**
     * @function
     * @memberOf app.pointObjectCtrl
     * @description Goes through layers and selects the temporal layer
     * that is active. If there is none, nothing happens.
     * @return {void}
     */
    getRasterForLocation = function (here) {
      var layer, lIndex, stop, start;
      for (lIndex in $scope.mapState.layers) {
        layer = $scope.mapState.layers[lIndex];
        if (layer.active && layer.temporal) {
          getRasterForLayer(layer, here);
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
    getRasterForLayer = function (layer, here) {
      var stop = new Date($scope.timeState.end),
          start = new Date($scope.timeState.start);
      $scope.pointObject.temporalRaster.aggWindow =
        UtilService.getAggWindow($scope.timeState.start,
                                 $scope.timeState.end,
                                 272);  // graph is 272 px wide
      if (layer.slug === 'demo:radar') {
        RasterService.getTemporalRaster(
          start,
          stop,
          here,
          $scope.pointObject.temporalRaster.aggWindow,
          layer.slug)
          .then(rasterLayerResponded)
          .then(function () {
            $scope.pointObject.temporalRaster.type = layer.slug;
            RasterService.getTemporalRaster(
              start,
              stop,
              here,
              $scope.pointObject.temporalRaster.aggWindow,
              layer.slug,
              'rrc')
                .then(function (response) {
                  $scope.pointObject.temporalRaster.recurrenceTime = response;
                }
            );
          });
      } else {
        RasterService.getTemporalRaster(
          start,
          stop,
          here,
          undefined,
          layer.slug)
          .then(rasterLayerResponded);
      }
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
     *
     * @description fired when event API call responds
     *
     * @param  {object} jsondata response
     */
    eventResponded = function (response, clickedOnEvents) {
      $scope.pointObject.events.data = [];
      angular.forEach(response.features, function (feature) {
        $scope.pointObject.events.data.push(feature.properties);
      });
      if ($scope.pointObject.events.data.length > 0) {
        $scope.pointObject.events.active = true;
        EventService.addColor($scope.events);
      }
      if (clickedOnEvents) {
        $scope.$apply();
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

    // Create point object and fill on controller creation
    $scope.pointObject = createPointObject();
    fillPointObject($scope.mapState.here);

    // Upodate when user clicked again
    $scope.$on('updatePointObject', function (msg, extra) {
      fillPointObject($scope.mapState.here, extra);
    });

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer();
    });

    // efficient $watches using a helper function.
    // TODO: do not watch yourself.
    $scope.$watch('pointObject.attrs.active',  _watchAttrAndEventActivity);
    $scope.$watch('pointObject.events.active', _watchAttrAndEventActivity);

    $scope.$watch('mapState.activeLayersChanged', function (n, o) {
      if (n === o) { return; }

      $scope.pointObject.attrs.active = $scope.mapState.layers.waterchain.active;
      $scope.pointObject.temporalRaster.active = $scope.mapState.layers['demo:radar'].active;
      $scope.pointObject.events.active = $scope.events.data.features.length > 0;

      if (!$scope.pointObject.temporalRaster.active &&
          !$scope.pointObject.attrs.active &&
          !$scope.pointObject.timeseries.active &&
          !$scope.pointObject.events.active) {
        $scope.box.type = 'extentAggregate';
      } else {
        fillPointObject($scope.mapState.here);
      }
    });

    $scope.mustShowRainCard = RasterService.mustShowRainCard;

    /**
     * Format the CSV (exporting rain data for a point in space/interval in
     * time) in a way that makes it comprehensible for les autres.
     *
     */
    $scope.formatCSVColumns = function (data) {

      var i,
          formattedDateTime,
          formattedData = [],
          lat = $scope.$parent.mapState.here.lat,
          lng = $scope.$parent.mapState.here.lng,
          _formatDate = function (epoch) {

            var d = new Date(parseInt(epoch));

            return [
              [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('-'),
              [d.getHours() || "00", d.getMinutes() || "00", d.getSeconds() || "00"].join(':')
            ];
          };

      for (i = 0; i< data.length; i++) {

        formattedDateTime = _formatDate(data[i][0]);

        formattedData.push([
          formattedDateTime[0],
          formattedDateTime[1],
          Math.floor(100 * data[i][1]) / 100 || "0.00",
          lat,
          lng
        ]);
      }

      return formattedData;
    };
  }

]);
