var ASYNC_FORMAT = 'xlsx';

angular.module('export')
.directive('exportSelector',

['$http', 'DataService', 'TimeseriesService', 'notie','gettextCatalog',
 'State', 'user',

function ($http, DataService, TimeseriesService, notie, gettextCatalog,
  State, user) {

  var link = function (scope) {
    // bind the assets with the selected things from the DataService
    scope.assets = DataService.assets;
    scope.isMap = State.context === 'map';

    // Start and end of data
    var timeState = {
      start: new Date(State.temporal.start),
      end: new Date(State.temporal.end)
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

      if (uuids === '') {
        // Don't do anything if no timeseries were selected for export:
        return;
      }

      var params = {
        uuid: uuids,
        start: timeState.start.getTime(),
        end: timeState.end.getTime(),
        format: ASYNC_FORMAT,
        async: 'true'
      };

      if (TimeseriesService.relativeTimeseries.value) {
        params.relative_to = 'surface_level';
      }

      var motherModal = angular.element('#MotherModal');

      var exportCbAuthenticatedUser = function (response) {
        motherModal.modal('hide');
        if (response && response.status === 200) {
          notie.alert(
            4,
            gettextCatalog.getString("Export timeseries started, check your inbox"),
            2
          );
        } else {
          notie.alert(
            3,
            gettextCatalog.getString("Export timeseries failed!"),
            3
          );
        }
      };

      var exportCbUnknownUser = function (response) {

        if (response && response.status === 200) {

          // TODO: make 'domain:port' combo variable
          var downloadUrl = "http://localhost:8000/media/downloads/"
            + response.data.task_id
            + '/timeseries.xlsx';

          angular.element('.start-export-button').addClass('hide');
          angular.element('.download-export-button').removeClass('hide');
          angular.element('.download-export-link').attr('href', downloadUrl);

          // >>> HIER WAS IK! <<<<<<

          // TODO donderdag a.s:

          // Na dat anon op "start export" knop in modal heeft gedrukt:

          // 1a - Toon spinner + tekstje in de modal (bring it back!)
          // 1b - (parallel:) start pollen op achtergrond
          //  2 - Pollen is afgelopen
          // 2a - succes => toon oranje "Download File" knop die href heeft naar de eigenlijke file
          // 2b - error => hide modal, toon notie melding

        } else {
          motherModal.modal('hide');
          notie.alert(
            3,
            gettextCatalog.getString("Dear anon, export timeseries failed!"),
            3
          );
        }
      };

      var exportCb = !user.authenticated
        ? exportCbAuthenticatedUser
        : exportCbUnknownUser;

      // Request timeseries with uuids and format=ASYNC_FORMAT and async=true
      $http.get('/api/v2/timeseries/', { params: params })
        .then(exportCb);
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
