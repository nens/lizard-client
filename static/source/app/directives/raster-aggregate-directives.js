// raster-aggregate-directives.js

app.directive('rasterAggregate', function () {
  var link = function (scope, element, attrs) {

    var mapBounds = scope.map.getBounds();
    var srs = "EPGS:4326";
    var geom_wkt = "POLYGON(("
            + mapBounds.getWest() + " " + mapBounds.getSouth() + ", "
            + mapBounds.getEast() + " " + mapBounds.getSouth() + ", "
            + mapBounds.getEast() + " " + mapBounds.getNorth() + ", "
            + mapBounds.getWest() + " " + mapBounds.getNorth() + ", "
            + mapBounds.getWest() + " " + mapBounds.getSouth()
            + "))";

    scope.getRasterData('landuse', geom_wkt, srs);
    console.log('haha', scope.box.content);
  };

  return {
    restrict: 'E',
    replace: true,
    link: link,
    templateUrl: 'templates/raster-aggregate.html'
  }
});