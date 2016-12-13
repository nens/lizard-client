'use strict';
/**
 * Timeseries directive.
 */
angular.module('timeseries')
.directive('timeseries', ['SelectionService', 'TimeseriesService', 'State',
  function (SelectionService, TimeseriesService, State) {
  return {
    link: function (scope) {
      scope.state = State; // TODO: only done this to watch state.layers. There is a better place for this.
      scope.$watch('state.layers', function () { // TODO: There is a better place for this.
        SelectionService.initializeRaster(scope.assetGeom, scope.assetType);
      });

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
          }
      });

    },
    restrict: 'A',
    templateUrl: 'timeseries/timeseries.html',
    scope: true // Share scope with timeseries directive
  };
}]);
