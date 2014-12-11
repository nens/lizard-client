//layer-directive.js

angular.module('lizard-nxt')
  .directive("layerChooser", ['NxtMap', 'dataLayers',
    function (NxtMap, dataLayers) {

  var link = function (scope, element, attrs) {
    // Scope gets the mapState layerGroup, here we create a new layerGroup which
    // goes into its own NxtMap to always be turned on
    // var layerGroup = angular.copy(dataLayers[scope.layergroup.slug]);

    var needsPreviewMap;
    // Remove unnecessary datalayers before going further
    // but first copying the layer array, otherwise the
    // iterator gets confused.
    // var layerCopy = angular.copy(layerGroup.layers);
    // angular.forEach(layerGroup.layers, function (layer) {
    //   if (layer.format === 'WMS' ||
    //       layer.format === 'TMS') {
    //     needsPreviewMap = true;
    //     layerCopy = [layer];
    //   }

    //   if (layer.format === 'Vector') {
    //     element.find('.layer-img')[0].style.backgroundColor = layer.color;
    //   }
    // });

    // layerGroup.layers = layerCopy;

    // if (needsPreviewMap) {
    //   var chooser = new NxtMap(element.find('.layer-img')[0], [layerGroup], {
    //     center: [52.39240447569775, 5.101776123046875],
    //     zoom: 6,
    //     dragging: false,
    //     touchZoom: false,
    //     doubleClickZoom: false,
    //     tap: false,
    //     scrollWheelZoom: false,
    //     animate: true,
    //     zoomControl: false,
    //     attributionControl: false,
    //     forChooser: true
    //   });

    //   chooser.syncTime(scope.timeState);


    //   // To speed-up initial load of the app layerchooser layers are toggled
    //   // after 3000 ms.
    //   setTimeout(function () {
    //     chooser.toggleLayerGroup(
    //       chooser.layerGroups[Object.keys(chooser.layerGroups)[0]]
    //       );
    //   }, 3000);

    //   scope.$watch('mapState.bounds', function (n, v) {
    //     if (n === v) { return; }
    //     var zoom = scope.mapState.zoom;
    //     var centroid = scope.mapState.bounds.getCenter();
    //     chooser.setView(centroid, zoom - 2);
    //   });
    // }
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/layer-chooser.html',
    restrict: 'E'
  };

}]);
