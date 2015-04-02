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
              ['$scope', 'DataService', 'State', 'MapService', 'UtilService',
               function ($scope, DataService, State, MapService, UtilService) {

    this.layerGroups = DataService.layerGroups;

    this.toggleLayerGroup = DataService.toggleLayerGroup;

    this.box = State.box;

    this.enabled = false;

    this.state = State.layerGroups;

    // move this function to service.
    this.zoomToBounds = function (spatialBounds, temporalBounds) {

      // zoom to spatial bounds
      MapService.fitBounds(spatialBounds);

      // zoom to temporal bounds
      if (temporalBounds.start !== temporalBounds.end) {
        State.temporal.start = temporalBounds.start;
        State.temporal.end = temporalBounds.end;
        State.temporal.at = temporalBounds.start;
        UtilService.announceMovedTimeline(State);
      }
    };
  }
]);

