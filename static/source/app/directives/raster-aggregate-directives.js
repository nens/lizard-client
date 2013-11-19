// raster-aggregate-directives.js

app.directive('rasterAggregate', function () {
    return {
        restrict: 'E',
        replace: true
        templateUrl: 'templates/raster-aggregate.html'
    }
});