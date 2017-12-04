angular.module('export')
.directive('exportRasters', ['State', 'DataService', 'user', '$timeout',
function (State, DataService, user, $timeout) {

  function initTimeState () {
    var timeState = {
      start: new Date(State.temporal.start),
      end: new Date(State.temporal.end)
    };

    $timeout(function () {
      var dateEl = $('#datepicker-export-rasters.input-daterange');
      dateEl.datepicker({ format: 'dd-mm-yyyy' });
      dateEl.find('#datepicker-export-start').datepicker(
        'setDate', timeState.start);
      dateEl.find('#datepicker-export-end').datepicker(
        'setDate', timeState.end);
      dateEl.on('hide', function (e) {
        if (e.target.name === 'end')   { timeState.end = new Date(e.date); }
        if (e.target.name === 'start') { timeState.start = new Date(e.date); }
      });
    });

    return timeState;
  }

  function getAllGeoms () {
  };

  function getAllRasters() {
    var uuids = _.map(_.filter(State.layers, { type: 'raster' }), 'uuid');
    var dataLayers = _.find(DataService.dataLayers, function (dataLayer) {

    });
    return uuids;
  }

  var link = function (scope) {
    console.log("[F] linkKkKk");

    scope.data = {};
    var timeState = initTimeState();
    console.log("*** timeState:", timeState);

    scope.isAuthenticated = user.authenticated;
    console.log("*** scope.isAuthenticated:", scope.isAuthenticated);

    scope.allRasters = getAllRasters();
    console.log("*** scope.allRasters:", scope.allRasters);

  };

  return {
    link: link,
    scope: {},
    templateUrl: 'export/export-rasters.html',
    replace: true,
    restrict: 'E'
  };
}]);