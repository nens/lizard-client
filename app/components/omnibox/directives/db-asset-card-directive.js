
angular.module('omnibox')
  .directive('dbAssetCard', [ 'State', 'DataService', 'DragService', 'DBCardsService', 'TimeseriesService',
    function (State, DataService, DragService, DBCardsService, TimeseriesService) {
  return {
    link: function (scope, element) {

      scope.selected = State.selected;

      scope.getTsMetaData = function (uuid) {
        return _.find(scope.asset.timeseries, function (ts) {
          return ts.uuid === uuid;
        });
      };

      /**
       * Returns true if selection with uuid is one the first three in the list.
       *
       * This is used to bypass ngRepeat which loops over one big list of
       * selections multiple times, once for each asset. It should draw the
       * first three of each asset or more if more than three are active.
       *
       * @param  {str}  uuid uuid of selection.
       * @return {Boolean} is in first three of DOM list.
       */
      scope.isOneOfFirstThree = function (uuid) {
        var items = element.find('.draggable-ts');
        var index = _.findIndex(items, function (item) {return item.dataset.uuid === uuid; });
        return index < 3;
      };

      scope.toggleTimeseries = function (timeseries) {

        if (!timeseries.active) {

          var plots = DBCardsService.getActiveCountAndOrder();

          timeseries.order = plots.count > 0
            ? plots.order + 1
            : 0;

        }

        else {

          DBCardsService.removeItemFromPlot(timeseries);

        }

        timeseries.active = !timeseries.active;
        TimeseriesService.syncTime();

      };

      scope.noTimeseries = scope.asset.timeseries.length === 0;

      // Extender is the button at the bottom of the timeseries list to show
      // more or less items.
      scope.showExtender = true;

      var MANY = 5;

      // If there are a few timeseries, show them all and do not show the
      // extender button.
      if (scope.asset.timeseries.length < MANY) {
        scope.extended = true;
        scope.showExtender = false;
      }

      /**
       * Specific toggle for crosssection
       *
       * @param  {object} asset with entity_name crossection and a crossection
       *                        model.
       */
      scope.toggleCrosssection = function (asset) {

        if (!asset.crosssection.active) {
          var plots = DBCardsService.getActiveCountAndOrder();

          asset.crosssection.order = plots.count > 0
            ? plots.order + 1
            : 0;

          asset.crosssection.active = true;

        } else {
          DBCardsService.removeItemFromPlot(asset.crosssection);
          asset.crosssection.active = false;
        }

        if (DataService.onGeometriesChange) {
          DataService.onGeometriesChange();
        }
      };

      // Init crosssection
      if (scope.asset.entity_name === 'leveecrosssection') {
        scope.asset.crosssection = {
          active: false, // set to true by  toggle
          order: 0
        };
        scope.toggleCrosssection(scope.asset);
      }

      DragService.addDraggableContainer(element.find('#drag-container'));

    },
    restrict: 'E',
    scope: {
      asset: '=',
      timeState: '=',
      assets: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/db-asset-card.html'
  };
}]);
