/**
 * Opacity slider for layer-chooser.
 */
angular.module('data-menu')
  .directive('opacitySlider', function () {

  var link = function (scope, element, attrs) {
    var opacity = scope.layergroup.getOpacity();
    scope.percOpacity = opacity * 100 + '%';
    var layerChooserWidth = 170; // chrome is the new IE
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
        scope.percOpacity = newOpacity * 100 + '%';
      });

      scope.layergroup.setOpacity(newOpacity);

    };

    element.bind('click', adjustOpacity);
    element.bind('touch', adjustOpacity);
  };

  return {
    link: link,
    templateUrl: 'opacity/opacity.html',
    restrict: 'E',
    replace: true
  };
});
