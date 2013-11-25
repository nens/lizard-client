// raster-aggregate-directives.js

/* *
*
* Directive to show aggregation of raster files in omnibox.
* Depends on graph-directives to draw pie chart
*/
app.directive('rasterAggregate', function () {
  var link = function (scope, element, attrs) {
    var agg, raster;

    var srs = 'EPSG:4326';
    scope.mapBounds = scope.map.getBounds();
    scope.map.on('moveend', function () {
      scope.mapBounds = scope.map.getBounds();
    });

    scope.$watch('mapBounds', function () {
      if (scope.box.type === 'landuse') {
        agg = 'counts';
        scope.box.content.agg = agg;

        raster = 'landuse';
      } else if (scope.box.type  === 'elevation') {
        agg = 'curve';
        scope.box.content.agg = agg;
        raster = 'ahn2';
      }

      var geom_wkt = "POLYGON(("
              + scope.mapBounds.getWest() + " " + scope.mapBounds.getSouth() + ", "
              + scope.mapBounds.getEast() + " " + scope.mapBounds.getSouth() + ", "
              + scope.mapBounds.getEast() + " " + scope.mapBounds.getNorth() + ", "
              + scope.mapBounds.getWest() + " " + scope.mapBounds.getNorth() + ", "
              + scope.mapBounds.getWest() + " " + scope.mapBounds.getSouth()
              + "))";
      scope.getRasterData(raster, geom_wkt, srs, agg);   
    });
  };

  return {
    restrict: 'E',
    replace: true,
    link: link,
    templateUrl: 'templates/raster-aggregate.html'
  };
});