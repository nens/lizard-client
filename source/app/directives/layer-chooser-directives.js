//layer-directive.js

app.directive("layerChooser", ['LeafletService', function (LeafletService) {

  var link = function (scope, element, attrs) {

    // var map = MapService.createMap(element.find('.layer-img')[0], {
    //   center: centroid,
    //   zoom: zoom - 2,
    //   dragging: false,
    //   touchZoom: false,
    //   doubleClickzoom: false,
    //   tap: false,
    //   scrollWheelZoom: false,
    //   animate: true,
    //   zoomControl: false,
    //   attributionControl: false
    // });
    // layerGroup.toggle(map)
}

    // var centroid, zoom, layerMap, layerLeafletLayer, layer, layerGroup, layerUrl, map;

    // centroid = [52.39240447569775, 5.101776123046875];
    // zoom = scope.mapState.zoom;
    // layerMap = LeafletService.map(element.find('.layer-img')[0], {
    //   center: centroid,
    //   zoom: zoom - 2,
    //   dragging: false,
    //   touchZoom: false,
    //   doubleClickzoom: false,
    //   tap: false,
    //   scrollWheelZoom: false,
    //   animate: true,
    //   zoomControl: false,
    //   attributionControl: false
    // });

    // layerGroup = scope.layer;
    // console.log(scope)
    // if (layerGroup.layers.length > 0 ) {

    //   // We make everything work for the layerGroups carrying only a single layer.

    //   var firstLayer = layerGroup.layers[0];
    //   if (firstLayer.type === 'Vector') { return; }

    //   // legacy if.. needs to be refactored
    //   if (!firstLayer.temporal) {

    //     if (firstLayer.type === 'WMS') {

    //       var options = {
    //         layers: firstLayer.slug,
    //         format: 'image/png',
    //         version: '1.1.1',
    //         minZoom: firstLayer.min_zoom,
    //         maxZoom: 19,
    //         zIndex: firstLayer.z_index,
    //         id: layerGroup.id
    //       };
    //       //NOTE ugly hack
    //       if (firstLayer.slug === 'landuse') {
    //         options.styles = 'landuse';
    //       } else if (firstLayer.slug === 'elevation') {
    //         options.styles = 'BrBG_r';
    //         options.effects = 'shade:0:3';
    //       }
    //       layerLeafletLayer = LeafletService.tileLayer.wms(firstLayer.url, options);

    //     } else {

    //       layerUrl = firstLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';
    //       layerLeafletLayer = LeafletService.tileLayer(layerUrl, {
    //         ext: 'png',
    //         slug: firstLayer.slug,
    //         name: firstLayer.slug,
    //         minZoom: firstLayer.min_zoom,
    //         maxZoom: 19,
    //         zIndex: firstLayer.z_index,
    //         id: layerGroup.id
    //       });
    //     }
    //     layerMap.addLayer(layerLeafletLayer);
    //   }
    // } else {
    //   // console.debug("Encountered a composed layerGroup (i.e: layerGroup.layers.len > 1), This layerGroup will not have a thumbnail added to the menu (for now...)");
    //   return;
    // }

  //   scope.$watch('mapState.bounds', function (n, v) {
  //     if (n === v) { return; }
  //     zoom = scope.mapState.zoom;
  //     centroid = scope.mapState.bounds.getCenter();
  //     layerMap.setView(centroid, zoom - 2);
  //   });
  // };

  return {
    link: link,
    templateUrl: 'templates/layer-chooser.html',
    restrict: 'E'
  };

}]);
