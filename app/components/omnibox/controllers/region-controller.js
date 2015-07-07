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
  'CabinetService',
  'NxtRegionsLayer',
  'DataService',
  'State',

  function (

    $scope,
    CabinetService,
    NxtRegionsLayer,
    DataService,
    State

  ) {


    /**
     * Callback for clicks on regions. Calls fillbox of omnibox scope. Sets the
     * clicked region on the State and the name of the region on the scope.
     *
     * @param  {leaflet ILayer} layer that recieved the click.
     */
    var clickCb = function (layer) {
      $scope.fillBox({
        geom: layer.feature.geometry,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: State.temporal.aggWindow,
        type: 'Raster' // Regions only get data for rasters.
      });

      State.spatial.region = layer.feature;
      $scope.activeName = layer.feature.properties.name;
    };

    /**
     * Makes call to api for regions of the given bounds and zoom and calls
     * NxtRegionsLayer.add function with  response.
     */
    var createRegions = function () {
      CabinetService.regions.get({
        z: State.spatial.view.zoom,
        in_bbox: State.spatial.bounds.getWest()
          + ','
          + State.spatial.bounds.getNorth()
          + ','
          + State.spatial.bounds.getEast()
          + ','
          + State.spatial.bounds.getSouth()
      })
      .then(function (regions) {
        NxtRegionsLayer.add(regions.results, clickCb);
      });
    };

    // init
    createRegions();

    /**
     * Updates regions when user moves map.
     */
    $scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      createRegions();
    });


    /**
     * Updates region data when users changes layers.
     */
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      createRegions();
    });


    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      DataService.reject('omnibox');
      $scope.box.content = {};
      State.spatial.region = {};
      NxtRegionsLayer.remove();
    });

  }]);
