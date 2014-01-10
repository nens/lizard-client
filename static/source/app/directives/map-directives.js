// leaflet.js
app
  .directive('map', [function () {

    // WTF?
    var newValue = function () {
      var variable = 1;
    };

    /**
     * Control function for this directive
     */
    var MapCtrl  = function ($scope, $location) {
    // TODO: Make this not suck.
      this.initiateLayer = function (layer) {
        if (layer.name === "Simulatie") {
          // Hack for 3Di.
          //console.log("Initiate 3Di");
          layer.follow_3di = false;
        } else if (layer.type === "TMS" && layer.baselayer) {
          layer.leafletLayer = L.tileLayer(layer.url + '.png',
                                           {name: "Background", maxZoom: 20});
        } else if (layer.type === "TMS" && !layer.baselayer) {
          layer.leafletLayer = L.tileLayer(layer.url + '.png',
                                           {minZoom: layer.min_zoom, maxZoom: 20, zIndex: layer.z_index});
        } else if (layer.type === "WMS") {
          var options = {
            layers: layer.slug,
            format: 'image/png',
            version: '1.1.1',
            minZoom: layer.min_zoom,
            maxZoom: 20
          };
          //NOTE ugly hack
          if (layer.slug === 'landuse') {
            options.styles = 'landuse';
          } else if (layer.slug === 'elevation') {
            // dynamically set min/max?
            // options.effects = 'shade:0:3';
            options.styles = 'jet:-5:20';
          }
          layer.leafletLayer = L.tileLayer.wms(layer.url, options);
        } else if (layer.type === "ASSET") {
          var url = '/api/v1/tiles/{slug}/{z}/{x}/{y}.{ext}';
          layer.grid_layers = [];
          for (var i in layer.sublayers) {
            var sublayer = layer.sublayers[i];
            if (sublayer.min_zoom_click !== null) {
              var leafletLayer = new L.UtfGrid(url, {
                ext: 'grid',
                slug: sublayer.asset,
                name: sublayer.asset,
                useJsonP: false,
                minZoom: layer.min_zoom_click,
                maxZoom: 20
              });
              leafletLayer.on('click', function (e) {
                if (e.data){
                  $scope.getTimeseries(e.data);
                }
              });
              layer.grid_layers.push(leafletLayer);
            }
          }
          layer.leafletLayer = L.tileLayer(url, {
            ext: 'png',
            slug: layer.slug,
            name: layer.slug,
            minZoom: layer.min_zoom,
            maxZoom: 20,
            zIndex: layer.z_index
          });
        } else {
          console.log(layer.type);
        }
        layer.initiated = true;
      };


        // expects a layer hashtable with a leafletlayer object
      this.toggleLayer = function (layer) {
        // 3Di hack
        if (layer.name === "Simulatie") {
          //console.log("Toggle 3Di layer " + layer.active);
          if (layer.active) {
            // $scope.threediTool();
            $scope.connect();
          } else {
            $scope.disconnect();
          }
          return;
        }
        if (!layer.active) {
          if (layer.leafletLayer) {
            $scope.map.removeLayer(layer.leafletLayer);
            if (layer.grid_layers) {
              for (var i in layer.grid_layers) {
                $scope.map.removeLayer(layer.grid_layers[i]);
              }
            }
          } else {
            console.log('leaflet layer not defined', layer.type);
          }
        } else {
          if (layer.leafletLayer) {
            $scope.map.addLayer(layer.leafletLayer);
            if (layer.grid_layers) {
              for (var j in layer.grid_layers) {
                $scope.map.addLayer(layer.grid_layers[j]);
              }
            }
          } else {
            console.log('leaflet layer not defined', layer.type);
          }
        }
      };

      // expects a layer hashtable with a leafletlayer object
      this.toggleBaseLayer = function (layer) {
        //var layers = $scope.map._layers;
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
            //if (layer.name === 'Satellite') {
              //layer.leafletLayer.getContainer().classList.add('faded-gray');
            //}
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

      this.moveEnd = function (lat, lng, zoom) {
        // console.log('moveEnd!', $location.path());
        $location.path(lat + ',' + lng + ',' + zoom);
        // $location.path($scope.map.getCenter().lat.toString() + ',' + $scope.map.getCenter().lng.toString() + ',' + $scope.map.getZoom().toString());
      };

      this.map = function () {return $scope.map; };// make map object available to outside world.
      
      this.zoomToTheMagic = function (layer) {
        //console.log('zoomToTheMagic');
        // TODO: make this not hardcoded. And make this a nice UX instead of a brutal one
        if (layer.name === 'Riolering') {
          $scope.map.setView([52.503265633642194, 4.968782196044922], 14, {animate: true});
        }
        if (layer.name === 'Kunstwerken') {
          $scope.map.setView([52.60763454517434, 4.794158935546875], 12, {animate: true});
        }
        if (layer.name === 'Watergangen') {
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

          L.marker(e.latlng).addTo($scope.map)
            .bindPopup("You are within " + radius + " meters from this point").openPopup();

          L.circle(e.latlng, radius).addTo($scope.map);
        }

        function onLocationError(e) {
          alert(e.message);
        }

        $scope.map.on('locationfound', onLocationFound);
        $scope.map.on('locationerror', onLocationError);

        $scope.map.locate({setView: true, maxZoom: 16});
      };
    };


    /**
     * Link function for this directive
     */
    var link = function (scope, element, attrs, ctrl) {
      // Leaflet global variable to speed up vector layer, 
      // see: http://leafletjs.com/reference.html#path-canvas
      window.L_PREFER_CANVAS = true;
      // instead of 'map' element here for testability
      var osmAttrib='Map data © OpenStreetMap contributors';
      var map = new L.map(element[0], {
          center: new L.LatLng(52.27, 5.5698782),
          zoomControl: false,
          zoom: 8
        });
      map.attributionControl.addAttribution(osmAttrib);
      map.attributionControl.setPrefix('');

      scope.$watch('searchMarkers', function (newValue, oldValue) {
        if (newValue) {
          for (var i in scope.searchMarkers) {
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
        }
      }, true);

      // NOTE check if this is necessary
      scope.map = map;

      // first time is not triggered until move.
      if (scope.mapState) {
        scope.mapState.bounds = scope.map.getBounds();
        scope.mapState.geom_wkt = "POLYGON(("
              + scope.mapState.bounds.getWest() + " " + scope.mapState.bounds.getSouth() + ", "
              + scope.mapState.bounds.getEast() + " " + scope.mapState.bounds.getSouth() + ", "
              + scope.mapState.bounds.getEast() + " " + scope.mapState.bounds.getNorth() + ", "
              + scope.mapState.bounds.getWest() + " " + scope.mapState.bounds.getNorth() + ", "
              + scope.mapState.bounds.getWest() + " " + scope.mapState.bounds.getSouth()
              + "))";
      }

      scope.beenThreDoneIntersectSuggestion = false;
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

      scope.map.on('move', function () {
        // NOTE: Check whether a $digest is already happening before using apply
        if(!scope.$$phase) {
          scope.$apply(function () {
            scope.mapState.moved = Date.now();
            scope.mapState.bounds = scope.map.getBounds();
          });  
        } else {
          scope.mapState.moved = Date.now();
            scope.mapState.bounds = scope.map.getBounds();
        }
      });

      scope.map.on('dragend', function () {
        if (scope.box.type === 'default') {
        // scope.box.type = 'empty';
          scope.$apply(function () {
            scope.box.close();
          });
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
  }
]);

app.directive('moveEnd', [function () {
  return {
    require: 'map',
    link: function (scope, elements, attrs, MapCtrl) {
      
      scope.$watch('moveend', function (newValue, oldValue) {
        if (newValue) {
          MapCtrl.moveEnd(scope.map.getCenter().lat.toString(), scope.map.getCenter().lng.toString(), scope.map.getZoom().toString());
        }
      });
    },
    restrict: 'A'
  };
}]);

// NOTE this whole directive should go; fix with ng-click and map-controller
// functions
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

// NOTE: this whole directive should go; fix with ng-click and map-controller
// functions
app.directive('panZoom', [function () {
  return {
    require: 'map',
    link: function (scope, elements, attrs, MapCtrl) {
      scope.$watch('panZoom', function () {
        if (scope.panZoom !== undefined) {
          if (scope.panZoom.hasOwnProperty('lat') &&
            scope.panZoom.hasOwnProperty('lng') &&
            scope.panZoom.hasOwnProperty('zoom')) {
            MapCtrl.panZoomTo(scope.panZoom);
          }
        }
      });
    }
  };
}]);

// NOTE: what does this layer do?
app.directive('locate', function () {
  return {
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {
      scope.$watch('locate', function () {
        if (scope.locate !== undefined) {
          mapCtrl.locateMe();
        }
      });
    }
  };
});

// NOTE: this should probably go to main directive
app.directive('zoomToLayer', function () {
  return {
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {
      scope.$watch('zoomToLayer', function () {
        if (scope.zoomToLayer !== undefined) {
          mapCtrl.zoomToTheMagic(scope.layerToZoomTo);
        }
      });
    }
  };
});

// NOTE: read geojson layer, geojson support should be in main map directive
//
app.directive('sewerage', function ($http) {
  return {
    restrict: 'A',
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      scope.$watch('tools.active', function () {
        if (scope.tools.active === "sewerage") {
          for (var mapLayer in scope.mapState.layers) {
            var layer = scope.mapState.layers[mapLayer];
            if (layer.name === 'Riolering') {
              // NOTE: disable alerts
              layer.active = true;
              scope.mapState.changed = Date.now();
            }
          }
          scope.timeState.timeline.data.sewerage = scope.formatted_geojsondata;
        } else {
          for (var mapLayer in scope.mapState.layers) {
            var layer = scope.mapState.layers[mapLayer];
            if (layer.name === 'Riolering') {
              // NOTE: disable alerts
              layer.active = false;
              scope.mapState.changed = Date.now();
            }
          }
        }
      });

      var pumpstationLayer,
          rawGeojsondata,
          formatted_geojsondata;

      scope.$watch('mapState.changed', function () {
        var layer;
        for (var mapLayer in scope.mapState.layers) {
          var layer = scope.mapState.layers[mapLayer];
          if (layer.name === 'Riolering' && layer.active) {
            // NOTE: disable alerts
            // NOTE: this should not be here.
            mapCtrl.addLayer(pumpstationLayer);
          } else if (layer.name === 'Riolering' && !layer.active) {
            if (pumpstationLayer) {
              mapCtrl.removeLayer(pumpstationLayer);
            }
          }
        }
      });

      scope.$watch('box.content.sewerage.id', function () {
        if (scope.box.content.sewerage) {
          //NOTE: do this with d3
          $('.pumpstation_sewerage').removeClass('selected');
          $('#pumpstation_' + scope.box.content.sewerage.id).addClass('selected');
        }
      });
   
      var events = '/static/data/pumpstation_sewerage_integration.geojson';
      $http.get(events)
        .success(function (data) {
          createGeoJsonLayer(data);
          function format(data) {
            var formatted = [];
            for (var single in data.features ) {
              var feature = data.features[single];
              if (feature.properties.events) {
                for (var i in feature.properties.events) {
                  var date = Date.parse(feature.properties.events[i].timestamp);
                  formatted.push({
                    date: date,
                    value: feature.properties.id
                  });
                }
              }
            }
            return formatted;
          }
          scope.formatted_geojsondata = format(data);
          scope.timeState.changedZoom = !scope.timeState.changedZoom;
          scope.box.content.isw.count = 0;
          scope.rawGeojsondata = data;
        });

      var createGeoJsonLayer = function (data) {
        pumpstationLayer = new L.GeoJSON(data, {
          pointToLayer: function (geojson, latlng) {
            var pumpid = geojson.properties.id;
            var cssclass = '';
            if (geojson.properties.events) {
              cssclass = "exceeded";
            }
            var pumpIcon = new L.DivIcon({
              html: '<span class="pumpstation_sewerage ' + cssclass  + '" id = "pumpstation' + pumpid + '">&</span>',
              iconAnchor: new L.Point(20, 20)
            });
            var pumpMarker = new L.Marker(latlng, {icon: pumpIcon});

            pumpMarker.on('click', function (e) {
              this.feature.properties.entity_name = 'pumpstation_sewerage';
              scope.getTimeseries(this.feature.properties, 'nochange');
              scope.box.content.sewerage = {
                start_level: this.feature.properties.start_level,
                stop_level: this.feature.properties.stop_level,
                capacity: this.feature.properties.capacity,
                type: this.feature.properties.type,
                id: this.feature.properties.id
              };
            });
            return pumpMarker;
          }
        });
      };
    }
  };
});

app.directive('rain', function () {
  return {
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {
      var imageBounds = [[54.28458617998074, 1.324296158471368], [49.82567047026146, 8.992548357936204]];
      var imageOverlay =  L.imageOverlay('', imageBounds, {opacity: 0.8});
      scope.$watch('rain.enabled', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          if (newVal) {
            mapCtrl.addLayer(imageOverlay);
          } else {
            mapCtrl.removeLayer(imageOverlay);
          }
        }
      });

      scope.$watch('rain.currentFrame', function (newVal, oldVal) {
        if (newVal === oldVal) { return; }
        if (imageOverlay != undefined) {
          var imgFromStorage = localStorage.getItem(scope.rain.currentFrame);
          imageOverlay.setUrl(imgFromStorage);
          imageOverlay.setOpacity(0.8);
          if (scope.rain.currentFrame === null) {
            imageOverlay.setOpacity(0);
          }
        }
      });
    }
  };
});
