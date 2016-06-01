
//layer-directive.js

angular.module('data-menu')
.directive('eventseries', ['MapService', function (MapService) {
  var link = function (scope) {


    if (scope.bootstrapLayer) {
      // set atributes to layer, create utf and tms layers.
    } else {
      // get layer config from api.
    }

    MapService.eventseries[scope.raster.slug] = {
      vector: MapService.initializers.vector(),
    };

    scope.toggle = function () {
      scope.eventseries.active = !scope.eventseries.active;
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
      scope.eventseries.opacity = newOpacity;
    };

    scope.$on('$destroy', function () {
      delete MapService.eventseries[scope.eventseries.slug];
    });

  };

  return {
    link: link,
    scope: {
      eventseries: '=',
      bootstrapLayer: '='
    },
    templateUrl: 'data-menu/templates/layer.html',
    restrict: 'E',
  };

}]);
