//layer-directive.js

angular.module('data-menu')
.directive('wmslayer', ['MapService', function (MapService) {
  var link = function (scope) {

    if (scope.bootstrapLayer) {
      // set atributes to layer, create utf and tms layers.
    } else {
      // get layer config from api.
    }

    MapService.wms[scope.wms.slug] = {
      wms: MapService.initializers.wms(),
    };

    scope.toggle = function () {
      scope.wms.active = !scope.wms.active;
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
      delete MapService.wms[scope.wms.slug];
    });

  };

  return {
    link: link,
    scope: {
      wms: '=',
      bootstrapLayer: '='
    },
    templateUrl: 'data-menu/templates/layer.html',
    restrict: 'E',
  };

}]);
