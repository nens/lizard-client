// leaflet.js
app
  .directive('map', [function(){
    function MapCtrl ($scope, CabinetService, Omnibox){

      this.initiateLayer = function (layer) {
        if (layer.type === "TMS" && layer.baselayer){
          layer.leafletLayer = L.tileLayer(layer.url, {name:"Background"});
        } else if (layer.type === "TMS" && !layer.baselayer){
          layer.leafletLayer = L.tileLayer(layer.url);
        } else if (layer.type === "UTFGrid"){
          layer.leafletLayer = new L.UtfGrid(layer.url,
            {
              useJsonP: false
            });
          layer.leafletLayer.on('mouseover', function (e) {
            console.log('mouseover', e);
          });
          layer.leafletLayer.on('click', function (e) {
              //click events are fired with e.data==null if an area with no hit is clicked
              if (e) {
                  CabinetService.timeseries.get({id: e.data.id}, function(data) {
                    console.log('CabinetService.timeseries.get() called', data);
                    $scope.graph = data.results;
                    console.log($scope);
                    Omnibox.open('graph');
                  });
                  console.log('click: ' + e.data.id);
              } else {
                  console.log('click: nothing');
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
          var style = {
            radius: 10,
            fillColor: "#1CA9C9",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 1
          };
          layer.leafletLayer = new L.TileLayer.GeoJSON(layer.url,{},{
            style: style,
            onEachFeature: function(feature, layer) {
              // console.log(feature);
              // console.log(layer);
            },
            pointToLayer: function (feature, latlng) {
              return L.circleMarker(latlng, {})
              .on('click', function(e) {
                console.log(e.target.feature.properties.id);
                // CabinetService.timeseries.get({object_type:'knoop', id: e.target.feature.properties.id}, function(data) {
                CabinetService.timeseries.get({id: 5}, function(data) {
                  console.log('CabinetService.timeseries.get() called', data);
                  $scope.graph = data.results;
                  console.log($scope);
                  Omnibox.open('graph');
                });
              });
            }
          })
          .on('featureparse', function(e) {
            console.log('e', e);
          });

        } else {
          // console.log(layer.type);
        }
        layer.initiated = true;
      };


        this.toggleLayer = function(layer){
          if (!layer.active){
            if (layer.leafletLayer){
              $scope.map.removeLayer(layer.leafletLayer);
            } else {
              console.log('leaflet layer not defined', layer.name);
            }
          } else {
            if (layer.leafletLayer){
              $scope.map.addLayer(layer.leafletLayer);
            } else {
              console.log('leaflet layer not defined', layer.name);
            }
          }
        };

        this.toggleBaseLayer = function(layer){
          var layers = $scope.map._layers;
          if (!layer.active){
            if (layer.leafletLayer){
              $scope.map.removeLayer(layer.leafletLayer);
            } else {
              console.log('leaflet layer not defined', layer.name);
            }
          } else if (layer.active){
            if (layer.leafletLayer){
              $scope.map.addLayer(layer.leafletLayer);
              layer.leafletLayer.bringToBack();
            } else {
              console.log('leaflet layer not defined', layer.name);
            }
          }
        };

        this.panZoomTo = function (panZoom) {
          $scope.map.setView(new L.LatLng(panZoom.lat, panZoom.lng), panZoom.zoom);
        };
    }

    var link = function (scope, element, attrs){
    	// instead of 'map' element here for testability
    	var map = new L.map(element[0], {
          center: new L.LatLng(52.0992287, 5.5698782),
          zoomControl: false,
          zoom: 8
        });
      scope.map = map;
    };

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
            MapCtrl.initiateLayer(layer);
          }
          MapCtrl.toggleLayer(layer);
        }
      });
      scope.$watch('data.baselayerChanged', function (){
        for (var i in scope.data.baselayers){
          var layer = scope.data.baselayers[i];
          if (!layer.initiated){
            MapCtrl.initiateLayer(layer);
          }
          MapCtrl.toggleBaseLayer(layer);
        }
      });
    }
  };
}]);

app.directive('panZoom', [function(){
  return {
    require: 'map',
    link: function(scope, elements, attrs, MapCtrl) {
        console.log('panZoom', scope.panZoom, scope)
      scope.$watch('panZoom', function (){
        if (scope.panZoom !== null){
          console.log('hoi')
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
