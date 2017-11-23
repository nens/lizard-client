'use strict';

angular.module("omnibox")
.directive("omnibox", ['$window', '$document', 'State', 'user', '$timeout', 'TimeseriesService', 'RelativeToSurfaceLevelService', 'ChartCompositionService', 'AssetService', 'SelectionService',
  function ($window, $document, State, user, $timeout, TimeseriesService, RTSLService, ChartCompositionService, AssetService, SelectionService) { return {

    /**
     * Keeps omnibox size in check and creates and maintains a scrollbar.
     */
    link: function (scope, element) {

      var KeyCodes = {
        BACKSPACE: 8,
        SPACE: 32,
        ESC: 27,
        UPARROW: 38,
        DOWNARROW: 40,
        RETURNKEY: 13
      };

      scope.zoomToInterval = TimeseriesService.zoomToInterval;
      scope.relativeToSurfaceLevel = RTSLService.get;

      scope.toggleRelativeTimeseries = function () {
        RTSLService.toggle();
        TimeseriesService.syncTime();
      };

      scope.onFocus = function(item, $event) {
        item.selected = "selected";
        if (item.hasOwnProperty('formatted_address')) {
          scope.zoomToSpatialResultWithoutClearingSeach(item);
        }
        if (item.hasOwnProperty('entity_url')) {
          scope.zoomToSearchResultWithoutClearingSearch(item);
        }
      };

      scope.selectItem = function($event, result, spatialOrSearchMode) {
        var e = $event;
        switch (e.keyCode) {
          case KeyCodes.RETURNKEY:
            if (spatialOrSearchMode === 'spatial') {
              scope.zoomToSpatialResult(result);
            } else {
              scope.zoomToSearchResult(result);
            }
        }
      };

      scope.onKeydown = function($event) {
        var e = $event;
        var $target = $(e.target);
        var tabIncrement;
        switch (e.keyCode) {
          case KeyCodes.ESC:
            $target.blur();
            scope.cleanInputAndResults();
            return;
          case KeyCodes.UPARROW:
            tabIncrement = -1;
            break;
          case KeyCodes.DOWNARROW:
            tabIncrement = 1;
            break;
          default:
            return;
        }

        var resultCount = 0;
        if (scope.omnibox.searchResults.spatial) {
          resultCount += scope.omnibox.searchResults.spatial.length;
        }
        if (scope.omnibox.searchResults.api) {
          resultCount += scope.omnibox.searchResults.api.length;
        }
        if (scope.omnibox.searchResults.temporal) {
            resultCount += scope.omnibox.searchResults.temporal.length;
        }

        var newTabIndex = parseInt($target.attr('tabindex')) + tabIncrement;
        if (newTabIndex > resultCount) {
          newTabIndex = 1;
        } else if (newTabIndex < 1) {
          newTabIndex = resultCount;
        }

        $timeout(function() { $('[tabindex=' + newTabIndex + ']').focus(); });
      };

      scope.showAnnotations = function () {
        return (
          user.authenticated &&
          (State.assets.length || State.annotations.active) &&
          (scope.omnibox.data.geometries.length +
           scope.omnibox.data.assets.length) < 2
        );
      };

      // In pixels
      var SEARCHBAR_FROM_TOP = 50;
      var TIMLINE_BOTTOM_MARGIN = 0;
      var OMNIBOX_BOTTOM_MARGIN = 0;
      var OMNIBOX_TOP_MARGIN = 0;

      var cards = element.find('#cards');

      window.Ps.initialize(cards[0], {
        suppressScrollX: true
      });

      /**
       * Sets the height of the scroll area to fit between search box and
       * timeline and updates PerfectScroll.
       */
      var setMaxHeight = function () {
        var tlHeight = $document.find('#timeline').height()
          + TIMLINE_BOTTOM_MARGIN;
        var maxHeight = $window.innerHeight
          - SEARCHBAR_FROM_TOP
          - OMNIBOX_BOTTOM_MARGIN
          - OMNIBOX_TOP_MARGIN;
        maxHeight = maxHeight - tlHeight;

        cards.css('max-height', maxHeight + 'px');
        window.Ps.update(cards[0]);
      };

      // Its is not necassary to set height exactly when digest loops, as long
      // as it occasionally happens and it should not block the ui.
      var WAIT = 300; // min ms to wait between calling throttled.
      var throttled = _.throttle(setMaxHeight, WAIT, {trailing: true});

      /**
       * Update scroll bar on every digest since we do not know about timelines
       * and searchresults and who knows.
       */
      scope.$watch(throttled);

      scope.$watch(State.toString('context'), function (n) {
        if (n === "dashboard") {
          State.selections.forEach(function (selection) {
            var nextIdx = ChartCompositionService.getChartIndexForSelection(selection.uuid);
            selection.active = nextIdx !== -1;
          });
        }
      });

      scope.$watch(State.toString('geometries'), function (n, o) {
        n = JSON.parse(n).map(JSON.stringify);
        o = JSON.parse(o).map(JSON.stringify);

        ///////////////////////////////////////////////////////////////////////
        // 1) Check whether we need to delete selections/composedCharts based on
        //    the new value for State.geometries:
        //
        //    => ForEach geom that is in "o" and not in "n" we need to remove
        //       the corresponding selections AND composedCharts

        var removedGeomObj,
            addedGeomObj,
            coordString,
            keepSelections = [];

        o.forEach(function (str) {
          if (n.indexOf(str) === -1) {
            removedGeomObj = JSON.parse(str);
            coordString = removedGeomObj.geometry.coordinates[0]
              + ","
              + removedGeomObj.geometry.coordinates[1];
            // We throw away selections for the old/discarded geometry, and also
            // remove them from the ChartComposition:
            State.selections.forEach(function (selection) {
              if (selection.geom === coordString) {
                ChartCompositionService.removeSelection(selection.uuid);
              } else {
                keepSelections.push(selection);
              }
            });
            State.selections = keepSelections;
          }
        });

        ///////////////////////////////////////////////////////////////////////
        // 2) Adding geometries - For the detected new geom, we need to add a
        //    raster-selection for each active temporal raster. This can be done
        //    via the SelectionService.

        n.forEach(function (str) {
          if (o.indexOf(str) === -1) {
            addedGeomObj = JSON.parse(str);
            SelectionService.initializeRaster(addedGeomObj, "geom");
          }
        });
      });

      // Cancel throttled function and rm scroll bar.
      scope.$on('$destroy', function () {
        throttled.cancel();
        window.Ps.destroy(cards[0]);
      });

      scope.assetIsNested = function (asset) {
        return AssetService.isNestedAsset(asset.entity_name);
      };
    },

    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/omnibox.html'
  };

}]);
