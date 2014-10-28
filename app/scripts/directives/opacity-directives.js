/**
 * Opacity slider for layer-chooser.
 */
angular.module('lizard-nxt')
  .directive('opacitySlider', function () {
    
  var link = function (scope, element, attrs) {
    var opacity = scope.layergroup.getOpacity();
    scope.percOpacity = opacity * 100;
    layerChooserWidth = 170; // chrome is the new IE
    var localClick;

    /**
     * @description captures the location of click
     * and calculates the percentage of the width.
     * @params {event} jQuery event.
     */
    var adjustOpacity = function (e) {
      e.preventDefault();
      localClick = (e.originalEvent.layerX < 0) ? e.offsetX : e.originalEvent.layerX;
      if (localClick === undefined) {
        localClick = e.originalEvent.changedTouches[0].offsetX;
      }
      var newOpacity = localClick / layerChooserWidth;
      scope.$apply(function () {
        scope.percOpacity = newOpacity * 100;
      });

      scope.layergroup.setOpacity(newOpacity);

    }

    element.bind('mouseup', adjustOpacity);
    element.bind('touchend', adjustOpacity);
  };

  return {
    link: link,
    templateUrl: 'templates/opacity.html',
    restrict: 'E'
  }
});
