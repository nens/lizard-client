// leaflet.js
app
    .directive('map', ['$rootScope', 'Omnibox', function(Omnibox){

      var addLayers = function (map, layers){
      	for (var i in layers){
      		var layer = layers[i];
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
            wms = 'http://geoserver1-3di.lizard.net/geoserver/gwc/service/wms';
            layer.leafletLayer = L.tileLayer.wms(wms, {
              layers: layer.url,
              format: 'image/png',
              version: '1.1.1' });
    			} else {
    				console.log(layer.type);
    			}
    			if (layer.leafletLayer && layer.active){
      			map.addLayer(layer.leafletLayer);      				
    			}
      	}
			};

			var addGroup = function (map, layerids, layers){
				Array.prototype.map(layerids, function(id){
					for (var i in layers){
						if (layers[i] === id){
							layers[i].active = true;
							map.addLayer(layers[i].leafletLayer);
						} else if (!layers[i].baselayer && layers[i].active){
							layers[i].active = false;
							map.removeLayer(layers[i].leafletLayer);
						}
					}
				});
			};

			var removeGroup = function (map, layerids, layers){
				Array.prototype.map(layerids, function(id){
					for (var i in layers){
						if (layers[i] === id){
							layers[i].active = false;
							layers[i].removeLayer(layers[i].leafletLayer);
						}
					}
				});
			};


        var link = function (scope, element, attrs, controller) {
            var map = new L.map(element[0], {
            center: new L.LatLng(52.0992287, 5.5698782),
            zoomControl: false,
            zoom: 8
          });

            map.on('click', function(e){
                scope.$apply(function(){
                    console.log(Omnibox);
                    Omnibox.open('graph');
                });
            });

            scope.$watch('layers', function(){
            		addLayers(map, scope.layers);
            		console.log(scope.layers);
                // addDefaultLayers(map, scope.layergroups);

            });

          scope.$on('LayerSwitched', function(event, layer) {
            console.log("layer switched", layer);
            if (layer.leafletLayer){
	            if (layer.active === true) {
	              map.addLayer(layer.leafletLayer);
	            }
	            if (layer.active === false) {
	              map.removeLayer(layer.leafletLayer);
	            }
            }
          });

          scope.$on('LayerGroupSwitched', function(event, layergroup, layers) {
            console.log("layergroup switched", layergroup);
            if (layergroup.active === true) {
	              addGroup(map, layergroup.layers, layers)
	            }
	          if (layergroup.active === false) {
	              removeGroup(map, layergroup.layers, layers);
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
            // $scope.addDefaultLayers = addDefaultLayers;
            $scope.map = map;
        };

        return {
            restrict: 'E',
            replace: true,
            template: '<div id="map"></div>',
            link: link,
            scope: {
            	layers: '='
            },
            controller: Ctrl
        };
    }]);