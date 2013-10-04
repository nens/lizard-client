// leaflet.js
app
  .directive('map', [function () {

    function MapCtrl ($scope, $location){   
    // TODO: Make this not suck.
      this.initiateLayer = function (layer) {
        if (layer.type === "TMS" && layer.baselayer){
          layer.leafletLayer = L.tileLayer(layer.url + '.png', {name:"Background", maxZoom: 20});
        } else if (layer.type === "TMS" && !layer.baselayer){
          if (layer.url.split('/api/v1/').length > 0){
            if (layer.content !== null) {
                var layer_types = layer.content.split(',');
                for (var i in layer_types){
                  if (layer_types[i] == 'knoop' || layer_types[i] == 'geslotenleiding' || layer_types[i] == 'pumpstation'){
                    var url = layer.url + '.grid?object_types=' + layer_types[i];
                    var leafletLayer = new L.UtfGrid(url, {
                      useJsonP: false,
                      maxZoom: 20
                      // resolution: 2
                    });
                    leafletLayer.on('click', function (e) {
                      if (e.data){
                        $scope.getTimeseries(e.data);
                      }
                    });
                    $scope.map.addLayer(leafletLayer);
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
        if (!layer.active) {
          if (layer.leafletLayer) {
            $scope.map.removeLayer(layer.leafletLayer);
          } else {
            console.log('leaflet layer not defined', layer.type);
          }
        } else {
          if (layer.leafletLayer) {
            $scope.map.addLayer(layer.leafletLayer);
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

      this.moveEnd = function(lat,lng,zoom) {
        // console.log('moveEnd!', $location.path());
        $location.path(lat + ',' + lng + ',' + zoom);
        // $location.path($scope.map.getCenter().lat.toString() + ',' + $scope.map.getCenter().lng.toString() + ',' + $scope.map.getZoom().toString());
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

    }

    var link = function (scope, element, attrs, mapCtrl) {
      // instead of 'map' element here for testability
      var map = new L.map(element[0], {
          center: new L.LatLng(52.0992287, 5.5698782),
          zoomControl: false,
          zoom: 8
        });
      
      map.on('moveend', function(e) {
        console.log('bbox', map.getBounds());
        scope.bbox_update(scope.map.getBounds()._northEast.lng,scope.map.getBounds()._northEast.lat,scope.map.getBounds()._southWest.lng,scope.map.getBounds()._southWest.lat);
      });

      scope.$watch('searchMarkers', function(newValue, oldValue) {
        if(newValue)
          for(var i in scope.searchMarkers) {
              var cm = new L.CircleMarker(
                new L.LatLng(
                  scope.searchMarkers[i].geometry[1],
                  scope.searchMarkers[i].geometry[0]
                ),
                {
                  color: '#fff',
                  fillColor: '#3186cc',
                  fillOpacity: 0.0,
                  radius: 5
                }
              ).addTo(scope.map);
              cm.bindPopup(scope.searchMarkers[i].name);
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

          mapCtrl.moveEnd(scope.map.getCenter().lat.toString(), scope.map.getCenter().lng.toString(), scope.map.getZoom().toString());
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
    link: function (scope, element, attrs, mapCtrl) {
      scope.$watch('panZoom', function (){
        if (scope.panZoom !== undefined){
          if (scope.panZoom.hasOwnProperty('lat') &&
            scope.panZoom.hasOwnProperty('lng') &&
            scope.panZoom.hasOwnProperty('zoom') ) {
           mapCtrl.panZoomTo(scope.panZoom);
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
