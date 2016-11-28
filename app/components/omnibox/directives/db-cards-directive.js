
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
    function (
      State,
      SelectionService,
      DragService,
      gettextCatalog,
      notie,
      getNestedAssets,
      TimeseriesService,
      DBCardsService) {
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
        scope.localGeoms = scope.omnibox.data.geometries;
      });


      /**
       * Turn ts on and give it the order of the dropped plot. Ts could already
       * be part of a plot above or below it, if so rearrange existing plots.
       * And make sure ts gets the right order.
       *
       * @param  {DOM}    el      Dragged element.
       * @param  {DOM}    target  Plot in drop.
       */
      DragService.on('drop', function (el, target) {
        if (target === null) {
          // Dropping outside of dropzone
          return;
        }
        var order = Number(target.getAttribute('data-order'));
        var hashkey = el.children[0].getAttribute('data-uuid');
        // El either represents a timeseries or another plottable item.
        //
        // NOTE: there is only one drop callback for all the possible assets. So
        // instead of searching for the ts in scope.asset.timeseries, all the
        // assets are searched.
        // timeseries

        // timeseries representend by el.
        var selection = _.find(State.selections, function (selection) {
          return selection.$$hashKey === hashkey;
        });

        // Possible other graph in target.
        var otherGraphSelections = _.find(State.selections, function (selection) {
          return selection.order === order && selection.active;
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
          var otherTSInOrigninalPlot = _.find(
            State.selections,
            function (_selection) {
              return _selection.active
                && _selection.order === selection.order
                && _selection.timeseries !== selection.timeseries;
            }
          );
          if (otherTSInOrigninalPlot === undefined) {
            // Plot where ts came from is now empty and removed.
            order = order < selection.order ? order : order - 1;
          }

          selection.active = false;
          DBCardsService.removeItemFromPlot(selection);
        }

        var tsMetaData = SelectionService.timeseriesMetaDataFunction(
            TimeseriesService.timeseries, selection);
        var otherGraphTsMetaData = SelectionService.timeseriesMetaDataFunction(
            TimeseriesService.timeseries, otherGraphSelections);
        if (tsMetaData.value_type !== otherGraphTsMetaData.value_type) {
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
