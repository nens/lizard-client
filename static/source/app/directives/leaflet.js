// leaflet.js
app
    .directive('map', ['$rootScope', 'Omnibox', function(Omnibox){
      function addDefaultLayers(map, layergroups) {

        var backgroundLayer_png   = new L.tileLayer('http://c.tiles.mapbox.com/v3/examples.map-szwdot65/{z}/{x}/{y}.png').addTo(map);

        // var geslotenleiding = new L.TileLayer.GeoJSON('/api/v1/tiles/{z}/{x}/{y}/.geojson?object_types=geslotenleiding').addTo(map);
        // var knoop = new L.TileLayer.GeoJSON('/api/v1/tiles/{z}/{x}/{y}/.geojson?object_types=knoop').addTo(map);
        // var watervlakken = new L.TileLayer.GeoJSON('http://tile.openstreetmap.us/vectiles-water-areas/{z}/{x}/{y}.json').addTo(map);


        var style = {
        "clickable": true,
        "color": "#00D",
        "fillColor": "#00D",
        "weight": 1.0,
        "opacity": 0.7,
        "fillOpacity": 0.8
        };
        var hoverStyle = {
        "fillOpacity": 0.8
        };

        var knopenLayer = new L.TileLayer.GeoJSON('/api/v1/tiles/{z}/{x}/{y}/.geojson?object_types=knoop', {}, {
                  style: style,
                  onEachFeature: function (feature, layer) {
                      if (feature.properties) {
                          var popupString = '<div class="">';
                          for (var k in feature.properties) {
                              var v = feature.properties[k];
                              popupString += k + ': ' + v + '<br />';
                          }
                          popupString += '</div>';
                          layer.bindPopup(popupString);
                      }
                      if (!(layer instanceof L.Point)) {
                          layer.on('click', function (e) {
                              
                              $rootScope.$broadcast('mapclick', e.target.feature.properties.id);
                              console.log('clicked on:', e.target.feature.properties.id);
                          });
                      }
                  }
              }
          ).addTo(map);

        var leidingenLayer = new L.TileLayer.GeoJSON('/api/v1/tiles/{z}/{x}/{y}/.geojson?object_types=geslotenleiding', {}, {
                  style: style,
                  onEachFeature: function (feature, layer) {
                      if (feature.properties) {
                          var popupString = '<div class="popup">';
                          for (var k in feature.properties) {
                              var v = feature.properties[k];
                              popupString += k + ': ' + v + '<br />';
                          }
                          popupString += '</div>';
                          layer.bindPopup(popupString);
                      }
                      if (!(layer instanceof L.Point)) {
                          layer.on('mouseover', function (e) {
                            console.log('feature id:', e.target.feature.properties.id);
                          });
                          layer.on('mouseout', function (e) {
                              // ...
                          });
                      }
                  }
              }
          ).addTo(map);


        knoop.on('click', function(e) {
          console.log('click:', e);
        });

        // console.log('map:', map);
        for (var i = 0; i < layergroups.length; i ++) {
          var layergroup = layergroups[i];
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
              else if(layer.type === "grid") {
                layer.leafletLayer = new L.UtfGrid('//dev1.nxt.lizard.net/api/v1/tiles/{z}/{x}/{y}/.grid?object_types=geslotenleiding', {
                    useJsonP: false
                });
                layer.leafletLayer.on('click', function (e) {
                    if (e.data) {
                        console.log('click: ' + e);
                    }
                });
                layer.leafletLayer.on('mouseover', function (e) {
                    console.log('mouseover: ' + e);
                });
              }
              else if(layer.type === 'geojson') {
                layer.geoJsonLayer = new L.TileLayer.GeoJSON('//dev1.nxt.lizard.net/api/v1/tiles/{z}/{x}/{y}/.geojson?object_types=geslotenleiding', {
                    clipTiles: true,
                    unique: function (feature) {
                        return feature.id;
                    }
                });
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
      }

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

            scope.$watch('layergroups', function(){
                addDefaultLayers(map, scope.layergroups);
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