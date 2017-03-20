'use strict';
/**
 * Timeseries directive.
 */
angular.module('timeseries')
.directive('timeseries', ['TimeseriesService', 'Timeline', 'State',
  function (TimeseriesService, Timeline, State) {
  return {
    link: function (scope) {

      scope.zoomToMagic = function () {
        if (State.context === 'map') {
          if (State.selected.timeseries &&
              State.selected.timeseries.length >= 1) {

            var DEFAULT_AGG_WINDOW = 360000;
            var selectedTsUuid = State.selected.timeseries[0].uuid;
            var selectedTs = _.find(TimeseriesService.timeseries, {
              id: selectedTsUuid });

            if (selectedTs === undefined) {
              console.log("[E] selectedTs === undefined (Skipping further actions...");
              return;
            }

            var start = selectedTs.start;
            var end = selectedTs.end;

            var intialTimelineMoving = State.temporal.timelineMoving;
            State.temporal.timelineMoving = true;
            State.temporal.at = start;
            State.temporal.start = start;
            State.temporal.end = end;

            var aggWindow = Timeline.prototype.hasAggWindow()
              ? Timeline.prototype.getAggWindow()
              : DEFAULT_AGG_WINDOW;

            // Option 1; use Timeline.prototype.Zoomto()
            // => Is this construction responsible for the 'this._svg error'???

            Timeline.prototype.zoomTo(
              State.temporal.start,
              State.temporal.end,
              aggWindow,
              true
            );

            // Option 2: use Timeline.prototype.resize()
            // => Leads to even greater w0rld of pain... x(

            // var dimensions = Timeline.prototype.dimensions;
            // console.log("[dbg] arg 'dimensions':", dimensions);
            // console.log("[dbg] arg 'timestamp':", start);

            // var nEvents = 0;

            // Timeline.prototype.resize(
            //   dimensions,
            //   start,
            //   aggWindow,
            //   nEvents
            // );

            State.temporal.timelineMoving = false;
            State.temporal.timelineMoving = intialTimelineMoving;
          }
        }
      };

      scope.$watch('asset', function () {
        TimeseriesService.initializeTimeseriesOfAsset(scope.asset);
        if (State.context === 'map') {
          scope.timeseries.change();
        }
      });

      scope.$on('$destroy', function () {
        if (State.selected.assets.length > 1 && State.context === 'map') {
          _.forEach(State.selected.timeseries, function (ts) {
            ts.active = false;
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

        State.selected.timeseries.forEach(function (ts) {
          if (_.find(scope.asset.timeseries, {uuid: ts.uuid})) {
            ts.active = ts.uuid === selectedTimeseriesUuid;
          }
        });

        TimeseriesService.syncTime().then(getContentForAsset);

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

        var activeTs = _.find(State.selected.timeseries, {active: true});
        if (activeTs) {
           var tsInAsset = _.find(
            scope.asset.timeseries,
            function (ts) { return ts.uuid === activeTs.uuid;}
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
          TimeseriesService.syncTime().then(getContentForAsset);
          }
      });

    },
    restrict: 'A',
    templateUrl: 'timeseries/timeseries.html',
    scope: true // Share scope with timeseries directive
  };
}]);
