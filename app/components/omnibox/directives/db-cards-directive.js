
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
    function (
      State,
      SelectionService,
      DragService,
      gettextCatalog,
      notie,
      getNestedAssets,
      TimeseriesService,
      DBCardsService,
      ChartCompositionService) {
  return {
    link: function (scope, element) {

      DragService.create();

      var emulateClick = function (el) {
        // other plottable item. Toggle on drag to put element in their own
        // plot.
        element.find('#' + el.getAttribute('data-uuid')).click();
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
      }

      scope.countRasters = function (geom) {
        return Object.keys(geom.properties).length;
      }

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

        ///////////////////////////////////////////////////////////////////////
        var chartCompositionHasChanged = ChartCompositionService.dragSelection(order, uuid);
        console.log("Changed?", chartCompositionHasChanged);
        // ChartCompositionService.debug();
        ///////////////////////////////////////////

        // El either represents a timeseries or another plottable item.
        //
        // NOTE: there is only one drop callback for all the possible assets. So
        // instead of searching for the ts in scope.asset.timeseries, all the
        // assets are searched.
        // timeseries

        // timeseries representend by el.
        var selection = _.find(State.selections, function (selection) {
          return selection.uuid === uuid;
        });

        // Possible other graph in target.
        var otherGraphSelections = _.find(State.selections, function (selection) {
          var selectionOrder = ChartCompositionService.getChartIndexForSelection(selection.uuid);
          return selectionOrder === order && selection.active;
        });

        if (otherGraphSelections === undefined) {
          // No other graph, just turn ts to active.
          emulateClick(el);
          el.parentNode.removeChild(el);
          return;
        }

        // If ts was already active: first remove and rearrange plots in
        // dashboard, then continue adding it to the dragged plot.
        if (selection.active) {

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
        }


        console.log("Tot hier gaat het goed? (1)");
        var tsMetaData = SelectionService.timeseriesMetaData(
            TimeseriesService.timeseries, selection);
        console.log("Tot hier gaat het goed? (2)");
        var otherGraphTsMetaData = SelectionService.timeseriesMetaData(
            TimeseriesService.timeseries, otherGraphSelections);
        console.log("Tot hier gaat het goed? (3)");
        var check1 = tsMetaData.valueType !== otherGraphTsMetaData.valueType;
        console.log("Tot hier gaat het goed? (4)");
        if (check1) {
          notie.alert(2,
            gettextCatalog.getString('Whoops, the graphs are not the same type. Try again!'));
          emulateClick(el);
        } else if (selection.raster) {
          notie.alert(2,
            gettextCatalog.getString('Whoops, bar charts cannot be combined. Try again!'));
          emulateClick(el);
        } else {
          // Set new order and tell TimeSeriesService to get data.
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
