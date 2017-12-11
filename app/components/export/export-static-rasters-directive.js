angular.module('export')
.directive('exportStaticRasters', ['State', 'DataService',
  'ExportStaticRastersService', 'user', '$timeout', 'UtilService',

function (State, DataService, ExportStaticRastersService, user, $timeout, UtilService) {

  function link () {
    console.log("[F] link");
    var geom = UtilService.lLatLngBoundsToGJ(State.spatial.bounds);
    console.log("*** geom =", geom);
  };

  return {
    link: link,
    scope: {},
    templateUrl: 'export/export-static-rasters.html',
    replace: true,
    restrict: 'E'
  };
}]);