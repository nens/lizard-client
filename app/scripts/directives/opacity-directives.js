/**
 * Opacity slider for layer-chooser.
 */
angular.module('lizard-nxt')
  .directive('opacitySlider', function () {
    
  var link = function (scope, element, attrs) {
    var opacity = scope.layergroup.getOpacity();
    scope.percOpacity = opacity * 100;
    
    var localClick;
    var adjustOpacity = function (e) {
      e.preventDefault();
      localClick = e.offsetX;

      if (localClick === undefined) {
        localClick = e.originalEvent.changedTouches[0].offsetX;
      }
      var newOpacity = localClick / 170;
      scope.$apply(function () {
        scope.percOpacity = newOpacity * 100;
      });

      scope.layergroup.setOpacity(newOpacity);

    }

    element.bind('mousedown', adjustOpacity);
  };

  return {
    link: link,
    templateUrl: 'templates/opacity.html',
    restrict: 'E'
  }
});
