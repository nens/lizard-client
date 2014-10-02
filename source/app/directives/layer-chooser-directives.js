//layer-directive.js

app.directive("layerChooser", ['NxtMap', 'CabinetService',
  function (NxtMap, CabinetService) {

  var link = function (scope, element, attrs) {
    // Scope gets the mapState layerGroup, here we create a new layerGroup which
    // goes into its own NxtMap to always be turned on
    var layerGroup = CabinetService.layergroups[scope.layergroup.slug];
    var chooser = new NxtMap(element.find('.layer-img')[0], [layerGroup], {
      center: [52.39240447569775, 5.101776123046875],
      zoom: 6,
      dragging: false,
      touchZoom: false,
      doubleClickzoom: false,
      tap: false,
      scrollWheelZoom: false,
      animate: true,
      zoomControl: false,
      attributionControl: false
    });

    chooser.toggleLayerGroup(chooser.layerGroups[Object.keys(chooser.layerGroups)[0]]);

    scope.$watch('mapState.bounds', function (n, v) {
      if (n === v) { return; }
      var zoom = scope.mapState.zoom;
      var centroid = scope.mapState.bounds.getCenter();
      chooser.setView(centroid, zoom - 2);
    });

  };

  return {
    link: link,
    templateUrl: 'templates/layer-chooser.html',
    restrict: 'E'
  };

}]);
