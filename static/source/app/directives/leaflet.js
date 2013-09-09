// leaflet.js
angular.module('leaflet', [])
	.directive('map', [function(){

	  function addDefaultLayers(map, layergroups) {
	    for (var i = 0; i < layergroups.length; i ++) {
	      var layergroup = layergroups[i]
	      for (var j = 0; j < layergroup.layers.length; j ++) {
	        var layer = layergroup.layers[j];
	        if (layer.leafletLayer === undefined) {
	          if (layer.type == "WMS") {
	            // TODO: fix something more robust for WMS layers. 
	            // It works when the layer.url defines the layer name
	            // and the wms server is hardcoded
	            console.log(layer.type, layer);
	            wms = 'http://geoserver1-3di.lizard.net/geoserver/gwc/service/wms';
	            layer.leafletLayer = L.tileLayer.wms(wms, {
	              layers: layer.url,
	              format: 'image/png',
	              version: '1.1.1' });
	          }
	          else {
	            layer.leafletLayer = L.tileLayer(layer.url);
	          }
	        }
	        if (layer.active) {
	          map.addLayer(layer.leafletLayer);
	          if (layer.baselayer) {
	            layer.leafletLayer.bringToBack();
	          }
	        }
	      }
	    }
	  };

		var link = function (scope, element, attrs) {
			var map = new L.map(element[0], {
		    center: new L.LatLng(52.0992287, 5.5698782),
		    zoomControl: false,
		    zoom: 8
		  });

			// scope.$watch('layergroups', function(){
			// 	console.log(scope.layergroups)
			// 	addDefaultLayers(map, scope.layergroups)
			// })

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


		  scope.$on('LayersRetrieved', function(event, layer) {
		    addDefaultLayers(map, scope.layergroups);
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
			// scope: {
			// 	layergroups: '='
			// },
			link: link,
			controller: Ctrl
		}
	}]);