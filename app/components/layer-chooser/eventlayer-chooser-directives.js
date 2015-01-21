//layer-directive.js

angular.module('data-menu')
  .directive("eventlayerChooser", [function () {

  var link = function (scope, element) {
    scope.showOpacitySlider = false;
    element.find('.layer-img')[0].style.backgroundColor = scope.layergroup.mapLayers[0].color;
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/eventlayer-chooser.html',
    restrict: 'E',
  };
}]);
