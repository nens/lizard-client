//layer-directive.js

app.directive("layerChooser", ['LeafletService', function (LeafletService) {
  var link = function (scope, element, attrs) {
    var centroid, zoom, layerMap, layerLeafletLayer, layer, layerUrl, map;
    centroid = [52.39240447569775, 5.101776123046875];
    zoom = scope.mapState.zoom;
    layerMap = LeafletService.map(element.find('.layer-img')[0], {
      center: centroid,
      zoom: zoom - 2,
      dragging: false,
      touchZoom: false,
      doubleClickzoom: false,
      tap: false,
      scrollWheelZoom: false,
      animate: true,
      zoomControl: false,
      attributionControl: false
    });

    layer = scope.layer;
    
    if (!layer.temporal) {
      if (layer.type === 'WMS') {
        var options = {
          layers: layer.slug,
          format: 'image/png',
          version: '1.1.1',
          minZoom: layer.min_zoom,
          maxZoom: 19,
          zIndex: layer.z_index
        };
        //NOTE ugly hack
        if (layer.slug === 'landuse') {
          options.styles = 'landuse';
        } else if (layer.slug === 'elevation') {
          options.styles = 'BrBG_r';
          options.effects = 'shade:0:3';
        }
        layerLeafletLayer = LeafletService.tileLayer.wms(layer.url, options);
      } else {
        layerUrl = (layer.type === 'TMS') ? layer.url + '.png' : layer.url;
        layerLeafletLayer = LeafletService.tileLayer(layerUrl, {
          ext: 'png',
          slug: layer.slug,
          name: layer.slug,
          minZoom: layer.min_zoom,
          maxZoom: 19,
          zIndex: layer.z_index
        });
      }
      layerMap.addLayer(layerLeafletLayer);
    }
    scope.$watch('mapState.bounds', function (n, v) {
      if (n === v) { return; }
      zoom = scope.mapState.zoom;
      centroid = scope.mapState.bounds.getCenter();
      layerMap.setView(centroid, zoom - 2);
    });
  };


  return {
    link: link,
    templateUrl: 'templates/layer-chooser.html',
    restrict: 'E'
  };

}]);
