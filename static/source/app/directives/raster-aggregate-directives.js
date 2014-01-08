// raster-aggregate-directives.js

/* *
*
* Directive to show aggregation of raster files in omnibox.
* Depends on graph-directives to draw pie chart
*/
app.directive('rasterAggregate', function ($q) {
  var link = function (scope, element, attrs) {
    var agg, raster;
    var srs = 'EPSG:4326';

    if (scope.mapState.timeout === undefined) {
      scope.mapState.timeout = $q.defer();
    }

    var mapWatch = scope.$watch('mapState.bounds', function () {
      console.info('i should be quiet')
      if (scope.box.type === 'landuse') {
        agg = 'counts';
        scope.box.content.agg = agg;

        raster = 'landuse';
      } else if (scope.box.type  === 'elevation') {
        agg = 'curve';
        scope.box.content.agg = agg;
        raster = 'elevation';
      }
    
    var geom_wkt = "POLYGON(("
            + scope.mapState.bounds.getWest() + " " + scope.mapState.bounds.getSouth() + ", "
            + scope.mapState.bounds.getEast() + " " + scope.mapState.bounds.getSouth() + ", "
            + scope.mapState.bounds.getEast() + " " + scope.mapState.bounds.getNorth() + ", "
            + scope.mapState.bounds.getWest() + " " + scope.mapState.bounds.getNorth() + ", "
            + scope.mapState.bounds.getWest() + " " + scope.mapState.bounds.getSouth()
            + "))"; 
      scope.mapState.timeout.resolve();
      scope.mapState.timeout = $q.defer();
      scope.getRasterData(raster, geom_wkt, srs, agg, true);
    });

    element.on('$destroy', function () {
      mapWatch();
    });
  };

  return {
    restrict: 'E',
    replace: true,
    link: link,
    templateUrl: 'templates/raster-aggregate.html'
  };
});