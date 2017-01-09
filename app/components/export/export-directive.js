var ASYNC_FORMAT = 'xlsx';

angular.module('export')
.directive('exportSelector', ['$http', 'DataService', 'TimeseriesService',
'State', function ($http, DataService, TimeseriesService, State) {

  var link = function (scope) {
    // bind the assets with the selected things from the DataService
    scope.assets = DataService.assets;
    scope.isMap = State.context === 'map';

    // Start and end of data
    var timeState = {
      start: new Date(State.temporal.start),
      end: new Date(State.temporal.end)
    };

    // Will be populated with the startExport function
    scope.taskInfo = {
      url: '',
      id: '',
      downloadUrl: ''
    };

    // Contains the selected timeseries to export
    scope.toExport = {};

    /**
     * startExport - Finds all the timeseries and gets the uuids
     * requests a ASYNC_FORMAT task to be setup for these uuids. The API returns a
     * link to see status updates of the task
     */
    scope.startExport = function () {
      var uuids = _.map(scope.toExport, function (yes, uuid) {
        if (yes) { return uuid; }
      }).join(',');

      // spinner
      scope.loading = true;

      var params = {
        uuid: uuids,
        start: timeState.start.getTime(),
        end: timeState.end.getTime(),
        format: ASYNC_FORMAT,
        async: 'true'
      };

      if (TimeseriesService.relativeTimeseries) {
        // params.relative_to = 'surface_level';
        params.relative_to = 'filter_bottom_level';
      }

      // Request timeseries/data/ with uuids and format=ASYNC_FORMAT and async=true
      $http.get('/api/v2/timeseries/data/', {
        params: params
      }).then(function (response) {
        scope.taskInfo.url = response.data.task_url;
      });
    };

    /**
     * pollForChange - Checks if the task is done: 'SUCCES', waiting: 'PENDING',
     * or failed: 'FAILED'
     *
     */
    var pollForChange = function () {
      $http.get(scope.taskInfo.url).then(function (response) {
        var status = response.data.task_status;
        if (status === 'SUCCESS') {
          scope.loading = false;
          scope.taskInfo.downloadUrl = response.data.result_url;
        }
      });
    };

    /**
     * updateDates - updates the start and end according to the datepicker
     *
     * @param  {object} e eventObject that the datepicker sends
     */
    var updateDates = function (e) {
      if (e.target.name === 'end') {
        timeState.end = new Date(e.date);
      }
      if (e.target.name === 'start') {
        timeState.start = new Date(e.date);
      }
    };

    // initialize the datepicker
    var dateEl = $('#datepicker-export.input-daterange');
    dateEl.datepicker({
      format: 'dd-mm-yyyy'
    });
    // bind the hide event to updateDates
    dateEl.on('hide', updateDates);

    // initialize the datepicker with the right dates
    dateEl.find('#datepicker-export-start').datepicker(
      'setDate', timeState.start);
    dateEl.find('#datepicker-export-end').datepicker(
      'setDate', timeState.end);
  };

  return {
    link: link,
    scope: {},
    templateUrl: 'export/export-selector.html',
    replace: true,
    restrict: 'E'
  };
}]);
