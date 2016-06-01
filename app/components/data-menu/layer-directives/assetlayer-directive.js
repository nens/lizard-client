//layer-directive.js

angular.module('data-menu')
.directive('assetlayer', ['MapService', function (MapService) {
  var link = function (scope) {


    if (scope.bootstrapLayer) {
      // set atributes to layer, create utf and tms layers.
    } else {
      // get layer config from api.
    }

    MapService.assets[scope.asset.slug] = {
      tms: MapService.initializers.tms(),
      utf: MapService.initializers.utf()
    };

    scope.toggle = function () {
      scope.asset.active = !scope.asset.active;
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
      scope.asset.opacity = newOpacity;
    };

    scope.$on('$destroy', function () {
      delete MapService.assets[scope.assets.slug];
    });

  };

  return {
    link: link,
    scope: {
      asset: '=',
      bootstrapLayer: '='
    },
    templateUrl: 'data-menu/templates/layer.html',
    restrict: 'E',
  };

}]);
