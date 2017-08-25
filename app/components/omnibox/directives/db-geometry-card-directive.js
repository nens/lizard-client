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
    // TODO: This whole directive is a copy of parts of the asset-card-directive
    return {
      link: function (scope, element) {

        scope.state = State;

        scope.noData = true;

        scope.getSelectionMetaData = SelectionService.getMetaDataFunction(
          scope.geom);

        // Make sure all event series data etc gets updated on geo.
        DataService.getGeomData(scope.geom).then(function (geo) {
          console.log("Updated geo:", geo, scope.geom);
        });

        scope.$watch('geom', function () {
          SelectionService.initializeRaster(scope.geom, "geom");
        });

        /**
         * Properties are asynchronous so watch it to set noData when added.
         */
        scope.$watch('geom.properties', function (n, o) {
          console.log("scope.$watch('geom.properties', function (n, o) { triggered.");

          scope.geomSelections = SelectionService.initializeGeomEventseriesSelections(scope.geom);

          _.forEach(scope.geom.properties, function (property, uuid) {
            var selection = _.find(State.selections, function(s) {
		return s.geom === scope.geom.geometry.coordinates.toString() && s.raster === uuid;
            });
            if (selection && selection.active === undefined
              && SelectionService.dbSupportedData(
                scope.geom.geometry.type,
                property
              )) {
              scope.toggleSelection(selection);
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

        scope.$on('$destroy', function () {
          _.forEach(scope.geom.properties, function (property, uuid) {
            var selection = _.find(State.selections, function(s) {
		return s.geom === scope.geom.geometry.coordinates.toString() && s.raster === uuid;
            });
            if (selection) {
              selection.active = true;
              scope.toggleSelection(selection);
              // Activity of selection should not be defined when creating
              // dashboard.
              selection.active = undefined;
            }
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
