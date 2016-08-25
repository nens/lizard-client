var ASYNC_FORMAT = 'csvzip';

angular.module('export')
.directive('exportSelector', ['$http', 'DataService', function ($http, DataService) {
  var link = function (scope) {


    scope.assets = DataService.assets;

    scope.timestate = {
      start: new Date() - 10000,
      end: new Date() - 100
    };

    scope.taskInfo = {
      url: '',
      id: '',
      downloadUrl: ''
    };

    scope.toExport = {};

    scope.startExport = function () {
      var uuids =_.map(scope.toExport, function (yes, uuid) {
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
      });
    };

    var taskDone = scope.$watch('taskInfo.url', function (n) {
      if (n) {
        setInterval(pollForChange, 500);
      }
    });

    var pollForChange = function () {
      $http.get(scope.taskInfo.url).then(function (response) {
        var status = response.data.task_status;
        if (status === 'PENDING') {

        } else if (status === 'DONE') {
          scope.loading = false;
          scope.taskInfo.downloadUrl = response.data.result_url;
          taskDone();
        }
      })
    };

  };

  return {
    link: link,
    scope: {},
    templateUrl: 'export/export-selector.html',
    replace: true,
    restrict: 'E'
  };
}]);
