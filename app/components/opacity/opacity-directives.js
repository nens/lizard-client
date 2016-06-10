/**
 * Opacity slider for layer-chooser.
 */
angular.module('data-menu')
  .directive('opacitySlider', ['MapService', function (MapService) {

  var link = function (scope, element, attrs) {
    var opacity = scope.layer.opacity;
    scope.percOpacity = opacity * 100 + '%';
    var layerChooserWidth = 170; // chrome is the new IE
    var localClick;

    /**
     * @description captures the location of click
     * and calculates the percentage of the width.
     * @params {event} jQuery event.
     */
    scope.adjustOpacity = function (e) {
      e.preventDefault();
      localClick = (e.originalEvent.layerX < 0) ? e.offsetX : e.originalEvent.layerX;
      if (localClick === undefined) {
        localClick = e.originalEvent.changedTouches[0].offsetX;
      }
      var newOpacity = localClick / layerChooserWidth;
      scope.$apply(function () {
        scope.percOpacity = newOpacity * 100 + '%';
      });

      scope.layer.opacity = newOpacity;
      MapService.update();
    };

  };

  return {
    link: link,
    templateUrl: 'opacity/opacity.html',
    scope: { layer: '=' },
    restrict: 'E',
    replace: true
  };
}]);
