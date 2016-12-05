
angular.module('omnibox')
.directive('dbGeometryCards', [
  'State',
  'DBCardsService',
  'DataService',
  'SelectionService',
  'DragService',
  function (
      State,
      DBCardsService,
      DataService,
      SelectionService,
      DragService) {
    // TODO: This whole directive is a copy of parts of the
    // asset-card-directive. Asset cards also contain geometry so why not merge
    // them?
    return {
      link: function (scope, element) {

        // TODO: I use this to propagate the selections (setting
        // scope.selections won't work cause it won't update. Still it seems
        // ugly to me to pass on the whole state.
        scope.state = State;

        scope.noData = true;

        scope.getSelectionMetaData = SelectionService.rasterMetaDataFunction(
            scope.geom);

        /**
         * Properties are asynchronous so watch it to set noData when added.
         */
        scope.$watch('geom.properties', function (n, o) {

          _.forEach(scope.geom.properties, function (property, slug) {
            if (property.active === undefined
              && SelectionService.dbSupportedData(
                scope.geom.geometry.type,
                property
              )) {
              scope.toggleProperty(property);
            }
          });

          // No raster data when properties is undefined or when properties is
          // empty object.
          var noRasterData = scope.geom.properties
            ? !Object.keys(scope.geom.properties).length
            : true;
          scope.noData = noRasterData && scope.geom.entity_name === undefined;
        }, true);

        scope.toggleSelection = SelectionService.toggle;

        scope.toggleProperty = function (property) {

          if (!property.active) {
            var plots = DBCardsService.getActiveCountAndOrder();

            // On toggle, add seperate graph. Give order of highest order + 1.
            property.order = plots.count > 0
              ? plots.order + 1
              : 0;
            property.active = true;
          }

          else {
            DBCardsService.removeItemFromPlot(property);
            property.active = false;
          }

          if (DataService.onGeometriesChange) {
            DataService.onGeometriesChange();
          }

        };

        scope.$on('$destroy', function () {
          _.forEach(scope.geom.properties, function (property) {
            property.active = true;
            scope.toggleProperty(property);
            // Activity of property should not be defined when creating
            // dashboard.
            property.active = undefined;
          });
        });

        DragService.addDraggableContainer(element.find('#drag-container'));

      },
      restrict: 'E',
      scope: {
        geom: '=',
        timeState: '=',
        header: '='
      },
      replace: true,
      templateUrl: 'omnibox/templates/db-geometry-cards.html'
    };
  }
]);
