// leaflet.js
app
    .directive('leaflet', [function(){


      function LeafletCtrl ($scope){

 				this.addLayers = function (map, layers){
	      	for (var i in layers){
	      		var layer = layers[i];
	    			if (layer.type === "TMS" && layer.baselayer){
	    				layer.leafletLayer = L.tileLayer(layer.url, {name:"Background"});
	    			} else if (layer.type === "TMS" && !layer.baselayer){
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
	    			// if (layer.leafletLayer && layer.active){
	      	// 		// map.addLayer(layer.leafletLayer);      				
	    			// }
	      	}
				};


          this.toggleLayer = function(layer){
          	if (layer.active){
          		if (layer.leafletLayer){
	            	$scope.map.removeLayer(layer.leafletLayer);       		
            	} else {
            		console.log('leaflet layer not defined');
            	}
          	} else {
           		if (layer.leafletLayer){
	            	$scope.map.addLayer(layer.leafletLayer);       		
            	} else {
            		console.log('leaflet layer not defined');
            	}
          	}
          }

	        this.toggleBaseLayer = function(layer){
	        	var layers = $scope.map._layers
	        	for (var i in layers){
	        		if (layers[i].options.name ==="Background" && !layer.active){
	        			$scope.map.removeLayer(layers[i]);
	        		}
	        	}
          	if (!layer.active){
          		if (layer.leafletLayer){
	            	$scope.map.removeLayer(layer.leafletLayer);       		
            	} else {
            		console.log('leaflet layer not defined');
            	}
          	} else if (layer.active){
           		if (layer.leafletLayer){
	            	$scope.map.addLayer(layer.leafletLayer);
	            	layer.leafletLayer.bringToBack()
            	} else {
            		console.log('leaflet layer not defined');
            	}
          	}
          }

      };

    return {
        restrict: 'E',
        controller: LeafletCtrl
    };
}]);


app.directive('map', [function(){
	return {
		require: 'leaflet',
		link: function(scope, element, attrs, Ctrl) {
	     var map = new L.map(element[0], {
            center: new L.LatLng(52.0992287, 5.5698782),
            zoomControl: false,
            zoom: 8
          });
	     scope.map = map; 
		},
		restrict: 'A',
		replace: true,
	  template: '<div id="map"></div>'
	}
}]);


app.directive('layerSwitch', [function(){
	return {
		require: 'leaflet',
		link: function(scope, elements, attrs, Ctrl) {
			scope.$watch('map', function(){
				if (scope.map){

					Ctrl.addLayers(scope.map, scope.layers);
					Ctrl.addLayers(scope.map, scope.baselayers);

					// Ctrl.toggleLayer(scope.layer)	
				}
			});

			scope.$watch('layer.active', function(){
				if (scope.layer.baselayer){
					Ctrl.toggleBaseLayer(scope.layer);				
				} else {
					Ctrl.toggleLayer(scope.layer);			
				}
			})
		},
		restrict: 'A',
	}
}]);