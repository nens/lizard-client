// raster-aggregate-directives.js

/* *
*
*
* Directive to show aggregation of raster files in omnibox.
*
*/
app.directive('rasterAggregate', function () {
  var link = function (scope, element, attrs) {

    var srs = "EPSG:4326";
    scope.mapBounds = scope.map.getBounds();
    scope.map.on('moveend', function () {
      scope.mapBounds = scope.map.getBounds();
    });

    scope.$watch('mapBounds', function () {
      var geom_wkt = "POLYGON(("
              + scope.mapBounds.getWest() + " " + scope.mapBounds.getSouth() + ", "
              + scope.mapBounds.getEast() + " " + scope.mapBounds.getSouth() + ", "
              + scope.mapBounds.getEast() + " " + scope.mapBounds.getNorth() + ", "
              + scope.mapBounds.getWest() + " " + scope.mapBounds.getNorth() + ", "
              + scope.mapBounds.getWest() + " " + scope.mapBounds.getSouth()
              + "))";

      scope.getRasterData(scope.box.type, geom_wkt, srs, 'landuse_counts');   
    });


  };

  return {
    restrict: 'E',
    replace: true,
    link: link,
    templateUrl: 'templates/raster-aggregate.html'
  }
});