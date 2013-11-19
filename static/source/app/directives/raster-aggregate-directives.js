// raster-aggregate-directives.js

app.directive('rasterAggregate', function () {
  var link = function (scope, element, attrs) {

    var srs = "EPSG:4326";
    scope.mapBounds = {};
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

      scope.getRasterData('ahn2', geom_wkt, srs, 'sum');      
    });

    console.log('haha', scope.box.content);
  };

  return {
    restrict: 'E',
    replace: true,
    link: link,
    templateUrl: 'templates/raster-aggregate.html'
  }
});