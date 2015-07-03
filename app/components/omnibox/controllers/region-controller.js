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
angular.module('omnibox')
.controller('RegionCtrl', [

  '$scope',
  'NxtRegionsLayer',
  'State',

  function (

    $scope,
    NxtRegionsLayer,
    State

  ) {

    var clickCb = function (layer) {
      $scope.$apply(function () {
        State.spatial.region = layer.feature;
      });
    };

    NxtRegionsLayer.add(State.spatial.view.zoom, State.spatial.bounds, clickCb);


    /**
     * Updates area when user moves map.
     */
    $scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      NxtRegionsLayer.add(
        State.spatial.view.zoom,
        State.spatial.bounds,
        clickCb
      );
    });

    $scope.$watch(State.toString('spatial.region'), function (n, o) {
      console.log('new', State.spatial.region);
      if (n === o) { return true; }
      $scope.fillBox({
        geom: State.spatial.region.geometry,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: State.temporal.aggWindow
      });
    });

    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      NxtRegionsLayer.remove();
      $scope.box.content = {};
    });

  }]);
