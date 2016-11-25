/**
 * Opacity slider for layer-chooser.
 */
angular.module('data-menu')
  .directive('opacitySlider', ['MapService', 'VectorizedRasterService',
    function (MapService, VectorizedRasterService) {

  var link = function (scope, element, attrs) {

    scope.getWidth = function () {
      return scope.layer.opacity * 100 + '%';
    };

    /**
     * @description captures the location of click
     * and calculates the percentage of the width.
     * @params {event} jQuery event.
     */
    scope.adjustOpacity = function (e) {
      e.preventDefault();

      var localClick = e.offsetX;
      var layerChooserWidth = element.width();
      var newOpacity = localClick / layerChooserWidth;
      scope.layer.opacity = newOpacity;
      MapService.updateLayers([scope.layer]);
      VectorizedRasterService.setOpacity(scope.layer.uuid, newOpacity);
      VectorizedRasterService.updateLayer(scope.layer);
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
