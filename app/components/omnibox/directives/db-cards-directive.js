
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

      var emulateClick = function (clickableUuid) {
        // $timeout(function () {
        var clickableElem = $('#clickable-' + clickableUuid);
        console.log('clickableElem:', clickableElem);
        clickableElem.click();
        // });
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
        console.log("[H] DragService.on DROP");
        console.log("*** el.......:", el);
        console.log("*** target...:", target);
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
          console.log("*** return early (because selection is falsy)");
          el.parentNode.removeChild(el);
          return;
        }

        var tsMetaData = SelectionService.timeseriesMetaData(
            TimeseriesService.timeseries, selection);
        var otherGraphTsMetaData = SelectionService.timeseriesMetaData(
            TimeseriesService.timeseries, otherGraphSelections);
        var srcMeasureScale = selection.measureScale;
        var targetSelectionUuids = ChartCompositionService.composedCharts[order];
        var checkMeasureScale;

        if (targetSelectionUuids) {
          var firstTargetSelection = _.find(State.selections, { uuid: targetSelectionUuids[0] });

          if (firstTargetSelection) {
            var firstTargetMeasureScale = firstTargetSelection.measureScale;
            checkMeasureScale = srcMeasureScale !== firstTargetMeasureScale;
          }
        }

        var currentPlotCount = ChartCompositionService.composedCharts.length,
            chartCompositionDragResult;

        if (selection.raster) {
          console.log("*** AAAAAAA mode 1/3: selection.raster");
          if (currentPlotCount === 0) {
            console.log("Emulating click in db-cards-directive 1");
            emulateClick(el.getAttribute('data-uuid'));
          } else {
            notie.alert(2,
              gettextCatalog.getString('Whoops, bar charts cannot be combined. Try again!')
            );
          }
          el.parentNode.removeChild(el);
          return;

        } else if (checkMeasureScale) {
          console.log("*** BBBBBBBB mode 2/3: checkMeasureScale");
          if (currentPlotCount === 0) {
            console.log("Emulating click in db-cards-directive 2");
            emulateClick(el.getAttribute('data-uuid'));
          } else {
            notie.alert(2,
              gettextCatalog.getString('Whoops, the graphs are not the same type. Try again!')
            );
          }
          el.parentNode.removeChild(el);
          return;

        } else {
          console.log("*** CCCCCC mode 3/3: else (=> may need to call emulateClick??)");
          if (currentPlotCount === 0) {
            console.log("Emulating click in db-cards-directive 3");
            console.log(el);
            var dataUuid = el.getAttribute('data-uuid');
            el.parentNode.removeChild(el);
            emulateClick(dataUuid);
            return;
          } else {
            chartCompositionDragResult = ChartCompositionService.dragSelection(
              order, uuid);
            selection.order = chartCompositionDragResult.finalIndex;
          }
          TimeseriesService.syncTime();
        }

        // Possible other graph in target.
        var otherGraphSelections = _.find(State.selections, function (selection) {
          var selectionOrder = ChartCompositionService.getChartIndexForSelection(selection.uuid);
          return selectionOrder === order && selection.active;
        });

        if (otherGraphSelections === undefined) {
          if (chartCompositionDragResult.mustActivateSelection) {
            if (chartCompositionDragResult.mustEmulateClick) {
              console.log("Emulating click in db-cards-directive 3");
              emulateClick(el.getAttribute('data-uuid'));
            } else {
              TimeseriesService.syncTime();
            }
          }
          el.parentNode.removeChild(el);
          return;
        }

        // If ts was already active: first remove and rearrange plots in
        // dashboard, then continue adding it to the dragged plot.
        if (selection.active) {

          var selectionOrder = ChartCompositionService.getChartIndexForSelection(
            selection.uuid);
          var allSelectionsInCC = ChartCompositionService.composedCharts[selectionOrder];
          var otherSelectionsInCC = _.filter(allSelectionsInCC, function (uuid) {
            return uuid !== selection.uuid;
          });

          if (otherSelectionsInCC.length === 0) {
            order = selectionOrder;
          }

          selection.active = false;
        } else {
          if (chartCompositionDragResult.mustActivateSelection) {
            selection.active = true;
          }
        }

        if (checkMeasureScale) {
          notie.alert(2,
            gettextCatalog.getString('Whoops, the graphs are not the same type. Try again!'));
        } else if (selection.raster) {
          notie.alert(2,
            gettextCatalog.getString('Whoops, bar charts cannot be combined. Try again!'));
        } else {
          selection.order = order || 0; // dashboard could be empty
          selection.active = true;
          TimeseriesService.syncTime();
        }

        // Remove drag element.
        el.parentNode.removeChild(el);
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
