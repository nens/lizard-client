//layer-directive.js

angular.module('data-menu')
  .directive("layerChooser", [function () {

  var link = function (scope) {

    // Scope gets the mapState layerGroup, here we create a new layerGroup which
    // goes into its own NxtMap to always be turned on
    scope.showOpacitySlider = true;
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/layer-chooser.html',
    restrict: 'E',
  };
}]);
