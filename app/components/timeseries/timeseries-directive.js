'use strict';
/**
 * Timeseries directive.
 */
// TODO: THIS IS ONE IN FOUR FILES THAT NEEDS SCRUTINY

angular.module('timeseries')
.directive('timeseries', [
  '$timeout',
  'gettextCatalog',
  'notie',
  'SelectionService',
  'State',
  'TimeseriesService',
  function (
    $timeout,
    gettextCatalog,
    notie,
    SelectionService,
    State,
    TimeseriesService
  ) {
  return {
    link: function (scope) {
      scope.state = State; // TODO: only done this to watch state.layers. There is a better place for this.
      var selectionObject, selectionType;
      if (scope.asset) {
        selectionObject = scope.asset;
        selectionType = 'asset';
      } else if (scope.geom){
        selectionObject = scope.geom;
        selectionType = 'geom';
      }
      scope.$watch('state.layers', function () { // TODO: There is a better place for this.
        SelectionService.initializeRaster(selectionObject, selectionType);
      });

      scope.zoomToInterval = function (value_type, intervalText) {

        // return early - if the timeseries consists of images
        if (value_type === 'image') {
          notie.alert(3,
            gettextCatalog.getString(
              "Timeseries with images cannot be zoomed to."
            )
          );
          return;
        }

        // return early - if we're not in map ctx
        // return early - if we don't have a timeseries selected
        if (!(State.context === 'map' &&
              State.selections &&
              State.selections.length >= 1)) {
          return;
        }

        var now = (new Date()).getTime();
        var start, end, intervalMs;
        switch(intervalText) {
          case "one_year":
            intervalMs = 31536000000; // one year in ms
            end = now;
            start = end - intervalMs;
            break;
          case "three_months":
            intervalMs = 7884000000; // three months in ms (avg)
            end = now;
            start = end - intervalMs;
            break;
          case "two_weeks":
            intervalMs = 1209600000; // two weeks in ms
            end = now;
            start = end - intervalMs;
            break;
          case "timesteps_range":

            var activeTsUUID = _.find(State.selections,
              { active: true }).timeseries;

            var activeTs = _.find(TimeseriesService.timeseries,
              { id: activeTsUUID });

            start = activeTs.start;
            end = activeTs.end;

            // If start and end are at the same point in time (i.e. we have a
            // timeseries with only a single measured value), we "pad" the space
            // to have decent visualization.
            if (start === end) {
              var defaultAggWindow = 3600000; // 1 hour, in ms
              var aggWindow = State.temporal.aggWindow || defaultAggWindow;
              end = start + aggWindow * 10;
            }

            break;
          default:
            console.error(
              "Unknown interval '" +
              intervalText +
              "' for temporal zoom; allowed values are " +
              "'one_year', 'three_months', 'two_weeks' and 'timesteps_range'"
            );
        }

        // We toggle State.temporal.timelineMoving to trigger the correct
        // angular $watch in the timeline-directive.
        State.temporal.timelineMoving = !State.temporal.timelineMoving;
        State.temporal.at = start;
        State.temporal.start = start;
        State.temporal.end = end;

        $timeout(function () {
          // We reset State.temporal.timelineMoving (a-sync, compliant with
          // angular $digest cycle).
          State.temporal.timelineMoving = !State.temporal.timelineMoving;
        });
      };

      scope.$watch(selectionType, function () {
        SelectionService.initializeAsset(scope.asset);
        SelectionService.initializeRaster(selectionObject, selectionType);
        if (State.context === 'map') {
          scope.timeseries.change();
        }
      });

      scope.$on('$destroy', function () {
        if (State.assets.length > 1 && State.context === 'map') {
          _.forEach(State.selections, function (selection) {
            selection.active = false;
          });
          TimeseriesService.syncTime();
        }
      });
    },
    restrict: 'E', // Timeseries can be an element with single-select or
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
        });

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

      scope.$watch('asset', function (aG) {
        if(scope.asset) {

          var setFirstTSAsSelected = function () {
            scope.timeseries.selected = scope.asset.timeseries[0];
          };

          var activeSelections = _.find(State.selections, {active: true});
          if (activeSelections) {
            var tsInAsset = _.find(
              scope.asset.timeseries,
              function (selection) {
                return selection.timeseries === activeSelections.timeseries;
              }
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

        }});

      /**
       * Get new ts when time changes
       */
      scope.$watch('timeState.timelineMoving', function (newValue, oldValue) {
        if (!newValue && newValue !== oldValue) {
          _.forEach(TimeseriesService.syncTime(),
            function (tsPromise) {
              tsPromise.then(getContentForAsset);
          });
          }
      });

    },
    restrict: 'A',
    templateUrl: 'timeseries/timeseries.html',
    scope: true // Share scope with timeseries directive
  };
}]);
