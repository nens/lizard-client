// leaflet.js
app
  .directive('map', ['$location', function (location) {

    // WTF?
    var newValue = function () {
      var variable = 1;
    };

    /**
     * Control function for this directive
     */
    var MapCtrl  = function ($scope, $location, $timeout) {

      $scope.$watch('locationHashChanged', function (n, o) {
        if (n === o) { return true; } else {
          var latlonzoom = $location.hash().split(',');
          if (latlonzoom.length >= 3) { // must have 3 parameters or don't setView here...
            if (parseFloat(latlonzoom[0]) && parseFloat(latlonzoom[1]) && parseFloat(latlonzoom[2])) {
              $scope.map.setView([latlonzoom[0], latlonzoom[1]], latlonzoom[2], {reset: false, animate: false});
            }
          }
        }
      });

      $scope.$on('$locationChangeSuccess', function (e, oldurl, newurl) {
        // Set locationHashChanged variable to the new url. 
        // locationsHashChanged is being $watched above
        $scope.locationHashChanged = newurl;
      });

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
          if (layer.min_zoom_click !== null) {
            var leafletLayer = new L.UtfGrid(url, {
              ext: 'grid',
              slug: layer.slug,
              name: layer.slug,
              useJsonP: false,
              minZoom: layer.min_zoom_click,
              maxZoom: 20
            });
            leafletLayer.on('click', function (e) {
              if (e.data) {
                if (e.data.entity_name === 'pumpstation_sewerage'
                  || e.data.entity_name === 'pumpstation_non_sewerage') {
                  // NOTE: Preferably this is only called when the object contains timeseries
                  // but the getTimeseries does a lot more than just getting timeseries
                  //$scope.getTimeseries(e.data);
                  return true;
                }
                if (e.data.geom) {
                  clickGeometry(angular.fromJson(e.data.geom), e.data.entity_name);
                  // Preferably this is only called when the object contains timeseries
                  // but the getTimeseries does a lot more than just getting timeseries
                  $scope.getTimeseries(e.data);
                } else {
                  console.info("You clicked on an object from negative space");
                }
              } else {
                clickInSpace(e.latlng);
                $scope.$apply(function () {
                  angular.extend($scope.activeObject, e.data);
                  $scope.activeObject.latlng = e.latlng;
                  $scope.activeObject.changed = !$scope.activeObject.changed;
                });
              }
            });
            layer.grid_layers.push(leafletLayer);
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

      /**
       * Draws visible feedback on the map after a click
       *
       * Removes possible click feedback layer and creates a new clickLayer
       * containing a circle. The circle is than vibrated to attract attention
       *
       * @param {object} latLng Leaflet object specifying the latitude
       * and longitude of a click
       */
      var removeProm;
      var clickInSpace = function (latLng) {
        $timeout.cancel(removeProm);
        if ($scope.mapState.clickLayer) {
          $scope.map.removeLayer($scope.mapState.clickLayer);
          delete $scope.mapState.clickLayer;
        }
        $scope.mapState.clickLayer = L.circleMarker(latLng, {
          radius: 0,
          opacity: 0.6,
          color: "#1abc9c"
        });
        $scope.mapState.clickLayer.addTo($scope.map);
        var selection = d3.select($scope.mapState.clickLayer._container);

        selection.select("path")
          .transition().duration(150)
          .attr("stroke-width", 20)
          .transition().duration(150)
          .attr("stroke-width", 5)
          .transition().duration(150)
          .attr("stroke-width", 15)
          .transition().duration(150)
          .attr("stroke-opacity", 0.5)
          .attr("stroke-width", 10);

        if ($scope.box.type === 'empty') {
          removeProm = $timeout(function () {
            $scope.map.removeLayer($scope.mapState.clickLayer);
          }, 1500);
        }
      };

      /**
       * Draws a circle around an object on click.
       *
       * Removes possible click feedback layer and creates a new clickLayer
       * containing a circle. The circle is vibrated to attract attention.
       *
       * @param {object} geometry Geojson compliant geometry object coming
       *  from UTFgrid
       * @param {string} entityName Name of the object to give it custom
       *  styling
       */
      var clickGeometry = function (geometry, entityName) {
        if ($scope.mapState.clickLayer) {
          $scope.map.removeLayer($scope.mapState.clickLayer);
          delete $scope.mapState.clickLayer;
        }

        var geojsonFeature = { "type": "Feature" };
        geojsonFeature.geometry = geometry;

        //Put geometry in leaflet geojson layer
        $scope.mapState.clickLayer = L.geoJson(geojsonFeature, {
          minZoom: 13,
          style: {},
          pointToLayer: function (feature, latlng) {
            this.circleMarker = L.circleMarker(latlng, {
              radius: 11.5,
              opacity: 0.5,
              fillOpacity: 0,
            });
            return this.circleMarker;
          }
        });
        $scope.mapState.clickLayer.addTo($scope.map);

        // Manually edit with d3
        // Due to some leaflet obscurity you have to get the first item with an unknown key.
        var layer = $scope.mapState.clickLayer._layers;
        var selection;
        for (var key in layer) {
          selection = d3.select(layer[key]._container);
          break;
        }

        selection.select("path")
          .attr("stroke", "#1abc9c")
          .transition().duration(150)
          .attr("stroke-width", 20)
          .transition().duration(150)
          .attr("stroke-width", 5)
          .transition().duration(150)
          .attr("stroke-width", 15)
          .transition().duration(150)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", 5);

        // Entity specific modifications
        if (entityName.indexOf("pumpstation") !== -1) {
          selection.attr("transform", "translate(0, 5)");
        } else if (entityName.indexOf("pipe") !== -1) {
          selection.select("path").transition().delay(450).duration(150)
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", 10);
        } else if (entityName === 'manhole') {
          selection.attr("transform", "translate(1, 0)");
          this.circleMarker.setRadius(7.5);
        }
      };

      /**
       * Watch to remove clicklayer when user clicks on omnibox close button.
       */
      $scope.$watch('box.type', function (n, o) {
        if (n === o) { return true; }
        if ($scope.mapState.clickLayer && $scope.box.type === 'empty') {
          $scope.map.removeLayer($scope.mapState.clickLayer);
          delete $scope.mapState.clickLayer;
        }
      });

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
        $location.path(lat + ',' + lng + ',' + zoom);
        // $location.path($scope.map.getCenter().lat.toString() + ',' + $scope.map.getCenter().lng.toString() + ',' + $scope.map.getZoom().toString());
      };

      // make map object available to outside world.
      this.map = function () {return $scope.map; };
      
      this.zoomToTheMagic = function (layer) {
        //console.log('zoomToTheMagic');
        // TODO: make this not hardcoded. And make this a nice UX instead of a brutal one
        if (layer.name === 'Afvalwater') {
          $scope.map.setView([52.503265633642194, 4.968782196044922], 14, {animate: true});
        }
        if (layer.name === 'Oppervlaktewater') {
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
     * Link function for this directive.
     */
    var link = function (scope, element, attrs, ctrl) {
      // Leaflet global variable to speed up vector layer, 
      // see: http://leafletjs.com/reference.html#path-canvas
      window.L_PREFER_CANVAS = true;
      // instead of 'map' element here for testability
      var osmAttrib = 'Map data © OpenStreetMap contributors';
      var bounds = window.data_bounds.all;
      var southWest = L.latLng(bounds.south, bounds.west);
      var northEast = L.latLng(bounds.north, bounds.east);
      var maxBounds = L.latLngBounds(southWest, northEast);
      var map = new L.map(element[0], {
          zoomControl: false,
          zoom: 12
        });
      map.fitBounds(maxBounds);
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

      scope.beenThereDoneIntersectSuggestion = false;

      scope.map.on('zoomstart', function () {
        clearTimeout(scope.zooming);
      });

      scope.map.on('movestart', function () {
        clearTimeout(scope.dragging);
      });

      scope.map.on('zoomend', function () {
        
        /**
         * NOTE: Somehow, this zoomend handler sometimes causes stuttering zoom behavior when zooming aggressively.
         */

        scope.zooming = setTimeout(function () {
          // console.log('changing hash due to zoom event!');
          location.hash(scope.map.getCenter().lat + ',' + scope.map.getCenter().lng + ',' + scope.map.getZoom());
        }, 1000);

        if (scope.map.getZoom() > 10 && scope.box.type === 'empty') {
          if (!scope.beenThereDoneIntersectSuggestion) {
            scope.beenThereDoneIntersectSuggestion = true;
            scope.box.type = 'intersecttool';
          }
        }
        // Hide and unhide clicklayer when zoomed out or in
        if (scope.mapState.clickLayer && scope.map.getZoom() < 13) {
          scope.map.removeLayer(scope.mapState.clickLayer);
        }
        if (scope.mapState.clickLayer && scope.map.getZoom() > 12) {
          scope.map.addLayer(scope.mapState.clickLayer);
        }
      });

      scope.map.on('move', function () {
        // NOTE: Check whether a $digest is already happening before using apply
        if (!scope.$$phase) {
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

        scope.dragging = setTimeout(function () {
          // console.log('changing hash due to drag event!');
          location.hash(scope.map.getCenter().lat + ',' +
                        scope.map.getCenter().lng + ',' +
                        scope.map.getZoom());
        }, 200);

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
        if (imageOverlay !== undefined) {
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
