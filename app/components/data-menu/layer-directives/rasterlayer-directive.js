//layer-directive.js

angular.module('data-menu')
.directive('rasterlayer', ['MapService', function (MapService) {
  var link = function (scope) {


    if (scope.bootstrapLayer) {
      // set atributes to layer, create utf and tms layers.
    } else {
      // get layer config from api.
    }

    var wms;

    if (scope.raster.temporal) {
      wms = MapService.initializers.temporalWms();
    } else {
      wms = MapService.initializers.wms();
    }

    MapService.rasters[scope.raster.slug] = {
      temporal: false,
      wms: wms,
    };

    scope.toggle = function () {
      scope.raster.active = !scope.raster.active;
    };

    /**
     * @function
     * @param {float} new opacity value
     * @return {void}
     * @description Changes opacity.
     */
    scope.setOpacity = function (newOpacity) {
      if (typeof newOpacity !== 'number' ||
          newOpacity < 0 && newOpacity > 1) {
        throw new Error(newOpacity + "is not a valid opacity value, it is"
          + "either of the wrong type or not between 0 and 1");
      }
      scope.raster.opacity = newOpacity;
    };

    scope.$on('$destroy', function () {
      delete MapService.rasters[scope.assets.slug];
    });

  };

  return {
    link: link,
    scope: {
      raster: '=',
      bootstrapLayer: '='
    },
    templateUrl: 'data-menu/templates/layer.html',
    restrict: 'E',
  };

}]);
