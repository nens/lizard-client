// Directive for the 'export timeseries modal'
// -------------------------------------------
// Exporting timeseries can happen in two distinct manners:
//
// 1) When a user is logged in: the a-sync task started in the backend results
//    in a message being sent to the users' inbox, which she has available in
//    the webbrowser;
//
// 2) When a user is not logged in: the a-sync task started in the backend can
//    not have the user notified because the user doen't have an inbox
//    available. The strategy for solving this problem is to have the JS poll
//    the server until the file is actually finished (WIP...).

var ASYNC_FORMAT = 'xlsx';

angular.module('export')
.directive('exportSelector',

['$http', 'DataService', 'TimeseriesService', 'notie','gettextCatalog',
 'State', 'RelativeToSurfaceLevelService', 'user', 'ExportService',

function ($http, DataService, TimeseriesService, notie, gettextCatalog,
  State, RTSLService, user, ExportService) {

  var link = function (scope) {
    // bind the assets with the selected things from the DataService
    scope.assets = DataService.assets;
    scope.isMap = State.context === 'map';
    scope.isAuthenticated = user.authenticated;

    var POLL_INTERVAL = 1000;

    // var EXPORT_START_MESSAGE =
    //   "Export timeseries started, check your inbox"; // user is authenticated
    // var EXPORT_SUCCESS_MESSAGE =
    //   "Export timeseries finished succesfully"; // user is NOT authenticated
    // var EXPORT_ERROR_MESSAGE =
    //   "Lizard encountered a problem exporting your timeseries";

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

      if (RTSLService.get()) {
        params.relative_to = 'surface_level';
      }

      var motherModal = angular.element('#MotherModal');

      // scope.resultUrl: holds the location for the downloadable file
      scope.resultUrl = null;

      // Update a single GUI component:
      var hideExportButton = function () {
        angular.element('.start-export-button').addClass('hide');
      };

      // Update a single GUI component:
      var showDownloadButton = function () {
        angular.element('.download-export-button').removeClass('hide');
      };

      // Update a single GUI component:
      var enableDownloadButton = function () {
        angular.element('.download-export-button').prop('disabled', false);
      };

      // Update a single GUI component:
      var disableDownloadButton = function () {
        angular.element('.download-export-button').prop('disabled', true);
      };

      /**
       * pollForFile - Here the actual polling happens: an unauthenticated user
       *               can download an exported timeseries only this way, since
       *               this user does not have an inbox to receive notifications.
       *
       * @param {object} taskResponseData - The non-meta part of the response of
       *                                    the task server. Contains an URL which
       *                                    can be queried periodically ("polling")
       *                                    to check whether the task already
       *                                    finished, and, if so, was succesful.
       */
      var pollForFile = function (taskResponseData) {

        ExportService.setIsPolling(true);
        scope.resultUrl = null;

        hideExportButton();
        disableDownloadButton();
        showDownloadButton();

        var poller = setInterval(function () {

          $http.get(taskResponseData.url).then(function (response) {

            if (response.data.task_status === 'SUCCESS') {

              // Apparently, the task (=exporting timeseries) resulted in a
              // downloadable file: we need to stop polling the server now.

              ExportService.setIsPolling(false);
              clearInterval(poller);

              var resultUrl = response.data.result_url;
              var fileExtension = _.last(resultUrl.split('.'));

              if (fileExtension === ASYNC_FORMAT) {

                scope.resultUrl = resultUrl;

                // The downloadable file is of the expected filetype, so we
                // enable the button so the user can actually download the
                // file.

                enableDownloadButton();

                notie.alert(4,
                  gettextCatalog.getString("Export timeseries finished succesfully."), 2);

              } else {

                // Apparently, the task (=exporting timeseries) crashed in the
                // back-end...

                // NB! Crashing timeseries export can lead to a mysterious
                // result: the exported file becomes a JSON file with a
                // stacktrace generated by the Django code, ending in something
                // like: "TSocket read 0 bytes"

                scope.resultUrl = null;
                motherModal.modal('hide');
                notie.alert(3,
                  gettextCatalog.getString("Lizard encountered a problem exporting your timeseries."), 3);
              }
            }
          });
        }, POLL_INTERVAL);
      };


      /**
       * downloadFinishedFile - Function to launch the "file download" window
       *                        in the browser (so users can download their
       *                        exported timeseries).
       */
      scope.downloadFinishedFile = function () {
        motherModal.modal('hide');
        var win = window.open(scope.resultUrl, '_blank');
        win.focus();
      };

      /**
       * exportCbAuthenticatedUser - Callback for when the task endpoint gets
       *                             queried (e.g. when exporting a timeseries)
       *                             by a user that is logged in: when the task
       *                             server is finished preparing the file with
       *                             the exported timeseries the user requested,
       *                             the user gets notified with a message in
       *                             it's "inbox".
       *
       * @param {object} response - Server response, with the actual data to be
       *                            found in response.data (all other keys are
       *                            for request metadata)
       */
      var exportCbAuthenticatedUser = function (response) {
        motherModal.modal('hide');
        if (response && response.status === 200) {
          notie.alert(4, gettextCatalog.getString("Export timeseries started, check your inbox."), 2);
        } else {
          notie.alert(3, gettextCatalog.getString("Lizard encountered a problem exporting your timeseries."), 3);
        }
      };

      /**
       * exportCbUnknownUser - Callback for when the task endpoint gets queried
       *                       (e.g. when exporting a timeseries) by a user that
       *                       is not logged in.
       *
       * @param {object} response - Server response, with the actual data to be
       *                            found in response.data (all other keys are
       *                            for request metadata)
       */
      var exportCbUnknownUser = function (response) {
        if (response && response.status === 200) {
          pollForFile(response.data);
        } else {
          motherModal.modal('hide');
          notie.alert(3, gettextCatalog.getString("Lizard encountered a problem exporting your timeseries."), 3);
        }
      };

      // We decide which of two callback functions should be used after querying
      // the task endpoint based upon whether the user is logged in or not:
      var exportCb = scope.isAuthenticated
        ? exportCbAuthenticatedUser
        : exportCbUnknownUser;

      // Request timeseries with uuids and format=ASYNC_FORMAT and async=true
      $http.get('/api/v3/timeseries/', { params: params })
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
