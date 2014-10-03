'use strict';

/**
 * @ngdoc
 * @memberOf app
 * @class pointCtrl
 * @name pointCtrl
 * @description point is the contoller of the point template.
 * It gathers all data belonging to a location in space. It becomes active
 * by setting box.type to 'point' and is updated by broadcasting
 * 'newPointActive'. It reads and writes mapState.here.
 *
 * TODO:
 * - [ ] Include the click action on individual events into this paradigm.
 * - [ ] Remove all hardcoded shit. Mirror area and loop through
 *       all layers and perform generic actions based on layer types.
 */

app.controller('PointCtrl', ['$scope', '$filter', 'CabinetService',
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

    var createpoint, fillpoint, _noUTF, utfgridResponded,
        getRasterForLocation, getRasterForLayer, rasterLayerResponded,
        getTimeSeriesForObject, eventResponded, attrsResponded,
        _watchAttrAndEventActivity, _recolorBlackEventFeature;

    /**
     * @function
     * @memberOf app.pointCtrl
     * @description point is the object which holds all data of a point
     * in space. It is updated after a users click. The point
     * may have associated events and timeseries which are requested
     * from the server by the services.
     *
     * @return {object} empty point.
     */
    createpoint = function () {

      var point = {};

      angular.forEach($scope.mapState.layerGroups, function (layerGroup) {

        point[layerGroup.slug] = { active: false };

        angular.forEach(layerGroup._layers, function (layer) {
          point[layerGroup.slug][layer.type] = { data: undefined };
        });
      });

      point.wanted = CabinetService.wantedAttrs;
      return point;
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    fillpoint = function (here) {

      ClickFeedbackService.drawClickInSpace($scope.mapState, here);

      var doneFn = function (response) { // response ::= True | False
      };

      var putDataOnScope = function (response) {

        var pointLG = $scope.point[response.layerGroupSlug];

        if (response.data === null) {

          pointLG.active = false;
          pointLG[response.type].data = undefined;

        } else {

          pointLG.active = true;
          pointLG[response.type].data = response.data;
        }
        console.log('point:', $scope.point);
      };

      angular.forEach($scope.mapState.layerGroups, function (layerGroup) {

        layerGroup.getData({
          geom: here
        })
          .then(doneFn, null, putDataOnScope);

      });
    };

    /**
     * @function
     * @memberOf app.pointCtrl
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
    utfgridResponded = function (here_, showOnlyEvents) {

      return function (response) {

        var here;

        if (!showOnlyEvents) {
          attrsResponded(response, $scope.point);
        }

        // Either way, stop vibrating click feedback.
        ClickFeedbackService.stopVibration();

        if (response && response.data) {

          $scope.point.attrs.active = !showOnlyEvents;

          // Set here to location of object
          var geom = JSON.parse(response.data.geom);
          // Snap the click to the center of the object
          here = {lat: geom.coordinates[1], lng: geom.coordinates[0]};
          // Draw feedback around object.
          ClickFeedbackService.drawGeometry(
            $scope.mapState,
            response.data.geom,
            response.data.entity_name
          );
          var entity = $scope.point.attrs.data.entity_name;
          var id = $scope.point.attrs.data.id;
          // Get events belonging to object.
          if (!showOnlyEvents) {
            EventService.getEvents({object: entity + '$' + id})
              .then(eventResponded);
          }
          // Get timeseries belonging to object.
          getTimeSeriesForObject();
        } else {

          here = here_;

          $scope.point.attrs.active = false;
          // If not hit object, treat it as a rain click, draw rain click
          // arrow.
          ClickFeedbackService.drawArrowHere($scope.mapState, here);
        }
        // Get raster data for the snapped here
        getRasterForLocation(here);
      };
    };

    /**
     * @function
     * @memberOf app.pointCtrl
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
     * @memberOf app.pointCtrl
     * @description Gets a layer and retrieves data based
     * on temporal extent etc.
     * @param  {object} layer Layer object, containing name, slug..
     * @return {void}
     */
    getRasterForLayer = function (layer, here) {
      var stop = new Date($scope.timeState.end),
          start = new Date($scope.timeState.start);
      $scope.point.temporalRaster.aggWindow =
        UtilService.getAggWindow($scope.timeState.start,
                                 $scope.timeState.end,
                                 272);  // graph is 272 px wide
      if (layer.slug === 'rain') {
        RasterService.getTemporalRaster(
          start,
          stop,
          here,
          $scope.point.temporalRaster.aggWindow,
          layer.slug
        )
        .then(rasterLayerResponded)
        .then(function () {
          $scope.point.temporalRaster.type = layer.slug;
          RasterService.getTemporalRaster(
            start,
            stop,
            here,
            $scope.point.temporalRaster.aggWindow,
            layer.slug,
            'rrc')
              .then(function (response) {
                $scope.point.temporalRaster.recurrenceTime = response;
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
     * @memberOf app.pointCtrl
     * @description placeholder for now. Should fill data object
     * with timeseries information. (Draw graphs and such);
     */
    getTimeSeriesForObject = function () {
      // $scope.point.timeseries.data =
      //   TimeseriesService.getRandomTimeseries();
      // $scope.point.timeseries.selectedTimeseries =
      //   $scope.point.timeseries.data[0];
      // $scope.point.timeseries.active = true;
    };

    /**
     * @function
     * @memberOf app.pointCtrl
     *
     * @description fired when event API call responds
     *
     * @param  {object} jsondata response
     */
    eventResponded = function (response, clickedOnEvents) {
      $scope.point.events.data = [];
      angular.forEach(response.features, function (feature) {
        $scope.point.events.data.push(feature.properties);
      });
      if ($scope.point.events.data.length > 0) {
        $scope.point.events.active = true;
        $scope.point.events.activeType = $scope.point.events.data[0].event_series;
        EventService.addColor($scope.events);
      }
      if (clickedOnEvents) {
        $scope.$apply();
      }
    };

    // Create point object and fill on controller creation
    $scope.point = createpoint();
    fillpoint($scope.mapState.here);

    // Update when user clicked again
    $scope.$on('updatepoint', function (msg, extra) {
      fillpoint($scope.mapState.here, extra);
    });

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      ClickFeedbackService.emptyClickLayer($scope.mapState);
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

      for (i = 0; i < data.length; i++) {

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
