// leaflet.js
app
  .directive('map', [function(){


    function MapCtrl ($scope, Omnibox){

			this.initiateLayer = function (layer) {
				if (layer.type === "TMS" && layer.baselayer){
  				layer.leafletLayer = L.tileLayer(layer.url, {name:"Background", maxZoom: 22});
  			} else if (layer.type === "TMS" && !layer.baselayer){
          // TODO: Make this not suck. OMG.
          if (layer.url.split('/api/v1/').length > 0){
              var base = layer.url.split('=');
              var layer_types = base[1].split(',');
              for (var i in layer_types){
                if (layer_types[i] == 'knoop' || layer_types[i] == 'geslotenleiding'){
                  var url = base[0].replace('png', 'grid') + '=' + layer_types[i];
                  var leafletLayer = new L.UtfGrid(url, {
                    useJsonP: false
                  });
                  leafletLayer.on('click', function (e) {
                    if (e.data){
                      $scope.$apply(function(){
                        Omnibox.type = 'object_id';
                        Omnibox.showCards = true;
                        Omnibox.content = {
                          object_type: e.data.entity_name,
                          id: e.data.id,
                          data: e.data
                        }
                        console.log(e.data)
                      });
                    }
                  });
                  $scope.map.addLayer(leafletLayer);
                }
              }
            }
  				layer.leafletLayer = L.tileLayer(layer.url, {maxZoom: 22});
  			} else if (layer.type === "UTFGrid"){
  				layer.leafletLayer = new L.UtfGrid(layer.url, {
  					useJsonP: false
  				});
          layer.leafletLayer.on('click', function (e) {
            if (e.data){
              $scope.$apply(function(){
                Omnibox.type = 'object_id';
                Omnibox.showCards = true;
                Omnibox.content = {
                  object_type: e.data.entity_name,
                  id: e.data.id,
                  data: e.data
                }
              });
            }
          });
  			} else if (layer.type === "WMS"){
          // TODO: fix something more robust for WMS layers.
          // It works when the layer.url defines the layer name
          // and the wms server is hardcoded
          wms = 'http://geoserver1-3di.lizard.net/geoserver/gwc/service/wms';
          layer.leafletLayer = L.tileLayer.wms(wms, {
            layers: layer.url,
            format: 'image/png',
            version: '1.1.1' });
  			} else if (layer.type === "GeoJSON"){
					layer.leafletLayer = new L.TileLayer.GeoJSON(layer.url);
  			} else {
  				console.log(layer.type);
  			}
  			layer.initiated = true;
			};


        // expects a layer hashtable with a leafletlayer object
        this.toggleLayer = function(layer){
        	if (!layer.active){
        		if (layer.leafletLayer){
            	$scope.map.removeLayer(layer.leafletLayer);       		
          	} else {
          		console.log('leaflet layer not defined', layer.type);
          	}
        	} else {
         		if (layer.leafletLayer){
            	$scope.map.addLayer(layer.leafletLayer);       		
          	} else {
          		console.log('leaflet layer not defined', layer.type);
          	}
        	}
        };

        // expects a layer hashtable with a leafletlayer object
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
        };

        // Expects a leafletLayer as an argument
	      this.addLayer = function (layer) {
	        $scope.map.addLayer(layer);
	      };

        // Expects a leafletLayer as an argument
	      this.removeLayer = function (layer) {
	        $scope.map.removeLayer(layer);
	      };

	      this.panZoomTo = function (panZoom) {
          $scope.map.setView(new L.LatLng(panZoom.lat, panZoom.lng), panZoom.zoom);
        };
    };

    var link = function (scope, element, attrs){
    	// instead of 'map' element here for testability
    	var map = new L.map(element[0], {
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

app.directive('panZoom', [function(){
  return {
    require: 'map',
    link: function(scope, elements, attrs, MapCtrl) {

      scope.$watch('panZoom', function (){
        if (scope.panZoom !== null){
          if (scope.panZoom.hasOwnProperty('lat') && 
            scope.panZoom.hasOwnProperty('lng') &&
            scope.panZoom.hasOwnProperty('zoom') ){
           MapCtrl.panZoomTo(scope.panZoom);
          }
        }
      });
    }
  };
}]);
