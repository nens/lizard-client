'use strict';
/**
 * Timeseries directive.
 */

angular.module('timeseries')
.directive('timeseries', [
  '$timeout',
  'gettextCatalog',
  'notie',
  'ChartCompositionService',
  'SelectionService',
  'State',
  'TimeseriesService',
  function (
    $timeout,
    gettextCatalog,
    notie,
    ChartCompositionService,
    SelectionService,
    State,
    TimeseriesService
  ) {
  return {
    link: function (scope) {
      scope.zoomToInterval = TimeseriesService.zoomToInterval;
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

      scope.$watch(selectionType, function (a, b) {
        SelectionService.initializeAsset(scope.asset);
        SelectionService.initializeRaster(selectionObject, selectionType);
        if (State.context === 'map') {
          scope.timeseries.change();
        }
      });

      scope.$on('$destroy', function () {
        if (State.assets.length > 1 && State.context === 'map') {
          _.forEach(State.selections, function (selection) {
            // ... omitting selection deactivation ... skip'm!
            // selection.active = false;
            // ChartCompositionService.removeSelection(selection.uuid);
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
  'gettextCatalog', 'notie', 'ChartCompositionService',
  function ($http, State, TimeseriesService, gettextCatalog, notie, ChartCompositionService) {
  return {
    link: function (scope) {

      var selectTimeseries = function () {
        var selectedTimeseriesUuid = scope.timeseries.selected.uuid;

        State.selections.forEach(function (selection) {
          if (_.find(scope.asset.timeseries, {uuid: selection.timeseries})) {
            selection.active = selection.timeseries === selectedTimeseriesUuid;
            if (selection.active) {
              ChartCompositionService.addSelection(null, selection.uuid);
            } else {
              ChartCompositionService.removeSelection(selection.uuid);
            }
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
