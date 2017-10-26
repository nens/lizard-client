angular.module('export')
.directive('exportTemporalRasters', ['State', function (State) {

  var link = function (scope) {
    console.log("[F] link");
    console.log("*** All current selections:", State.selections);
    var rasterSelections = _.filter(State.selections, { type: "raster" });
    console.log("*** Got rasterSelections:", rasterSelections);
  };

  return {
    link: link,
    scope: {},
    templateUrl: 'export/export-temporal-rasters.html',
    replace: true,
    restrict: 'E'
  };
}]);