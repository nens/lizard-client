//layer-directive.js

angular.module('lizard-nxt')
  .directive("layerChooser", ['NxtMap', 'NxtData', 'dataLayers', 'State', 'DataService',
    function (NxtMap, NxtData, dataLayers, State, DataService) {

  var link = function (scope, element, attrs) {
    // Scope gets the mapState layerGroup, here we create a new layerGroup which
    // goes into its own NxtMap to always be turned on
    var layerGroup = angular.copy(dataLayers[scope.layergroup.slug]);

    var needsPreviewMap = true;
    // Remove unnecessary datalayers before going further
    // but first copying the layer array, otherwise the
    // iterator gets confused.
    var layerCopy = angular.copy(layerGroup.layers);
    angular.forEach(layerGroup.layers, function (layer) {
      if (layer.format === 'WMS' ||
          layer.format === 'TMS') {
        needsPreviewMap = true;
        layerCopy = [layer];
      }

      if (layer.format === 'Vector') {
        element.find('.layer-img')[0].style.backgroundColor = layer.color;
      }
    });

    layerGroup.layers = layerCopy;

    if (needsPreviewMap) {
      var previewMap = new NxtMap();
      previewMap.createMap(element.find('.layer-img')[0], {
        center: [52.39240447569775, 5.101776123046875],
        zoom: 6,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        tap: false,
        scrollWheelZoom: false,
        animate: true,
        zoomControl: false,
        attributionControl: false,
        forChooser: true
      });

      var data = new NxtData([layerGroup]);

      data.syncTime(scope.timeState);


      // To speed-up initial load of the app layerchooser layers are toggled
      // after 3000 ms.
      setTimeout(function () {
        data.toggleLayerGroup(
          data.layerGroups[Object.keys(data.layerGroups)[0]], previewMap._map
          );
      }, 3000);

      scope.$watch(State.toString('spatial.bounds'), function (n, v) {
        if (n === v) { return; }
        var zoom = State.spatial.zoom;
        var centroid = State.spatial.bounds.getCenter();
        previewMap.setView(centroid, zoom - 2);
        scope.bounds = State.spatial.bounds;
      });
    }

    scope.data = DataService;
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/layer-chooser.html',
    restrict: 'E',
  };

}]);
