/**
 * @ngdoc
 * @class areaCtrl
 * @memberOf app
 * @name areaCtrl
 * @description
 * area is the object which collects different
 * sets of aggregation data. If there is no activeObject,
 * this is the default collection of data to be shown in the
 * client.
 *
 * Contains data of all active layers with an aggregation_type
 *
 */
angular.module('data-menu')
  .controller('DatamenuController',
              ['$scope', 'DataService', 'State', 'MapService', '$timeout',
               function ($scope, DataService, State, MapService, $timeout) {

    this.layerGroups = DataService.layerGroups;

    this.toggleLayerGroup = DataService.toggleLayerGroup;

    this.box = State.box;

    this.enabled = false;

    this.state = State.layerGroups;

    // move this function to service.
    this.zoomToBounds = function (spatialBounds, temporalBounds) {

    /**
     * Set timeline to moving and back after digest loop to trigger watches
     * that do something after the timeline moved.
     */
    var announceMovedTimeline = function () {
      State.temporal.timelineMoving = true;

      // Set timeline moving to false after digest loop
      $timeout(
        function () {
          State.temporal.timelineMoving = false;
        },
        0, // no delay, fire when digest ends
        true // trigger new digest loop
      );
    };

    // zoom to spatial bounds
    MapService.fitBounds(spatialBounds);

    // zoom to temporal bounds
    if (temporalBounds.start !== temporalBounds.end) {
      State.temporal.start = temporalBounds.start;
      State.temporal.end = temporalBounds.end;
      State.temporal.at = temporalBounds.start;
      announceMovedTimeline();
    }
  };
  }
]);

