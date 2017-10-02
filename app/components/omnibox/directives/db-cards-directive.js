
angular.module('omnibox')
  .directive('dbCards', [
    'State',
    'SelectionService',
    'DragService',
    'gettextCatalog',
    'notie',
    'getNestedAssets',
    'TimeseriesService',
    'DBCardsService',
    'ChartCompositionService',
    '$timeout',
    function (
      State,
      SelectionService,
      DragService,
      gettextCatalog,
      notie,
      getNestedAssets,
      TimeseriesService,
      DBCardsService,
      ChartCompositionService,
      $timeout) {
  return {
    link: function (scope, element) {

      DragService.create();

      // var emulateClick = function (el) {
      //   console.log("[F] emulateClick");
      //   console.log("*** arg 'el':", el);
      //   // other plottable item. Toggle on drag to put element in their own
      //   // plot.
      //   var sourceElem = $(element.find('#' + el.getAttribute('data-uuid')))[0];
      //   console.log("*** sourceElem:", sourceElem);

      //   debugger;

      //   element.find('#' + el.getAttribute('data-uuid')).click();
      // };

      var emulateClick = function (el) {
        $timeout(function () {
          console.log("[F] emulateClick");
          // console.log("*** arg 'el':", el);
          var dataUuid = el.getAttribute('data-uuid');
          console.log("*** dataUuid:", dataUuid);
          var clickableElem = $('#clickable-' + dataUuid);
          console.log("*** clickableElem:", clickableElem);
          clickableElem.click();
        });
      };

      scope.$watch('omnibox.data.assets', function () {
        // get rid of dupes with nested assets
        var nestedAssets = [];
        scope.omnibox.data.assets.forEach(function (asset) {
          nestedAssets = nestedAssets
          .concat(getNestedAssets(asset)
            .map(function (nestedAsset) {
              return nestedAsset.entity_name + '$' + nestedAsset.id;
            })
          );
        });

        // set it locally so it doesn't show all the dupes
        scope.localAssets = _.filter(scope.omnibox.data.assets, function (asset) {
          var hasTheSame = nestedAssets.some(function (nesAs) {
            return asset.entity_name + '$' + asset.id === nesAs;
          });
          return !hasTheSame;
        });
      });

      scope.getGeomCardHeader = function (geom) {
        var M = 100000;
        var lon = Math.round(geom.geometry.coordinates[0] * M) / M;
        var lat = Math.round(geom.geometry.coordinates[1] * M) / M;
        if (geom.geometry.type === 'Point') {
          return '( ' + lat + ', ' + lon + ' )';
        } else {
          console.error("We only support (dashboard) omnibox cards for Point geometries, but encountered a geom with type: '" + geom.geometry.type + "'");
        }
      };

      scope.countRasters = function (geom) {
        return Object.keys(geom.properties).length;
      };

      /**
       * Turn ts on and give it the order of the dropped plot. Ts could already
       * be part of a plot above or below it, if so rearrange existing plots.
       * And make sure ts gets the right order.
       *
       * @param  {DOM}    el      Dragged element.
       * @param  {DOM}    target  Plot in drop.
       */
      DragService.on('drop', function (el, target) {
        // console.log("[dbg] DragService.on('drop'...");
        // console.log("*** el:", el);
        // console.log("*** target:", target);

        if (target === null) {
          // Dropping outside of dropzone
          return;
        }
        var order = Number(target.getAttribute('data-order'));
        var uuid = el.getAttribute('data-uuid');
        var selection = _.find(State.selections, function (selection) {
          return selection.uuid === uuid;
        });

        if (!selection) {
          console.error("[E] The dragged selection is falsy! selection =", selection);
          el.parentNode.removeChild(el);
          return;
        }

        var tsMetaData = SelectionService.timeseriesMetaData(
            TimeseriesService.timeseries, selection);

        var otherGraphTsMetaData = SelectionService.timeseriesMetaData(
            TimeseriesService.timeseries, otherGraphSelections);

        // console.log("[SRC] SELECTION:", selection);
        var srcMeasureScale = selection.measureScale;

        // console.log("[DST] otherGraphTsMetaData:", otherGraphTsMetaData);

        var targetSelectionUuids = ChartCompositionService.composedCharts["" + order];
        // console.log("[DST] targetSelectionUuids:", targetSelectionUuids);


        var checkMeasureScale;
        if (targetSelectionUuids) {
          var firstTargetSelection = _.find(State.selections, { uuid: targetSelectionUuids[0] });
          // console.log("[DST] 1st target selection:", firstTargetSelection);

          if (firstTargetSelection) {
            var firstTargetMeasureScale = firstTargetSelection.measureScale;
            // console.log("[DST] 1st target measure scale:", firstTargetMeasureScale);
            checkMeasureScale = srcMeasureScale !== firstTargetMeasureScale;
          }
        }

        var currentPlotCount,
            chartCompositionDragResult;

        if (selection.raster) {
          currentPlotCount = Object.keys(
            ChartCompositionService.composedCharts).length;
          if (currentPlotCount === 0) {
            emulateClick(el);
          } else {
            notie.alert(2,
              gettextCatalog.getString('Whoops, bar charts cannot be combined. Try again!')
            );
          }
          el.parentNode.removeChild(el);
          return;

        } else if (checkMeasureScale) {
          currentPlotCount = Object.keys(
            ChartCompositionService.composedCharts).length;
          if (currentPlotCount === 0) {
            emulateClick(el);
          } else {
            notie.alert(2,
              gettextCatalog.getString('Whoops, bar charts cannot be combined. Try again!')
            );
          }
          el.parentNode.removeChild(el);
          return;

        } else {
          chartCompositionDragResult = ChartCompositionService.dragSelection(
            order, uuid);
        }

        // console.log("[post-drag] Changed?",
        //   chartCompositionDragResult.changed);
        // console.log("[post-drag] Must activate selection?",
        //   chartCompositionDragResult.mustActivateSelection);
        // ChartCompositionService.debug();
        ///////////////////////////////////////////

        // El either represents a timeseries or another plottable item.
        //
        // NOTE: there is only one drop callback for all the possible assets. So
        // instead of searching for the ts in scope.asset.timeseries, all the
        // assets are searched.
        // timeseries

        // timeseries representend by el.

        // Possible other graph in target.
        var otherGraphSelections = _.find(State.selections, function (selection) {
          var selectionOrder = ChartCompositionService.getChartIndexForSelection(selection.uuid);
          return selectionOrder === order && selection.active;
        });

        if (otherGraphSelections === undefined) {
          // console.log("[post-drag] otherGraphSelections === undefined !!!");
          // No other graph, just turn ts to active.
          if (chartCompositionDragResult.mustActivateSelection) {
            // console.log("Ola1!!!");

            if (chartCompositionDragResult.mustEmulateClick) {
              emulateClick(el);
            } else {
              // console.log("ABOUT TO SYNC-TIME.. (1)");
              TimeseriesService.syncTime();
            }
          }
          el.parentNode.removeChild(el);
          return;
        }

        // If ts was already active: first remove and rearrange plots in
        // dashboard, then continue adding it to the dragged plot.
        if (selection.active) {
          // console.log("Explicitly DEACTIVATING selection!'");

          var selectionOrder = ChartCompositionService.getChartIndexForSelection(
            selection.uuid);

          var allSelectionsInCC = ChartCompositionService.composedCharts["" + selectionOrder];
          // console.log("*** allSelectionsInCC:", allSelectionsInCC);

          var otherSelectionsInCC = _.filter(allSelectionsInCC, function (uuid) {
            return uuid !== selection.uuid;
          });
          // console.log("*** otherSelectionsInCC:", otherSelectionsInCC);

          if (otherSelectionsInCC.length === 0) {
            order = selectionOrder;
          }

          selection.active = false;
          DBCardsService.removeSelectionFromPlot(selection);

        } else {
          if (chartCompositionDragResult.mustActivateSelection) {
            // console.log("Explicitly activating selection!'");
            selection.active = true;
          }
        }

        // var tsMetaData = SelectionService.timeseriesMetaData(
        //     TimeseriesService.timeseries, selection);

        // var otherGraphTsMetaData = SelectionService.timeseriesMetaData(
        //     TimeseriesService.timeseries, otherGraphSelections);

        // console.log("[SRC] SELECTION:", selection);
        // var srcMeasureScale = selection.measureScale;

        // console.log("[SRC] srcMeasureScale:", srcMeasureScale);
        // var srcType = selection.type;

        // console.log("[DST] otherGraphTsMetaData:", otherGraphTsMetaData);

        // var targetSelectionUuids = ChartCompositionService.composedCharts["" + order];
        // console.log("[DST] targetSelectionUuids:", targetSelectionUuids);

        // var firstTargetSelection = _.find(State.selections, { uuid: targetSelectionUuids[0] });
        // console.log("[DST] 1st target selection:", firstTargetSelection);

        // var firstTargetMeasureScale = firstTargetSelection.measureScale;
        // console.log("[DST] 1st target measure scale:", firstTargetMeasureScale);

        // var checkMeasureScale = srcMeasureScale !== firstTargetMeasureScale;

        // var check1 = tsMetaData.valueType !== otherGraphTsMetaData.valueType;

        if (checkMeasureScale) {

          notie.alert(2,
            gettextCatalog.getString('Whoops, the graphs are not the same type. Try again!'));
          // if (!selection.active) {
          //   emulateClick(el);
          // }
        } else if (selection.raster) {
          notie.alert(2,
            gettextCatalog.getString('Whoops, bar charts cannot be combined. Try again!'));
          // emulateClick(el);
        } else {
          // console.log("ABOUT TO SYNC-TIME.. (2)");
          // Set new order and tell TimeSeriesService to get data.
          selection.order = order || 0; // dashboard could be empty
          selection.active = true;
          TimeseriesService.syncTime();
        }

        // Remove drag element.
        el.parentNode.removeChild(el);

        console.log("-- le fin --");

      });

      scope.$on('$destroy', function () {
        DragService.destroy();
      });

    },
    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/db-cards.html'
  };
}]);
