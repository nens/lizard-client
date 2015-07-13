/**
 * @ngdoc
 * @class regionCtrl
 * @memberOf omnibox
 * @name RegionCtrl
 * @description
 *
 * Reguests data for the active region When box.type is region. Regions are
 * spatial areas such as administrative boundaries or watersheds.
 *
 * Contains data of all active raster layers with an aggregation_type
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
     * Removes data from scope, cancels requests and removes active region from
     * State.
     */
    var rmDataAndRequest = function () {
      DataService.reject('omnibox');
      $scope.box.content = {};
      State.spatial.region = {};
    };


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
        aggWindow: State.temporal.aggWindow
      });

      State.spatial.region = layer.feature;
      $scope.activeName = layer.feature.properties.name;
    };

    /**
     * Makes call to api for regions of the given bounds and zoom and calls
     * NxtRegionsLayer.add function with  response.
     */
    var getRegions = function () {
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

        // If the new regions do not contain the current active region, rm the
        // data  and the references to it.
        if (NxtRegionsLayer.getActiveRegion() !== $scope.activeName) {
          rmDataAndRequest();
        }
      });
    };

    // init
    getRegions();

    /**
     * Updates regions when user moves map.
     */
    $scope.$watch(State.toString('spatial.bounds'), function (n, o) {
      if (n === o) { return true; }
      getRegions();
    });

    /**
     * Updates region data when users changes layers.
     */
    $scope.$watch(State.toString('layerGroups.active'), function (n, o) {
      if (n === o) { return true; }
      getRegions();
    });


    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      rmDataAndRequest();
      NxtRegionsLayer.remove();
    });

  }]);
