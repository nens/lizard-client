/**
 * @ngdoc
 * @class areaCtrl
 * @memberOf app
 * @name RegionCtrl
 * @description
 *
 * Reguests data for the active region When box.type is region. Region are
 * spatial areas such as administrative boundaries or watersheds.
 *
 *
 * Contains data of all active layers with an aggregation_type
 *
 */
angular.module('omnibox')
.controller('RegionCtrl', [

  '$scope',
  'NxtRegionsLayer',
  'DataService',
  'State',

  function (

    $scope,
    NxtRegionsLayer,
    DataService,
    State

  ) {

    var clickCb = function (layer) {
      $scope.fillBox({
        geom: layer.feature.geometry,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: State.temporal.aggWindow
      });

      State.spatial.region = layer.feature;
      $scope.activeName = layer.feature.properties.name;
    };

    NxtRegionsLayer.add(
      State.spatial.view.zoom,
      State.spatial.bounds,
      clickCb
    );

    /**
     * Updates regions when user moves map.
     */
    $scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      NxtRegionsLayer.add(
        State.spatial.view.zoom,
        State.spatial.bounds,
        clickCb
      );
    });


    /**
     * Updates region data when users changes layers.
     */
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      NxtRegionsLayer.add(
        State.spatial.view.zoom,
        State.spatial.bounds,
        clickCb
      );
    });


    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      DataService.reject('omnibox');
      $scope.box.content = {};
      State.spatial.region = '';
      NxtRegionsLayer.remove();
    });

  }]);
