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
     * Callback for clicks on regions. Calls fillRegion.
     *
     * @param  {leaflet ILayer} layer that recieved the click.
     */
    var clickCb = function (layer) {
      State.spatial.region = layer.feature;
      fillRegion(State.spatial.region);
    };

    /**
     * Calls fillbox of omnibox scope and sets the name of the region on thes
     * scope.
     *
     * @param  {geojson feature object} feature describing the region.
     */
    var fillRegion = function (feature) {
      var HECTARE_IN_M2 = 10000,
      KM2_IN_HECTARE = 100;

      $scope.activeName = feature.properties.name;
      $scope.regionArea = Math.round(feature.properties.area /
                                     HECTARE_IN_M2);

      $scope.fillBox({
        geom_id: feature.id,
        boundary_type: feature.properties.type,
        // apparantly this cannnot be left out because of some type check.
        geom: feature.geometry,
        start: State.temporal.start,
        end: State.temporal.end,
        aggWindow: State.temporal.aggWindow
      })
      // Rain sums are returned as the sum of all pixels. Its is assumed here
      // that pixels are 1 km^2. So we normalize the data to get one dimensional
      // values, rain in mm.
      .then(null, null, function (response) {
        var rain = response.layerSlug === 'rain'
          && $scope.box.content.rain
          && $scope.box.content.rain.layers.rain;
        if (rain) {
          angular.forEach(rain.data, function (value) {
            value[1] = value[1] / $scope.regionArea * KM2_IN_HECTARE;
          });
        }
      });
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

    /**
     * Update box.content when time changed.
     */
    $scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (!State.temporal.timelineMoving) {
        if (State.spatial.region) {
          fillRegion(State.spatial.region);
        }
      }
    });



    // Clean up stuff when controller is destroyed
    $scope.$on('$destroy', function () {
      rmDataAndRequest();
      NxtRegionsLayer.remove();
    });

  }]);
