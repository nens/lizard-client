//layer-directive.js

angular.module('data-menu')
  .directive("layerChooser", [function () {

  var link = function (scope, element, attrs) {

    // Scope gets the mapState layerGroup, here we create a new layerGroup which
    // goes into its own NxtMap to always be turned on
    var layerGroup = scope.layergroup;
    scope.showOpacitySlider = true;

    angular.forEach(layerGroup.mapLayers, function (layer) {
      if (layer.format === 'Vector') {
        element.find('.layer-img')[0].style.backgroundColor = layer.color;
        scope.showOpacitySlider = false;
      }
    });
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/layer-chooser.html',
    restrict: 'E',
  };
}]);
