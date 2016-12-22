
angular.module('omnibox')
  .directive('dbAssetCard', [
    'State',
    'DataService',
    'DragService',
    'DBCardsService',
    'SelectionService',
    function (
        State,
        DataService,
        DragService,
        DBCardsService,
        SelectionService) {
  return {
    link: function (scope, element) {

      scope.noData = true;

      // geometry or asset administration
      if (scope.assetType === "asset") {
        scope.asset = scope.assetGeom;
        scope.noData = scope.asset.timeseries.length === 0;
        scope.assetTypeName = "asset";
        scope.noDataType = "timeseries";
      } else {
        scope.geom = scope.assetGeom;
        scope.assetTypeName = "geometry";
        scope.noDataType = "raster";

       /**
        * Properties are asynchronous so watch it to set noData when added.
        */
        scope.$watch('geom.properties', function (geoms) {
          var noRasterData = geoms ? !Object.keys(geoms).length : true;
          scope.noData = noRasterData && scope.geom.entity_name === undefined;
        }, true);
      }

      scope.state = State;
      scope.getSelectionMetaData = SelectionService.getMetaDataFunction(
        scope.assetGeom);
      scope.toggleSelection = SelectionService.toggle;

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
        var index = _.findIndex(items, function (item) {
          return item.dataset.uuid === uuid; });
        return index < 3;
      };

      // TODO: check the code below, this might have been left out because of
      // the long time this branch has existed seperately from master.

      // // Extender is the button at the bottom of the timeseries list to show
      // // more or less items.
      // scope.showExtender = true;
      //
      // var MANY = 5;
      //
      // // If there are a few timeseries, show them all and do not show the
      // // extender button.
      // if (scope.asset.timeseries.length < MANY) {
      //   scope.extended = true;
      //   scope.showExtender = false;
      // }

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
          DBCardsService.removeSelectionFromPlot(asset.crosssection);
          asset.crosssection.active = false;
        }

        if (DataService.onGeometriesChange) {
          DataService.onGeometriesChange();
        }
      };

      // Init crosssection
      if (scope.assetGeom.entity_name === 'leveecrosssection') {
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
      assetGeom: '=',
      assetType: '=',
      timeState: '='
    },
    replace: true,
    templateUrl: 'omnibox/templates/db-asset-card.html'
  };
}]);
