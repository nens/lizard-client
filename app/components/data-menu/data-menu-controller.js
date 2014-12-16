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
angular.module('lizard-nxt')
  .controller('DatamenuController', ['$scope', 'DataService', 'State',
    function ($scope, DataService, State) {

      this.layerGroups = DataService.layerGroups;

      this.box = State.box;

      this.enabled = false;
    }
  ]);

