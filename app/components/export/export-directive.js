var ASYNC_FORMAT = 'csvzip';

angular.module('export')
.directive('exportSelector', ['$http', 'DataService', 'State', function ($http, DataService, State) {
  var link = function (scope) {
    scope.assets = DataService.assets;

    var start = moment(State.temporal.start);
    var end =  moment(State.temporal.end);
    scope.timestate = {
      start: start.format('L'),
      end: end.format('L')
    };

    scope.taskInfo = {
      url: '',
      id: '',
      downloadUrl: ''
    };

    scope.toExport = {};

    var pollInterval;

    scope.startExport = function () {
      var uuids = _.map(scope.toExport, function (yes, uuid) {
        if (yes) { return uuid; }
      }).join(',');

      scope.loading = true;


      // Request timeseries/data/ with uuids and format=csvzip and async=true

      $http.get('/api/v2/timeseries/data/', {
        params: {
          uuid: uuids,
          start: scope.timestate.start ? parseInt(scope.timestate.start, 10): undefined,
          end: scope.timestate.end ? parseInt(scope.timestate.end, 10): undefined,
          format: ASYNC_FORMAT,
          async: 'true'
        }
      }).then(function (response) {
        scope.taskInfo.url = response.data.task_url;
        pollInterval = setInterval(pollForChange, 500);
      });
    };


    var pollForChange = function () {
      $http.get(scope.taskInfo.url).then(function (response) {
        var status = response.data.task_status;

        if (status === 'SUCCESS') {
          scope.loading = false;
          scope.taskInfo.downloadUrl = response.data.result_url;
        }

        if (status !== 'PENDING') {
          clearInterval(pollInterval);
        }

      });
    };

    var updateDates = function (e) {
      if (e.target.name === 'end') {
        scope.timestate.end = Date.parse(e.date);
      }
      if (e.target.name === 'start') {
        scope.timestate.start = Date.parse(e.date);
      }
    };

    var dateEl = $('#datepicker-export.input-daterange');
    dateEl.datepicker({
      format: 'dd-mm-yyyy'
    });
    dateEl.on('hide', updateDates);


  };

  return {
    link: link,
    scope: {},
    templateUrl: 'export/export-selector.html',
    replace: true,
    restrict: 'E'
  };
}]);
