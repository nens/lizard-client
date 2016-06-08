
//layer-directive.js

angular.module('data-menu')
.directive('eventseries', ['MapService', function (MapService) {
  var link = function (scope) {


    MapService.eventseries[scope.raster.id] = {
      vector: MapService.initializers.vector(),
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
      delete MapService.eventseries[scope.layer.id];
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
