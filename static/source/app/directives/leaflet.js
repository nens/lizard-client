// leaflet.js
app
  .directive('map', [function(){


    function MapCtrl ($scope){

			// this.addLayers = function (map, layers){
   //    	for (var i in layers){
   //    		var layer = layers[i];
   //  			if (layer.type === "TMS" && layer.baselayer){
   //  				layer.leafletLayer = L.tileLayer(layer.url, {name:"Background"});
   //  			} else if (layer.type === "TMS" && !layer.baselayer){
   //  				layer.leafletLayer = L.tileLayer(layer.url);
   //  			} else if (layer.type === "UTFGrid"){
   //  				layer.leafletLayer = L.UtfGrid(layer.url, {
   //  					JsonP: false
   //  				})
   //  			} else if (layer.type === "WMS"){
   //          // TODO: fix something more robust for WMS layers.
   //          // It works when the layer.url defines the layer name
   //          // and the wms server is hardcoded
   //          wms = 'http://geoserver1-3di.lizard.net/geoserver/gwc/service/wms';
   //          layer.leafletLayer = L.tileLayer.wms(wms, {
   //            layers: layer.url,
   //            format: 'image/png',
   //            version: '1.1.1' });
   //  			} else {
   //  				console.log(layer.type);
   //  			}
   //  			// if (layer.leafletLayer && layer.active){
   //    	// 		// map.addLayer(layer.leafletLayer);      				
   //  			// }
   //    	}
			// };

			this.initiateLayer = function (layer) {
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
  			layer.initiated = true;
			};


        this.toggleLayer = function(layer){
        	if (!layer.active){
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

    var link = function (scope, element, attrs){
    	var map = new L.map('map', {
          center: new L.LatLng(52.0992287, 5.5698782),
          zoomControl: false,
          zoom: 8
        });
    	scope.map = map;
    }

  return {
      restrict: 'E',
  		replace: true,
		  template: '<div id="map"></div>',
      controller: MapCtrl,
      link: link
  };
}]);





app.directive('layerSwitch', [function(){
	return {
		require: 'map',
		link: function(scope, elements, attrs, MapCtrl) {
    	scope.$watch('data.changed', function (){
    		for (var i in layers){
    			var layer = layers[i];
    			if (!layer.initiated){
	    			MapCtrl.initiateLayer(layer)  				
    			}
    			MapCtrl.toggleLayer(layer);
     		}
    	});
    	scope.$watch('data.baselayerChanged', function (){
    	  for (var i in scope.data.baselayers){
    			var layer = scope.data.baselayers[i];
    			if (!layer.initiated){
	    			MapCtrl.initiateLayer(layer)  				
    			}
   				MapCtrl.toggleBaseLayer(layer);
    		}
    	});
		},
		restrict: 'A',
	}
}]);