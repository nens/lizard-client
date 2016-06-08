//layer-directive.js

angular.module('data-menu')
.directive('assetlayer', ['MapService', function (MapService) {
  var link = function (scope) {

    MapService.assets[scope.layer.id] = {
      tms: MapService.initializers.tms(),
      utf: MapService.initializers.utf()
    };

    scope.toggle = function () {
      scope.layer.active = !scope.layer.active;
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
      scope.layer.opacity = newOpacity;
    };

    scope.$on('$destroy', function () {
      delete MapService.assets[scope.layers.id];
    });

  };

  return {
    link: link,
    scope: {
      layer: '=',
      bootstrapLayer: '='
    },
    templateUrl: 'data-menu/templates/layer.html',
    restrict: 'E',
  };

}]);
