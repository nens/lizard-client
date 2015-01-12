//layer-directive.js

angular.module('data-menu')
.directive("baselayerChooser", ['State', 'LeafletService',
function (State, LeafletService)
{

  var link = function (scope, element, attrs) {
    console.log("[!] Linking start...");

    // ...
    var allBaselayers = State.layerGroups.all;

    console.log("allBaselayers =", allBaselayers);

    console.log("[!] Linking finished.");
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/baselayer-chooser.html',
    restrict: 'E',
  };

}]);
