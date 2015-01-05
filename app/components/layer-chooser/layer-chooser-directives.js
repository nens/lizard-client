//layer-directive.js

angular.module('data-menu')
  .directive("layerChooser", ['State', 'LeafletService',
    function (State, LeafletService) {

  var link = function (scope, element, attrs) {
    // Scope gets the mapState layerGroup, here we create a new layerGroup which
    // goes into its own NxtMap to always be turned on
    var layerGroup = scope.layergroup;

    var leafletLayers = [];

    angular.forEach(layerGroup.mapLayers, function (layer) {
      if (layer.format === 'TMS') {
        leafletLayers.push(LeafletService.tileLayer(
          layer.url + '/{slug}/{z}/{x}/{y}.{ext}', {
            slug: layer.slug,
            minZoom: layer.min_zoom || 0,
            maxZoom: 19,
            detectRetina: true,
            zIndex: layer.zIndex,
            ext: 'png'
          }));
      }
      else if (layer.format === 'WMS') {
        var _options = {
          layers: layer.slug,
          format: 'image/png',
          version: '1.1.1',
          minZoom: layer.min_zoom || 0,
          maxZoom: 19,
          opacity: layer.opacity,
          zIndex: layer.zIndex
        };
        _options = angular.extend(_options, layer.options);
        leafletLayers.push(LeafletService.tileLayer.wms(layer.url, _options));
      }
      else if (layer.format === 'Vector') {
        element.find('.layer-img')[0].style.backgroundColor = layer.color;
      }
    });

    if (leafletLayers.length > 0) {
      var map = L.map(element.find('.layer-img')[0], {
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
        }
      );

      leafletLayers.forEach(function (l) { l.addTo(map); });

      scope.$watch(State.toString('spatial.bounds'), function (n, v) {
        if (n === v) { return; }
        var zoom = State.spatial.zoom;
        var centroid = State.spatial.bounds.getCenter();
        map.setView(centroid, zoom - 2);
      });
    }

  };

  return {
    link: link,
    templateUrl: 'layer-chooser/layer-chooser.html',
    restrict: 'E',
  };

}]);
