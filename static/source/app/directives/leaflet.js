// leaflet.js
app
    .directive('map', ['$rootScope', 'Omnibox', function(Omnibox){
      // function addDefaultLayers(map, layergroups) {
      //   for (var i = 0; i < layergroups.length; i ++) {
      //     var layergroup = layergroups[i];
      //     for (var j = 0; j < layergroup.layers.length; j ++) {
      //       var layer = layergroup.layers[j];
      //       if (layer.leafletLayer === undefined) {
      //         if (layer.type == "WMS") {
      //           // TODO: fix something more robust for WMS layers.
      //           // It works when the layer.url defines the layer name
      //           // and the wms server is hardcoded
      //           console.log(layer.type, layer);
      //           wms = 'http://geoserver1-3di.lizard.net/geoserver/gwc/service/wms';
      //           layer.leafletLayer = L.tileLayer.wms(wms, {
      //             layers: layer.url,
      //             format: 'image/png',
      //             version: '1.1.1' });
      //         }
      //         else {
      //           layer.leafletLayer = L.tileLayer(layer.url);
      //         }
      //       }
      //       if (layer.active) {
      //         map.addLayer(layer.leafletLayer);
      //         if (layer.baselayer) {
      //           layer.leafletLayer.bringToBack();
      //         }
      //       }
      //     }
      //   }
      // }

      var addLayers = function (map, layers){
      	for (var i in layers){
      		if (layer[i].active){
      			if (layer.type === "TMS"){
      				layer.leafletLayer = L.tileLayer(layer.url);
      			} else if (layer.type === "UTFGrid"){
      				layer.leafletLayer = L.UtfGrid(layer.url, {
      					JsonP: false
      				})
      			} else if (layer.type === "WMS"){
	            // TODO: fix something more robust for WMS layers.
              // It works when the layer.url defines the layer name
              // and the wms server is hardcoded
              console.log(layer.type, layer);
              wms = 'http://geoserver1-3di.lizard.net/geoserver/gwc/service/wms';
              layer.leafletLayer = L.tileLayer.wms(wms, {
                layers: layer.url,
                format: 'image/png',
                version: '1.1.1' });
      			} else {
      				console.log(layer.type);
      			}
      			map.addLayer(layer.leafletLayer)
      		}
      	}
      }

        var link = function (scope, element, attrs, controller) {
            var map = new L.map(element[0], {
            center: new L.LatLng(52.0992287, 5.5698782),
            zoomControl: false,
            zoom: 8
          });

            map.on('click', function(e){
                scope.$apply(function(){
                    Omnibox.open('graph');
                });
            });

            scope.$watchCollection('layers', function(){
            		addLayers(map, scope.layers)
                // addDefaultLayers(map, scope.layergroups);

            });

          scope.$on('LayerSwitched', function(event, layer) {
            console.log("layer switched");
            if (layer.active === true) {
              map.addLayer(layer.leafletLayer);
            }
            if (layer.active === false) {
              map.removeLayer(layer.leafletLayer);
            }
          });

          scope.$on('LayerOn', function(event, layer) {
            map.addLayer(layer.leafletLayer);
            if (layer.baselayer) {
              layer.leafletLayer.bringToBack();
            }
          });

          scope.$on('LayerOff', function(event, layer) {
            map.removeLayer(layer.leafletLayer);
          });

          scope.$on('PanAndZoomTo', function(event, latlng) {
            map.setView(new L.LatLng(latlng.lat, latlng.lon), 14);
            console.log('PanAndZoomTo', latlng);
          });

        };

        var Ctrl = function($scope){
            $scope.addDefaultLayers = addDefaultLayers;
            $scope.map = map;
        };

        return {
            restrict: 'E',
            replace: true,
            template: '<div id="map"></div>',
            link: link,
            controller: Ctrl
        };
    }]);