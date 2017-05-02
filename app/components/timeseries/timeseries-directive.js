'use strict';
/**
 * Timeseries directive.
 */
    // TODO: THIS IS ONE IN FOUR FILES THAT NEEDS SCRUTINY

angular.module('timeseries')
.directive('timeseries', ['TimeseriesService', 'State', '$timeout', 'gettextCatalog', 'notie',
  function (TimeseriesService, State, $timeout, gettextCatalog, notie) {
  return {
    link: function (scope) {
      scope.state = State; // TODO: only done this to watch state.layers. There is a better place for this.
      scope.$watch('state.layers', function () { // TODO: There is a better place for this.
        SelectionService.initializeRaster(scope.assetGeom, scope.assetType);
      });

      scope.zoomToMagic = function (value_type) {

        // For the DDSC-only "timeseries-with-images" we currently not support
        // zooming to the data. Since this data is not available locally/in
        // dev, because Ijkeldijk never payed for this new functionality, I
        // cannot *guarantee* it's correct working. In theory, though, it should
        // already work as-is.
        //
        // However, when we can have our (read: Roel's) shared data set
        // updated to contain at least one timeseries with images I'll be more
        // than happy to build it.
        if (value_type === 'image') {
          notie.alert(3,
            gettextCatalog.getString(
              "Timeseries with images cannot be zoomed to."
            )
          );
          return;
        }

        if (State.context === 'map' &&
            State.selected.timeseries &&
            State.selected.timeseries.length >= 1) {

          var activeTsUUID = _.find(State.selected.timeseries,
            { active: true }).uuid;
          var activeTs = _.find(TimeseriesService.timeseries,
            { id: activeTsUUID });

          // We toggle State.temporal.timelineMoving to trigger the correct
          // angular $watch in the timeline-directive.
          State.temporal.timelineMoving = !State.temporal.timelineMoving;

          var start = activeTs.start;
          var end = activeTs.end;

          // If start and end are at the same point in time (i.e. we have a
          // timeseries with only a single measured value), we "pad" the space
          // to have decent visualization.
          if (start === end) {
            var defaultAggWindow = 3600000; // 1 hour, in ms
            var aggWindow = State.temporal.aggWindow || defaultAggWindow;
            end = start + aggWindow * 10;
          }

          State.temporal.at = start;
          State.temporal.start = start;
          State.temporal.end = end;

          $timeout(function () {
            // We reset State.temporal.timelineMoving (a-sync, compliant with
            // angular $digest cycle).
            State.temporal.timelineMoving = !State.temporal.timelineMoving;
          });
        }
      };

      scope.$watch("assetGeom", function () {
        if (scope.assetType === 'asset'){
          SelectionService.initializeAsset(scope.assetGeom);
        }
        SelectionService.initializeRaster(scope.assetGeom, scope.assetType);
        if (State.context === 'map') {
          scope.timeseries.change();
        }
      });

      scope.$on('$destroy', function () {
<<<<<<< HEAD

        if (State.assets.length > 1 && State.context === 'map') {
          _.forEach(State.selections, function (selection) {
            selection.active = false;
=======
        if (State.selected.assets.length > 1 && State.context === 'map') {
          _.forEach(State.selected.timeseries, function (ts) {
            ts.active = false;
>>>>>>> master
          });
          TimeseriesService.syncTime();
        }
      });
    },
    restrict: 'E',  // Timeseries can be an element with single-select or
                    // multi select as an attribute or without in which
                    // case it only sets the color and order of timeseries of
                    // new assets.
    scope: true // Share scope with select directive
  };
}]);

/**
 * Timeseries directive.
 */
angular.module('timeseries')
.config([ // stop the sanitation -- > SO: http://stackoverflow.com/questions/15606751/angular-changes-urls-to-unsafe-in-extension-page
  '$compileProvider',
  function($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|http):/);
  }])


.directive('timeseriesSingleSelect', ['$http', 'State', 'TimeseriesService',
  'gettextCatalog', 'notie',
  function ($http, State, TimeseriesService, gettextCatalog, notie) {
  return {
    link: function (scope) {

      var selectTimeseries = function () {
        var selectedTimeseriesUuid = scope.timeseries.selected.uuid;

        State.selections.forEach(function (selection) {
          if (_.find(scope.asset.timeseries, {uuid: selection.timeseries})) {
            selection.active = selection.timeseries === selectedTimeseriesUuid;
          }
        });

        _.forEach(TimeseriesService.syncTime(),
            function (tsPromise) {
              tsPromise.then(getContentForAsset);
        })

      };

      var getContentForAsset = function (timeseries) {
        scope.content = timeseries.filter(function (ts) {
          return _.some(scope.asset.timeseries, {uuid: ts.id});
        });
      };

      scope.timeseries = {
        selected: {uuid: 'empty'},
        change: function () {
          selectTimeseries();
        }
      };

      scope.$watch('asset', function () {

        var setFirstTSAsSelected = function () {
          scope.timeseries.selected = scope.asset.timeseries[0];
        };

        var activeSelections = _.find(State.selections, {active: true});
        if (activeSelections) {
           var tsInAsset = _.find(
            scope.asset.timeseries,
            function (selection) { return selection.timeseries === activeSelections.timeseries;}
          );
          if (tsInAsset) {
            scope.timeseries.selected = tsInAsset;
          }
          else {
            setFirstTSAsSelected();
          }
        }
        else {
          setFirstTSAsSelected();
        }

        scope.timeseries.change();

      });

      /**
       * Get new ts when time changes
       */
      scope.$watch('timeState.timelineMoving', function (newValue, oldValue) {
        if (!newValue && newValue !== oldValue) {
<<<<<<< HEAD
          _.forEach(TimeseriesService.syncTime(),
            function (tsPromise) {
              tsPromise.then(getContentForAsset);
          });
          scope.startDownload = function(){
            $http.get('/api/v2/timeseries/data/', {
                params: {
                  uuid: scope.timeseries.selected.uuid,
                  start: Math.round(scope.timeState.start),
                  end: Math.round(scope.timeState.end),
                  format: 'xlsx',
                  async: 'true'
                }
              }).then(function(response) {
                notie.alert(
                  4,
                  gettextCatalog.getString(
                    "Preparing xlsx for timeseries " +
                    scope.timeseries.selected.name +
                    ". You will be notified when ready."),
                  3
                );
              },
              function(error) {
                notie.alert(
                  3,
                  gettextCatalog.getString(
                    "Oops! Something went wrong while preparing the " +
                    "xlsx for the timeseries " +
                    scope.timeseries.selected.name + "."),
                  3
                );
              });
            };
=======
          TimeseriesService.syncTime().then(getContentForAsset);
>>>>>>> master
          }
      });

    },
    restrict: 'A',
    templateUrl: 'timeseries/timeseries.html',
    scope: true // Share scope with timeseries directive
  };
}]);
