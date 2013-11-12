// leaflet.js
app
  .directive('map', [function () {

    function MapCtrl ($scope, $location){   
    // TODO: Make this not suck.
      this.initiateLayer = function (layer) {
        if (layer.name === "Simulatie") {
          // Hack for 3Di.
          console.log("Initiate 3Di");
          layer.follow_3di = false;
        } else if (layer.type === "TMS" && layer.baselayer){
          layer.leafletLayer = L.tileLayer(layer.url + '.png', {name:"Background", maxZoom: 20});
        } else if (layer.type === "TMS" && !layer.baselayer){
          if (layer.url.split('/api/v1/').length > 0){
            if (layer.content !== null) {
                var layer_types = layer.content.split(',');
                layer.grid_layers = [];
                for (var i in layer_types){
                  if (layer_types[i] == 'manhole' || layer_types[i] == 'pipe' || layer_types[i] == 'pumpstation_sewerage' || layer_types[i] == 'pumpstation_non_sewerage'){
                    var url = layer.url + '.grid?object_types=' + layer_types[i];
                    var leafletLayer = new L.UtfGrid(url, {
                      useJsonP: false,
                      maxZoom: 20
                      // resolution: 2
                    });
                    // leafletLayer.on('click', function (e) {
                    //   if (e.data){
                    //     $scope.getTimeseries(e.data);
                    //   }
                    // });
                    layer.grid_layers.push(leafletLayer);
                  }
                }
              }
            }
              var params = layer.content === '' ? '' : '?object_types=' + layer.content;
          layer.leafletLayer = L.tileLayer(layer.url + '.png' + params, {maxZoom: 20, zIndex: layer.z_index});
        } else if (layer.type === "WMS"){
          layer.leafletLayer = L.tileLayer.wms(layer.url, {
            layers: layer.content,
            format: 'image/png',
            version: '1.1.1',
            maxZoom: 20 });
        } else {
          console.log(layer.type);
        }
        layer.initiated = true;
      };


        // expects a layer hashtable with a leafletlayer object
        this.toggleLayer = function (layer) {
          // 3Di hack
          if (layer.name === "Simulatie") {
            console.log("Toggle 3Di layer " + layer.active);
            if (layer.active) {
              $scope.connect();
            } else {
              $scope.disconnect();
            }
            return
          }
          if (!layer.active) {
            if (layer.leafletLayergetTimes) {
              $scope.map.removeLayer(layer.leafletLayer);
              if (layer.grid_layers) {
                for (var i in layer.grid_layers){
                  $scope.map.removeLayer(layer.grid_layers[i])
                }
              }
            } else {
              console.log('leaflet layer not defined', layer.type);
            }
          } else {
            if (layer.leafletLayer) {
              $scope.map.addLayer(layer.leafletLayer);
              if (layer.grid_layers) {
                for (var i in layer.grid_layers){
                  $scope.map.addLayer(layer.grid_layers[i])
                }
              }
            } else {
              console.log('leaflet layer not defined', layer.type);
            }
          }
        };

        // expects a layer hashtable with a leafletlayer object
        this.toggleBaseLayer = function (layer) {
          var layers = $scope.map._layers;
          if (!layer.active) {
            if (layer.leafletLayer) {
              $scope.map.removeLayer(layer.leafletLayer);
            } else {
              console.log('leaflet layer not defined');
            }
          } else if (layer.active) {
            if (layer.leafletLayer) {
              $scope.map.addLayer(layer.leafletLayer);
              layer.leafletLayer.bringToBack();
              if (layer.name == 'Satellite') {
                layer.leafletLayer.getContainer().classList.add('faded-gray');
              }
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

        this.moveEnd = function(lat, lng, zoom) {
          // console.log('moveEnd!', $location.path());
          $location.path(lat + ',' + lng + ',' + zoom);
          // $location.path($scope.map.getCenter().lat.toString() + ',' + $scope.map.getCenter().lng.toString() + ',' + $scope.map.getZoom().toString());
        };

        this.map = function() {return $scope.map;}; // make map object available to outside world.
      
        this.zoomToTheMagic = function (layer) {
          console.log('zoomToTheMagic');
          // TODO: make this not hardcoded. And make this a nice UX instead of a brutal one
          if (layer.name == 'Riolering') {
            $scope.map.setView([52.503265633642194, 4.968782196044922], 14, {animate: true});
          }
          if (layer.name == 'Kunstwerken') {
            $scope.map.setView([52.60763454517434, 4.794158935546875], 12, {animate: true});
          }
          if (layer.name == 'Watergangen') {
            $scope.map.setView([52.60763454517434, 4.794158935546875], 11, { animate: true });
          }
          // This button is not available for 3Di
        };

        this.fitBounds = function (extent) {
          // extent is in format [[extent[0], extent[1]], [extent[2], extent[3]]]
          $scope.map.fitBounds(extent);
        };

    this.locateMe = function () {
        // $scope.map.locate({ setView: true });
        function onLocationFound(e) {
          var radius = e.accuracy / 2;

          L.marker(e.latlng).addTo(map)
            .bindPopup("You are within " + radius + " meters from this point").openPopup();

          L.circle(e.latlng, radius).addTo(map);
        }

        function onLocationError(e) {
          alert(e.message);
        }

        $scope.map.on('locationfound', onLocationFound);
        $scope.map.on('locationerror', onLocationError);

        $scope.map.locate({setView: true, maxZoom: 16});

        };

    };

    var link = function (scope, element, attrs, ctrl) {
      // instead of 'map' element here for testability
      var map = new L.map(element[0], {
          center: new L.LatLng(52.0992287, 5.5698782),
          zoomControl: false,
          zoom: 8
        });

      scope.$watch('searchMarkers', function(newValue, oldValue) {
        if(newValue)
          for(var i in scope.searchMarkers) {
              return;
              // var cm = new L.CircleMarker(
              //   new L.LatLng(
              //     scope.searchMarkers[i].geometry[1],
              //     scope.searchMarkers[i].geometry[0]
              //   ),
              //   {
              //     color: '#fff',
              //     fillColor: '#3186cc',
              //     fillOpacity: 0.0,
              //     radius: 5
              //   }
              // ).addTo(scope.map);
              // cm.bindPopup(scope.searchMarkers[i].name);
          }
      }, true);
      scope.map = map;

      scope.beenThreDoneIntersectSuggestion = false
      scope.map.on('zoomend', function () {
        if (scope.map.getZoom() > 10 && scope.box.type === 'empty') {
          if (!scope.beenThreDoneIntersectSuggestion) {
            scope.beenThreDoneIntersectSuggestion = true;
            scope.$apply(function () {
              scope.box.type = 'intersecttool';
            });
          }
        }
      });

      scope.map.on('moveend', function () {
        scope.mapState.moved = Date.now();
      });

      scope.map.on('dragend', function() {

          if (scope.box.type === 'default') {

            // scope.box.type = 'empty';
            scope.$apply(function () {
              scope.box.close();
            });
            console.debug(scope);
            console.debug(scope.box.type);
          }
          if (scope.box.type === 'intersecttool') {
            scope.$apply(function () {
              scope.box.type = 'empty';
            });
          }

      });

    };


  return {
      restrict: 'E',
      replace: true,
      template: '<div id="map"></div>',
      controller: MapCtrl,
      link: link
  };
}]);

app.directive('moveEnd', [function () {
  return {
    require: 'map',
    link: function(scope, elements, attrs, MapCtrl) {
      
      scope.$watch('moveend', function(newValue, oldValue) {
        if(newValue)
          MapCtrl.moveEnd(scope.map.getCenter().lat.toString(), scope.map.getCenter().lng.toString(), scope.map.getZoom().toString());
      });
    },
    restrict: 'A'
  };
}]);

app.directive('layerSwitch', [function () {
  return {
    require: 'map',
    link: function (scope, elements, attrs, MapCtrl) {
      scope.$watch('mapState.changed', function () {
        for (var i in layers) {
          var layer = layers[i];
          if (!layer.initiated) {
            MapCtrl.initiateLayer(layer);
          }
          MapCtrl.toggleLayer(layer);
        }
      });
      scope.$watch('mapState.baselayerChanged', function () {
        for (var i in scope.mapState.baselayers) {
          var layer = scope.mapState.baselayers[i];
          if (!layer.initiated) {
            MapCtrl.initiateLayer(layer);
          }
          MapCtrl.toggleBaseLayer(layer);
        }
      });
    },
    restrict: 'A'
  };
}]);

app.directive('panZoom', [function () {
  return {
    require: 'map',
    link: function (scope, elements, attrs, MapCtrl) {
      scope.$watch('panZoom', function (){
        if (scope.panZoom !== undefined){
          if (scope.panZoom.hasOwnProperty('lat') &&
            scope.panZoom.hasOwnProperty('lng') &&
            scope.panZoom.hasOwnProperty('zoom') ) {
           MapCtrl.panZoomTo(scope.panZoom);
          }
        }
      });
    }
  };
}]);

app.directive('locate', function(){
  return {
    require: 'map',
    link: function(scope, element, attrs, mapCtrl){
      scope.$watch('locate', function () {
        if (scope.locate !== undefined) {
          mapCtrl.locateMe();
        }
      });
    }
  }
});

app.directive('zoomToLayer', function () {
  return {
    require: 'map',
    link: function(scope, element, attrs, mapCtrl){
      scope.$watch('zoomToLayer', function () {
        if (scope.zoomToLayer !== undefined) {
          mapCtrl.zoomToTheMagic(scope.layerToZoomTo);
        }
      });
    }
  };
});

app.directive('sewerage', function ($http) {
  return {
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      scope.$watch('mapState.changed', function () {
        var layer;
        for (mapLayer in scope.mapState.layers) {
          layer = scope.mapState.layers[mapLayer];
          if (layer.name === 'Riolering' && layer.active) {
            mapCtrl.addLayer(pumpstationLayer);
          } else if (layer.name === 'Riolering' && !layer.active) {
            mapCtrl.removeLayer(pumpstationLayer);
          }
        }
      });
   
      var events = '/static/data/pumpstation_sewerage.geojson';
      $http.get(events)
        .success(function (data) {
          createGeoJsonLayer(data);  
          });

        var createGeoJsonLayer = function (data) {
          pumpstationLayer = new L.GeoJSON(data, {
            pointToLayer: function(geojson, latlng) {
              var pumpid = geojson.properties.id;
              var pumpIcon = new L.DivIcon({
                html: '<svg width="48" height="48" id=pumpstation_'+pumpid+' class="pumpstation_sewerage">' +
                '<g >' +
                '<path d="m 31.461905,37.742857 -20.966667,0 0,-2.233334 20.966667,0 -6.033333,-3.9 1.466666,-1.566666 10.1,6.566666 -10.1,6.5 -1.466666,-1.466666 6.033333,-3.9 m -13.6,-32.7333337 11.2,0 0,7.0999997 7.933333,0 0,13.1 -26.7,0 0,-13.1 7.566667,0 0,-7.0999997" class="pumpstation" style="font-size:30px"/>' +
                '</g>' +
                '</svg>',
                iconAnchor: new L.Point(20, 20)
              });
              var pumpMarker = new L.Marker(latlng, {icon: pumpIcon});

              pumpMarker.on('click', function (e) {
                this.feature.properties.entity_name = 'pumpstation_sewerage';
                scope.getTimeseries(this.feature.properties);
                // scope.$apply(function () {
                //   // scope.box.content.data = geojson;
                //   // scope.box.content.id = pumpid;
                //   scope.box.type = 'pumpstation_sewerage';
                // });

              })
              return pumpMarker;
            },
            minZoom: 12
          });
          
        } 
        
    }
  }
});

