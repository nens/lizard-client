'use strict';

// wtf.
document.ondblclick = function(e) {
    var clickObj = document.createElement("div"),
        inner = document.createElement("div");
    inner.className = "clickObj";
    clickObj.style.position = "absolute";
    clickObj.style.top = e.clientY + "px";
    clickObj.style.left = e.clientX + "px";
    this.body.appendChild(clickObj);
    clickObj.appendChild(inner);
    setTimeout(function() { clickObj.remove(); }, 1000);
};


var templatesUrl = '/static/source/app/templates/';

var app = angular.module("lizard-nxt", [
  'ngResource',
  'ui.event',
  'ui.highlight',
  'ui.keypress',
  'graph',
  'omnibox',
  'lizard-nxt.services']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('<%');
  $interpolateProvider.endSymbol('%>');
 });


app.controller("MasterCtrl",
  ["$scope", "$http" ,"CabinetService", "KpiService", 
  function ($scope, $http, CabinetService, KpiService)  {

  $scope.box = {
    query: null,
    disabled: false,
    showCards: false,
    type: 'default',
    content: {},
    changed: Date.now()
  };

  $scope.box.close = function () {
    $scope.box.type = 'empty';
    $scope.box.showCards = false;
  };

  $scope.geoLocate = function () {
    $scope.locate = !$scope.locate;
  };

  $scope.simulateSearch = function (keyword) {
    $scope.box.query = keyword;
    $scope.search();
  };

  // NOTE: DRY idiot.
  $scope.tools = {
    kpi: {
      enabled: false
    },
    profile: {
      enabled: false
    }
  };

// KPI START
  $scope.kpi = {
    kpichanged: true,
    thresholds: {'warning': 7, 'error': 5},
    categories: ['tevredenheid_burger',
                    'toestand_infrastructuur',
                    'omgevingseffect',
                    'goed_gebruik',
                    'planrealisatie'],
    cat_dict: { 'tevredenheid_burger': 'Tevredenheid',
                   'toestand_infrastructuur': 'Toestand',
                   'omgevingseffect': 'Omgevingseffect',
                   'goed_gebruik': 'Gebruik',
                   'planrealisatie': 'Planrealisatie'},
    kpiData: {},
    areadata: {},
    slct_area: null
  };

  $scope.$watch('kpi.panZoom', function(){
    $scope.panZoom = $scope.kpi.panZoom;
  });

  $scope.toggle_tool = function (name) {
    if ($scope.tools.hasOwnProperty(name)){
      $scope.tools[name].enabled = !$scope.tools[name].enabled;
    }
  };

  $scope.onAreaClick = function(area){
    $scope.$apply(function(){
      $scope.kpi.slct_area = area;
      $scope.kpi.kpichanged = !$scope.kpi.kpichanged;
    });
  };
// KPI END


// SEARCH-START
  $scope.searchMarkers = [];
  $scope.search = function ($event) {

    if ($scope.box.query.length > 1) {
      var search = CabinetService.termSearch.query({q: $scope.box.query}, function (data) {
          console.log(data);
          var sources = [];
          for (var i in data) {
            sources.push(data[i]);
          }
          $scope.searchMarkers.filter(function (v, i, a) { return a.indexOf (v) == i; });
          for (var j in sources) {
            console.log('sources:',sources);
            $scope.searchMarkers = [];
            if(sources[j].geometry) {
              $scope.searchMarkers.push(sources[j]);
            }
          }

          $scope.searchData = sources;
        });

      
      var geocode = CabinetService.geocode.query({q: $scope.box.query}, function (data) {
              console.log(data);
              $scope.box.content = data;
            });
      $scope.box.type = "location";
    }
  };

  $scope.bbox_update = function(bl_lat, bl_lon, tr_lat, tr_lon) {
    $scope.searchMarkers.filter(function (v, i, a) { return a.indexOf (v) == i; });
    var search = CabinetService.bboxSearch.query({
      bottom_left: bl_lat+','+bl_lon,
      top_right: tr_lat+','+tr_lon
    }, function (data) {
      $scope.searchMarkers = [];
      for(var i in data) {
        if(data[i].geometry) {
          $scope.searchMarkers.push(data[i]);
        }
      }
      console.log('bbox_update:', data);
    });
  };

  $scope.reset_query = function () {
      // clean stuff..
      // Search Ctrl is the parent of omnibox cards
      // therefore no need to call $rootScope.
      $scope.$broadcast('clean');
      $scope.box.query = null;
      $scope.box.type= 'empty';
  };

  $scope.showDetails = function (obj) {
      $scope.currentObject = obj;
      console.log('obj:', obj);
      if ($scope.currentObject.lat && $scope.currentObject.lon) {
          // A lat and lon are present, instruct the map to pan/zoom to it
          var latlng = {'lat': $scope.currentObject.lat, 'lon': $scope.currentObject.lon};
          $scope.panZoom = {
            lat: $scope.currentObject.lat,
            lng: $scope.currentObject.lon,
            zoom: 14
          };
      }
      else if ($scope.currentObject.geometry[0] && $scope.currentObject.geometry[1]) {
          $scope.panZoom = {
            lat: $scope.currentObject.geometry[1],
            lng: $scope.currentObject.geometry[0],
            zoom: 14
          };
      }
  };
// SEARCH-END


  $scope.mapState = {
    layergroups: CabinetService.layergroups,
    layers: CabinetService.layers,
    baselayers: CabinetService.baselayers,
    activeBaselayer: 3,
    changed: Date.now(),
    baselayerChanged: Date.now(),
    enabled: false
  };

  $scope.$on('PanZoomeroom', function(message, value){
    $scope.panZoom = value;
    console.log('PanZoomeroom', value);
  });

  $scope.switchBaseLayer = function(){
    for (var i in $scope.mapState.baselayers){
      if ($scope.mapState.baselayers[i].id == $scope.mapState.activeBaselayer){
        $scope.mapState.baselayers[i].active = true;
      } else {
        $scope.mapState.baselayers[i].active = false;
      }
    }
    $scope.mapState.baselayerChanged = Date.now();
  };

  $scope.toggleLayerGroup = function(layergroup){
    var grouplayers = layergroup.layers;
    for (var i in grouplayers){
      for (var j in $scope.mapState.layers){
        if ($scope.mapState.layers[j].id == grouplayers[i]){
          $scope.mapState.layers[j].active = layergroup.active;
        }
      }
    }
    $scope.mapState.changed = Date.now();
  };

  $scope.toggleLayerSwitcher = function () {
    if ($scope.mapState.enabled) {
      $scope.mapState.enabled = false;
      $scope.mapState.disabled = true;
      }
    else {
      $scope.mapState.enabled = true;
      $scope.mapState.disabled = false;
    }
  };

  $scope.changed = function() {
    $scope.mapState.changed = Date.now();
  };



  $scope.format_data = function (data) {
    if (data[0]){
    $scope.formatted_data = [];
      for (var i=0; i<data[0].values.length; i++){
        var xyobject = {
          date: data[1].values[i],
          value: data[0].values[i]
        };
        $scope.formatted_data.push(xyobject);
      }
    } else {
      $scope.formatted_data = undefined;
    }
    return $scope.formatted_data;
  };


  $scope.getTimeseries = function (data) {

    $scope.box.type = data.entity_name;
    $scope.box.showCards = true;
    $scope.box.content.object_type = data.entity_name;
    $scope.box.content.id = data.id;
    $scope.box.content.data = data;


    var new_data_get = CabinetService.timeseriesLocationObject.get({
      object_type: $scope.box.content.object_type,
      id: $scope.box.content.id
    }, function(response){
      $scope.timeseries = response.results;
      if ($scope.timeseries.length > 0){
        $scope.selected_timeseries = response.results[0];
      } else {
        $scope.selected_timeseries = undefined;
      }
    });
    $scope.metadata = {
        title: null,
        fromgrid: $scope.box.content.data,
        type: $scope.box.content.data.entity_name
     };


    // Otherwise changes are watched and called to often.
    if ($scope.box.content.timeseries_changed === undefined){
      $scope.box.content.timeseries_changed = true;
    } else {
      $scope.box.content.timeseries_changed = !$scope.box.content.timeseries_changed;
    }
  };

  // rewrite data to make d3 parseable
  var format_data = function (data) {
    var formatted_data = [];
    for (var i = 0; i < data.length; i++) {
      //NOTE: think of fix for nodata in d3
      var value = data[i][1] === null ? 0 : data[i][1];
      var xyobject = {
        distance: data[i][0],
        value: value
      };
      formatted_data.push(xyobject);
    }
    return formatted_data;
  };

  // define function to get profile data from server
  $scope.get_profile = function (linestring_wkt, srs) {
    // build url
    // NOTE: first part hardcoded
    var url = "api/v1/rasters/";
    url += "?raster_names=ahn2";
    url += "&geom=" + linestring_wkt;
    url += "&srs=" + srs;
    // get profile from server
    $http.get(url)
      .success(function (data) {
        var d3data = format_data(data);
        $scope.box.content = d3data;
        $scope.box.type = "profile";
      })
      .error(function (data) {
        //TODO: implement error function to return no data + message
        console.log("failed getting profile data from server");
      });
  };


}]);
var services = angular.module("lizard-nxt.services", ['ngResource']);

services.service("CabinetService", ["$resource",
  function ($resource, $rootScope) {

  var layergroups = window.layerGroups;
  var layers = window.layers;
  var baselayers = window.baseLayers;

  var termSearchResource,
      bboxSearchResource,
      geocodeResource,
      reverseGeocodeResource,
      apiLayerGroups,
      timeseriesLocationObjectResource,
      timeseriesResource;
  
  termSearchResource = $resource('/api/v1/search/',{isArray: true});
  bboxSearchResource = $resource('/api/v1/search/',{isArray: true});
  geocodeResource = $resource('/api/v1/geocode/');
  reverseGeocodeResource = $resource('/api/v1/reversegeocode/');
  timeseriesLocationObjectResource = $resource('/api/v1/timeseries/?object=:object_type$:id', {
    object_type: '@object_type',
    id: '@id'
  });
  // timeseriesResource = $resource('/api/v1/timeseries/:id/', {
  //   id: '@id'
  // });
  timeseriesResource = $resource('/static/data/tijdserie.json', {
    id: '@id'
  });


  return {
    layergroups: layergroups,
    layers: layers,
    baselayers: baselayers,
    termSearch: termSearchResource,
    bboxSearch: bboxSearchResource,
    geocode: geocodeResource,
    reverseGeocode: reverseGeocodeResource,
    timeseries: timeseriesResource,
    timeseriesLocationObject: timeseriesLocationObjectResource,
    panZoom: null
  };
}]);



//NOTE this seems like a superfluous service; let's try to get rid of it
services.service("Omnibox", [function () {
  var box = {
    query: null,
    disabled: false,
    showCards: false,
    type: 'empty',
    content: {},
    changed: Date.now()
  };

  // TODO: These functions should go to the directive
  box.open = function (type) {
    box.type = type;
    box.showCards = true;
  };

  box.close = function () {
    box.type = 'empty';
    box.showCards = false;
  };

  box.get_profile = function () {
    return "ok";
  };

  return box;
}]);

services.service("KpiService", function () {

});

app.directive('kpilayer', function () {
  return {
    restrict: "A",
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

      // init vars
      var areas = {};
      var styler = function (feature) {
        var style = {};
        style.fillOpacity = 0.4;
        style.fillColor = '#1a9850';
        style.color = '#1a9850';
        style.weight = 1;
        var kpi_cat = feature.properties[scope.kpi.slct_cat];
        var val_index = kpi_cat.dates.indexOf(scope.kpi.slct_date);
        var test_val = kpi_cat.values[val_index];
        if (test_val === 0) {
          style.fillColor = '#EEE';
          style.color = '#EEE';
        } else if (test_val < scope.kpi.thresholds.warning &&
            test_val > scope.kpi.thresholds.error) {
          style.fillColor = '#F87217';
          style.color = '#F87217';
        } else if (test_val <= scope.kpi.thresholds.error) {
          style.fillColor = '#d73027';
          style.color = '#d73027';
        }
        if (feature.properties.name === scope.kpi.slct_area) {
          style.fillOpacity = 0.8;
          style.weight = 5;
        }
        return style;
      };

      scope.$watch('tools.kpi.enabled', function () {
        if (scope.tools.kpi.enabled){
          scope.box.type = 'kpi';      
        } else {
          mapCtrl.removeLayer(areas);
        }
      });

      scope.$watch('kpi.kpiData', function () {
        // remove previous layer if available
        if (areas !== undefined) {
          mapCtrl.removeLayer(areas);
        }
        if (scope.kpi.kpiData.features !== undefined) {
          areas = L.geoJson(scope.kpi.kpiData, {
            onEachFeature: function (feature, layer) {
              var array, key, value;
              array = (function () {
                var ref, results;
                ref = feature.properties;
                results = [];
                for (var key in ref) {
                  value = ref[key];
                  results.push("" + key + ": " + value);
                }
                return results;
              })();
              layer.on('click', function (e) {
                scope.onAreaClick(value);
              });
            },
            style: styler
          });
          mapCtrl.addLayer(areas);
        }
      });

      scope.$watch('kpi.kpichanged', function () {
        if (scope.kpi.kpiData.features !== undefined) {
          areas.setStyle(styler);
        }
      });

      scope.$watch('kpi.thresholds.warning', function () {
        // set style
        if (scope.kpi.kpiData.features !== undefined) {
          areas.setStyle(styler);
        }
      });

      scope.$watch('kpi.thresholds.error', function () {
        // set style
        if (scope.kpi.kpiData.features !== undefined) {
          areas.setStyle(styler);
        }
      });

      scope.$watch('kpi.clean', function () {
        mapCtrl.removeLayer(areas);
      });
    }
  };
});

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

    };

    var link = function (scope, element, attrs) {
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

'use strict';

// this directive is implemented with the idea that we will switch to OL
// ie. ugly abuse of scope, sending data to server via
app.directive('rasterprofile', function () {

  return {
    restrict: "A",
    require: 'map',
    link: function (scope, element, attrs, mapCtrl) {

        // function to convert Leaflet layer to WKT
        // from https://gist.github.com/bmcbride/4248238
        // added project to 3857
        var toWKT =  function (layer) {
          var lng, lat, coords = [];
          if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
            var latlngs = layer.getLatLngs();
            for (var i = 0; i < latlngs.length; i++) {
              var point = L.CRS.EPSG3857.project(latlngs[i]);
              coords.push(point.x + " " + point.y);
              if (i === 0) {
                lng = point.x;
                lat = point.y;
              }
            }
            if (layer instanceof L.Polygon) {
              return "POLYGON((" + coords.join(",") + "," + lng + " " + lat + "))";
            } else if (layer instanceof L.Polyline) {
              return "LINESTRING(" + coords.join(",") + ")";
            }
          } else if (layer instanceof L.Marker) {
            return "TODO: returns latlon instead of projected coordinates";
            //return "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
          }
        };

        // Draw a line and remove existing line (if exists).
        // borrow from 3di:
        // https://github.com/nens/threedi-server/blob/master/threedi_server/static/js/threedi-ng.js
        var drawLine = function (startpoint, endpoint) {
          var pointList = [startpoint, endpoint];
          var firstpolyline = L.polyline(pointList, {
            color: 'lightseagreen',
            weight: 2,
            opacity: 1,
            smoothFactor: 1
          });

          if (scope.line_marker !== undefined) {
            mapCtrl.removeLayer(scope.line_marker);
          }

          mapCtrl.addLayer(firstpolyline);
          scope.first_click = undefined;
          scope.line_marker = firstpolyline;  // Remember what we've added
          return firstpolyline;
        };
        
        var drawLineCLickHandler = function (e) {
          // setup draw line to get profile info from server 
          if (scope.first_click === undefined) {
            scope.first_click = e.latlng;
            console.log("Now click a second time to draw a line.");
            return;
          }

          var profile_line = drawLine(scope.first_click, e.latlng);
          var profile_line_wkt = toWKT(profile_line);
          
          // Aargh, FCK leaflet, why can't I get a proper CRS from a MAPPING
          // library
          var srs = L.CRS.EPSG3857.code;
          
          // call get_profile controller function on scope
          scope.get_profile(profile_line_wkt, srs);
        };

        // enable and disable click handler
        // 'tools.profile.enabled' is set by the MasterCtrl on <html> scope
        scope.$watch('tools.profile.enabled', function () {
          if (scope.tools.profile.enabled) {
            scope.map.on('click',  drawLineCLickHandler);
          } else {
            //clean up map
            if (scope.line_marker) {
              mapCtrl.removeLayer(scope.line_marker);
            }
            scope.map.off('click', drawLineCLickHandler);
          }
        });

      }

  };
});

app.controller("KpiCtrl",
  ["$scope", "$http", function ($scope, $http)  {

  /**
   * Setup scope variables
   *
   */

  $scope.d3kpi = {'dates': {name: 'Date', values: [], units: 'Year'},
                  'kpis': {name: '', values: [], units: ''}};
  /**
   * Load KPI data from server for neighbourhoods and municipalities
   *
   */
  $scope.kpiLoader = function () {
    var wijkdata = '/static/data/wijken_apeldoorn.geojson';
    var gemeentedata = '/static/data/gemeenten_apeldoorn.geojson';
    $scope.kpi.areaData = {'wijk': {}, 'gemeente': {}};
    
    //NOTE: write a failure function
    $http.get(wijkdata)
        .success(function (data) {
          $scope.kpi.areaData.wijk = data;
        });

    $http.get(gemeentedata)
        .success(function (data) {
          $scope.kpi.areaData.gemeente = data;
          // initialise gemeente as first view
          $scope.kpiFormatter('gemeente');
          // ugly
          console.debug(data.features)
          $scope.kpi.panZoom = {
            lat: 52.2114246,
            lng: 5.8998043,
            zoom: 11
          };
        });
  };

  /**
   * Format KPI data so it can be used in the view
   *
   */
  $scope.kpiFormatter = function (area_level) {

    //reset map
    //KpiService.clean = Date.now();
    $scope.kpi.kpiData = $scope.kpi.areaData[area_level];
    // later als get categories from kpi source
    //$scope.categories = [];
    //NOTE: buttugly crap
    $scope.kpi.dates = $scope.kpi.kpiData.features[0].properties.planrealisatie.dates;
    $scope.kpi.areas = [];
    // get unique areas
    for (var j in $scope.kpi.kpiData.features) {
      var feature = $scope.kpi.kpiData.features[j];
      if ($scope.kpi.areas.join(" ").indexOf(feature.properties.name) === -1) {
        $scope.kpi.areas.push(feature.properties.name);
      }
    }

    // initialise selected states only the first time
    if ($scope.kpi.slct_cat === undefined) {
      $scope.kpi.slct_cat =  $scope.kpi.categories[0];
      $scope.kpi.slct_area = $scope.kpi.areas[0];
      $scope.kpi.slct_date = $scope.kpi.dates[4];
    }
    if ($scope.area_level !== area_level) {
      //for (var i in $scope.kpi.categories) {
        //console.log($scope.kpi.categories[i]);
        //var category = $scope.kpi.categories[i];
        //$scope.kpi.slct_cat = category;
      //}
      $scope.kpi.slct_area = $scope.kpi.areas[0];
    }
    $scope.area_level = area_level;
  };

  $scope.activate = function (date, area, category) {
    $scope.kpi.slct_cat = category;
    $scope.kpi.slct_area = area;
    $scope.kpi.slct_date = date;
    // doesn't have to be updated when date changes
    $scope.d3formatted(area, category);
    $scope.kpi.kpichanged = !$scope.kpi.kpichanged;
  };

  // prepare data for graph and badge values
  // NOTE: refactor so function below is included
  $scope.d3formatted = function (area, category) {
    $scope.d3kpi.kpis.name = category;
    $scope.badgevalues = {};
    $scope.d3kpi.kpis.values = [];
    $scope.d3kpi.dates.values = $scope.kpi.dates;
    for (var i in $scope.kpi.kpiData.features) {
      var feature = $scope.kpi.kpiData.features[i];
      // skip this if, just put it in the cat
      if (feature.properties.name === area) {
        $scope.d3kpi.kpis.values = feature.properties[category].values;
        $scope.formatted_data = $scope.format_data($scope.d3kpi);
      }
    }
  };

  //NOTE: refactor so this is included in d3formatted function
  $scope.format_data = function (d3kpi) {
    var formatted_data = [];
    for (var i = 0; i < d3kpi.dates.values.length; i++) {
      var xyobject = {
        date: d3kpi.dates.values[i],
        value: d3kpi.kpis.values[i]
      };
      formatted_data.push(xyobject);
    }
    return formatted_data;
  };

  $scope.labelValue = function (date, area, category) {
    $scope.labelValues = {};
    for (var i in $scope.kpi.kpiData.features) {
      var feature = $scope.kpi.kpiData.features[i];
      if (feature.properties.name === area) {
        // ugly crap, make nicer data model for this
        $scope.labelValues[category] = feature.properties[category].values;
      }
    }
    var value = $scope.labelValues[category][$scope.kpi.dates.indexOf($scope.kpi.slct_date)];
    return value;
  };

  // Load KPI data
  $scope.kpiLoader();



  //NOTE: watches and event handlers that I intuitively say don't belong here
  $scope.$on('clean', function () {
    $scope.kpi.clean = Date.now();
  });

  $scope.$watch('kpi.slct_area', function () {
    if ($scope.kpi.slct_area !== undefined) {
      $scope.activate($scope.kpi.slct_date, $scope.kpi.slct_area, $scope.kpi.slct_cat);
    }
  });

  $scope.$watch('kpi.slct_date', function () {
    if ($scope.kpi.slct_date !== undefined) {
      $scope.activate($scope.kpi.slct_date, $scope.kpi.slct_area, $scope.kpi.slct_cat);
    }
  });

}]);

angular.module('templates-main', ['templates/bbox.html', 'templates/culvert.html', 'templates/default.html', 'templates/egg.html', 'templates/empty.html', 'templates/geslotenleiding.html', 'templates/intersecttool.html', 'templates/knoop.html', 'templates/kpi.html', 'templates/location.html', 'templates/object_id.html', 'templates/omnibox-search.html', 'templates/profile.html', 'templates/pumpstation.html', 'templates/weir.html']);

angular.module("templates/bbox.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/bbox.html",
    "<div class=\"card\" >\n" +
    "bbox: <span ng-bind=\"bbox_content\"></span>\n" +
    "<% bbox_content %>\n" +
    "</div>");
}]);

angular.module("templates/culvert.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/culvert.html",
    "<div class=\"card\">\n" +
    "  <div class=\"card-title\">\n" +
    "    <img src=\"/static/distjs/images/culvert.png\" class=\"img-circle\"/>\n" +
    "    <span>Culvert</span>\n" +
    "  </div>\n" +
    "  <table class=\"left\">\n" +
    "    <tr>\n" +
    "      <td>BOB Bovenstrooms (m NAP) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.ground_level_upstream\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <td>BOB Benedenstrooms (m NAP) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.ground_level_downstream\"></td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "  <table class=\"right\">\n" +
    "    <tr>\n" +
    "        <td>Breedte (m) </td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.width\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "        <td>Lengte (m) </td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.length\"></td>\n" +
    "    </tr>\n" +
    "   </table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "    <span class=\"add-on\"> Tijdreeks</span> \n" +
    "    <select class=\"timeseries\" ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.code for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "    <nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("templates/default.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/default.html",
    "<div class=\"card\" >\n" +
    "	<li class=\"recommendation no-right-padding\" href=\"#\" ng-click=\"toggle_tool('kpi')\" ng-class=\"{'icon-large': tools.kpi.enabled}\" title=\"Key Performance Indicator\">\n" +
    "    	<i class=\"icon-dashboard\"></i>\n" +
    "    	<a class=\"recommendations\">kpi</a>\n" +
    "	</li>\n" +
    "	<div class=\"vertical-divider\"></div>\n" +
    "	<li class=\"left-text no-left-padding\">\n" +
    "		<a href=\"#\" ng-click=\"geoLocate()\"><i class=\"icon-bullseye\"></i>&nbsp;Ga naar uw locatie</a>, of probeer te zoeken naar <a href=\"\" ng-click=\"simulateSearch('Purmerend')\">Purmerend</a> <i class=\"icon-circle very-small-icon\"></i> <a href=\"\" ng-click=\"simulateSearch('Apeldoorn')\">Apeldoorn</a> <i class=\"icon-circle very-small-icon\"></i> <a href=\"\" ng-click=\"simulateSearch('Riolering')\">Riolering</a>\n" +
    "	</li>\n" +
    "</div>");
}]);

angular.module("templates/egg.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/egg.html",
    "<h1>Easter</h1>\n" +
    "<img src=\"http://media.tumblr.com/tumblr_lnfmwz0gbq1qgllay.gif\"/>");
}]);

angular.module("templates/empty.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/empty.html",
    "");
}]);

angular.module("templates/geslotenleiding.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/geslotenleiding.html",
    "<div class=\"card\">\n" +
    "  <div class=\"card-title\">\n" +
    "    <img src=\"/static/distjs/images/geslotenleiding.png\" class=\"img-circle\"/>\n" +
    "    <span>Geslotenleiding</span>\n" +
    "  </div>\n" +
    "  <table class=\"left\">\n" +
    "    <tr>\n" +
    "      <td>Lengte (m) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.lei_len\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <td>Breedte (m) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.pro_bre\"></td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "  <table class=\"right\">\n" +
    "    <tr>\n" +
    "        <td>Hoogte (m) </td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.pro_hgt\"></td>\n" +
    "    </tr>\n" +
    "   </table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "    <span class=\"add-on\"> Tijdreeks</span> \n" +
    "    <select class=\"timeseries\" ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.code for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "    <nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("templates/intersecttool.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/intersecttool.html",
    "<div class=\"card\">\n" +
    "    <li class=\"recommendation no-right-padding\" href=\"#\" ng-click=\"toggle_tool('profile')\" title=\"Intersect tool\">\n" +
    "		<i class=\"icon-resize-full\"></i>\n" +
    "	  	<a class=\"recommendations\">intersect</a>\n" +
    "	</li>\n" +
    "	<div class=\"vertical-divider\"></div>\n" +
    "	<li class=\"left-text no-left-padding\">\n" +
    "		Trek een lijn met de intersectietool om een hoogteprofiel te krijgen\n" +
    "	</li>\n" +
    "</div>");
}]);

angular.module("templates/knoop.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/knoop.html",
    "<div class=\"card\">\n" +
    "	<div class=\"card-title\">\n" +
    "		<img src=\"/static/distjs/images/knoop.png\" class=\"img-circle\"/>\n" +
    "		<span>Knoop</span>\n" +
    "	</div>\n" +
    "	<table class=\"left\">\n" +
    "		<tr>\n" +
    "			<td>BOK (m) </td>\n" +
    "			<td ng-bind=\"metadata.fromgrid.knp_bok\"></td>\n" +
    "		</tr>\n" +
    "		<tr>\n" +
    "			<td>Breedte (m) </td>\n" +
    "			<td ng-bind=\"metadata.fromgrid.knp_bre\"></td>\n" +
    "		</tr>\n" +
    "	</table>\n" +
    "	<table class=\"right\">\n" +
    "		<tr>\n" +
    "			<td>WOS opp. (m<sup>2</sup>) </td>\n" +
    "			<td ng-bind=\"metadata.fromgrid.wos_opp\"></td>\n" +
    "		</tr>\n" +
    "		<tr>\n" +
    "			<td>Maaiveld (m NAP) </td>\n" +
    "			<td ng-bind=\"metadadata.fromgrid.mvd_niv\"></td>\n" +
    "		</tr>\n" +
    "	</table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "  	<span class=\"add-on\"> Tijdreeks</span> \n" +
    "  	<select ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.code for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "	<nxt-line-graph data=\"timeseriesdata\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>\n" +
    "");
}]);

angular.module("templates/kpi.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/kpi.html",
    "<div class=\"card kpi\" ng-controller=\"KpiCtrl\" ng-animate=\" 'animate' \">\n" +
    "  <div>\n" +
    "    <h2> <% kpi.cat_dict[kpi.slct_cat]  %> - <% kpi.slct_date %> </h2>\n" +
    "    <h4> <% kpi.slct_area %> </h4>\n" +
    "    <div>\n" +
    "      <dl class=\"dl-horizontal\">\n" +
    "        <div class=\"btn-group btn-group-vertical\">\n" +
    "          <div ng-repeat=\"category in kpi.categories\">\n" +
    "            <dt>\n" +
    "              <button \n" +
    "                type=\"button\"\n" +
    "                ng-class=\"{'btn-primary': category == kpi.slct_cat}\"\n" +
    "                ng-click=\"activate(kpi.slct_date, kpi.slct_area, category)\"\n" +
    "                class=\"btn btn-xs btn-block\">\n" +
    "                <% kpi.cat_dict[category]  %>\n" +
    "              </button>\n" +
    "            </dt>\n" +
    "            <dd>\n" +
    "              <!--ugly crap, make nicer data model for this -->\n" +
    "              <span class=\"label\" ng-class=\"{\n" +
    "                'label-success': labelValue(kpi.slct_date, kpi.slct_area, category) >= kpi.thresholds.warning,\n" +
    "                'label-warning': labelValue(kpi.slct_date, kpi.slct_area, category) <  kpi.thresholds.warning && labelValue(kpi.slct_date, kpi.slct_area, category) > kpi.thresholds.error,\n" +
    "                'label-danger': labelValue(kpi.slct_date, kpi.slct_area, category) <= kpi.thresholds.error && labelValue(kpi.slct_date, kpi.slct_area, category) > 0\n" +
    "                }\">\n" +
    "                <% labelValue(kpi.slct_date, kpi.slct_area, category) %>\n" +
    "              </span>\n" +
    "            </dd>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </dl>\n" +
    "    </div>\n" +
    "    <nxt-line-graph data=\"formatted_data\" title=\"\" ylabel=\"\" xlabel=\"\" ymin=\"0\" ymax=\"10\" type=\"kpi\"></nxt-line-graph>\n" +
    "    <div>\n" +
    "      <button type=\"button\" class=\"btn btn-sm\"\n" +
    "        ng-class=\"{'btn-primary': date == kpi.slct_date}\"\n" +
    "        ng-repeat=\"date in kpi.dates\"\n" +
    "        ng-click=\"activate(date, kpi.slct_area, kpi.slct_cat)\"><%date%>\n" +
    "      </button>\n" +
    "    </div>\n" +
    "    <br />\n" +
    "    <div class=\"input-append\">\n" +
    "      <select ng-model=\"kpi.slct_area\" ng-options=\"area for area in kpi.areas\"></select>\n" +
    "      <button class=\"btn\"\n" +
    "        ng-class=\"{'btn-primary': area_level == 'wijk'}\"\n" +
    "        ng-click=\"kpiFormatter('wijk')\">wijk</button>\n" +
    "      <button class=\"btn\"\n" +
    "        ng-class=\"{'btn-primary': area_level == 'gemeente'}\"\n" +
    "        ng-click=\"kpiFormatter('gemeente')\">gemeente</button>\n" +
    "    </div>\n" +
    "    <div class=\"btn-group\" ng-model=\"area_level\">\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "  <div>\n" +
    "    <label class=\"checkbox\">\n" +
    "      <input type=\"checkbox\" ng-model=\"checked\" ng-init=\"checked=false\" /> Instellen grenzen\n" +
    "    </label>\n" +
    "    <div ng-show=\"checked\" id=\"threshold\" class=\"well\">\n" +
    "      <label for=\"low\">Bovengrens: </label>\n" +
    "      <input type='range' ng-model='kpi.thresholds.warning' min='1' max='10'><br>\n" +
    "\n" +
    "      <label for=\"high\">Ondergrens: </label>\n" +
    "      <input type='range' ng-model='kpi.thresholds.error' min='1' max='10'>\n" +
    "\n" +
    "    </div>\n" +
    "  </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("templates/location.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/location.html",
    "\n" +
    "<div id=\"detail\" class=\"card location\" ng-class=\"{'pullDown': currentObject}\" ng-show=\"currentObject\">\n" +
    "	<h5><i class=\"icon-map-marker icon-large\"></i>&nbsp;<span ng-bind=\"currentObject.display_name\"></span></h5>\n" +
    "	<ul style=\"list-style:none;padding:0;margin:0;\">\n" +
    "	    <li ng-repeat=\"(key, value) in currentObject\" class=\"truncateme\">\n" +
    "      		<abbr ng-bind=\"value\" title=\"<% key %>\"></abbr>\n" +
    "	    </li>\n" +
    "	</ul>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "  <div ng-show=\"box.query.length > 0\" ng-cloak ng-repeat=\"(key, value) in searchData\" class=\"card cluster location\">\n" +
    "    <span ng-if=\"value.pin\">\n" +
    "      <i class=\"icon-table\"></i>&nbsp;\n" +
    "      <a ng-click=\"showDetails(value)\" data-latitude=\"<% value.geometry[0] %>\" data-longitude=\"<% value.geometry[1] %>\" style=\"cursor:pointer;\">\n" +
    "        <span ng-bind-html-unsafe=\"value.name\"></span>\n" +
    "      </a>\n" +
    "    </span>\n" +
    "  </div>\n" +
    "\n" +
    "  \n" +
    "  <div ng-show=\"box.type == 'location'\" class=\"card cluster location\" ng-repeat=\"g in box.content | orderBy:'display_name'\">\n" +
    "    <i class=\"icon-map-marker\"></i>&nbsp;<a ng-click=\"showDetails(g)\" title=\"<% g.display_name %>\" data-latitude=\"<% g.lat %>\" data-longitude=\"<% g.lon %>\" style=\"cursor:pointer;\"><span ng-bind-html-unsafe=\"g.display_name \"></span></a> \n" +
    "    <!-- | highlight:box.query -->\n" +
    "  </div>\n" +
    "    \n" +
    "    \n" +
    "  <div ng-show=\"box.type == 'location'\" class=\"card cluster location\" ng-repeat=\"g in box.bbox_content\">\n" +
    "    <i class=\"icon-map-marker\"></i>&nbsp;<a ng-click=\"showDetails(g)\" title=\"<% g.name %>\" data-latitude=\"<% g.geometry[0] %>\" data-longitude=\"<% g.geometry[1] %>\" style=\"cursor:pointer;\"><span ng-bind-html-unsafe=\"g.name \"></span></a> \n" +
    "    <!-- | highlight:box.query -->\n" +
    "  </div>    \n" +
    "");
}]);

angular.module("templates/object_id.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/object_id.html",
    "<div class=\"card\">\n" +
    "	<h3 ng-bind=\"metadata.title\"></h3>\n" +
    "	<h4 ng-show=\"metadata.type\" ng-bind=\"metadata.type\"></h4>\n" +
    "	<dl class=\"dl-horizontal\">\n" +
    "		<dt>Lengte </dt><dd ng-bind=\"metadata.leidinglengte\"></dd>\n" +
    "		<dt>Hoogte </dt><dd ng-bind=\"metadata.profiel_hoogte\"></dd>\n" +
    "		<dt>Breedte </dt><dd ng-bind=\"metadata.profiel_breedte\"></dd>\n" +
    "	</dl>\n" +
    "  <div class=\"input-prepend\">\n" +
    "  	<span class=\"add-on\"> Tijdreeks</span> \n" +
    "  	<select ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.name for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "\n" +
    "	<nxt-line-graph data=\"data\" title=\"metadata.name\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("templates/omnibox-search.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/omnibox-search.html",
    "<div class=\"searchbox\" id=\"searchbox\" tabindex=\"-1\" role=\"search\" style=\"\">\n" +
    "    <form id=\"searchbox_form\"> \n" +
    "        <table cellspacing=\"0\" cellpadding=\"0\" id=\"\" class=\"searchboxinput\" style=\"width: 375px; padding: 0px;\">\n" +
    "            <tbody>\n" +
    "                <tr>\n" +
    "                    <td>\n" +
    "                        <input ui-keydown=\"{esc: 'reset_query()'}\" ui-keyup=\"{'enter':'search($event)'}\" ng-model=\"box.query\" ng-focus id=\"searchboxinput\" name=\"q\" tabindex=\"1\" autocomplete=\"off\" dir=\"ltr\" spellcheck=\"false\"><a href=\"\" ng-click=\"reset_query()\" id=\"clear\"></a>\n" +
    "                    </td>\n" +
    "                </tr>\n" +
    "            </tbody>\n" +
    "        </table>\n" +
    "    </form> \n" +
    "    <button id=\"search-button\" class=\"searchbutton\" ng-click=\"search($event)\" aria-label=\"Search\" tabindex=\"3\"></button>\n" +
    "</div>\n" +
    "\n" +
    "<div id=\"cards\" class=\"pullDown cardbox\" ng-show=\"box.showCards\" style=\"overflow:auto;display:block;\"></div> ");
}]);

angular.module("templates/profile.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/profile.html",
    "<div class=\"card\">\n" +
    "    <nxt-line-graph data=\"box.content\" ylabel=\"hoogte [mnap]\" xlabel=\"afstand [m]\" ymin=\"-10\" ymax=\"10\"></nxt-line-graph>\n" +
    "    <!--<nxt-line-graph data=\"box.content\" ylabel=\"\" xlabel=\"\"></nxt-line-graph>-->\n" +
    "</div>\n" +
    "");
}]);

angular.module("templates/pumpstation.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/pumpstation.html",
    "<div class=\"card\">\n" +
    "  <div class=\"card-title\">\n" +
    "    <img src=\"/static/distjs/images/gemaal.png\" class=\"img-circle\"/>\n" +
    "    <span>Gemaal</span>\n" +
    "  </div>\n" +
    "  <table class=\"left\">\n" +
    "    <tr>\n" +
    "      <td>Aanslagpeil (m NAP) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.start_level\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <td>Afslagpeil (m NAP) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.stop_level\"></td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "  <table class=\"right\">\n" +
    "    <tr>\n" +
    "        <td>Capaciteit (l/s) </td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.capacity\"></td>\n" +
    "    </tr>\n" +
    "   </table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "    <span class=\"add-on\"> Tijdreeks</span> \n" +
    "    <select class=\"timeseries\" ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.code for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "    <nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

angular.module("templates/weir.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/weir.html",
    "<div class=\"card\">\n" +
    "  <div class=\"card-title\">\n" +
    "    <img src=\"/static/distjs/images/weir.png\" class=\"img-circle\"/>\n" +
    "    <span>Stuw</span>\n" +
    "  </div>\n" +
    "  <table class=\"left\">\n" +
    "    <tr>\n" +
    "      <td>Kruinbreedte (m) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.ground_level_upstream\"></td>\n" +
    "    </tr>\n" +
    "    <tr>\n" +
    "      <td>Kruinhoogte (m) </td>\n" +
    "      <td ng-bind=\"metadata.fromgrid.ground_level_downstream\"></td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "  <table class=\"right\">\n" +
    "    <tr>\n" +
    "        <td>Debiet coefficient</td>\n" +
    "        <td ng-bind=\"metadata.fromgrid.discharge_coef\"></td>\n" +
    "    </tr>\n" +
    "   </table>\n" +
    "</div>\n" +
    "<div class=\"card\">\n" +
    "  <div class=\"input-prepend\">\n" +
    "    <span class=\"add-on\"> Tijdreeks</span> \n" +
    "    <select class=\"timeseries\" ng-model=\"selected_timeseries\" ng-options=\"tijdseries as tijdseries.code for tijdseries in timeseries\"></select>\n" +
    "  </div>\n" +
    "    <nxt-line-graph data=\"data\" title=\"metadata.title\" xlabel=\"metadata.xlabel\" ylabel=\"metadata.ylabel\"></nxt-line-graph>\n" +
    "</div>");
}]);

'use strict';

angular.module('omnibox', [])
  .directive('omnibox', ["$compile", "$http", "$templateCache",
    function($compile, $http, $templateCache) {

    // NOTE: this could probably something else
    var baseUrl = templatesUrl;

    var getTemplateLoader = function(contentType) {
      if (contentType === undefined) contentType = 'empty';

      var templateLoader,
      templateUrl = baseUrl + contentType + '.html';

      templateLoader = $http.get(templateUrl, {cache: $templateCache});

      return templateLoader;

    };

    var linker = function(scope, element, attrs) {

      var replaceTemplate = function(){
        var loader = getTemplateLoader(scope.box.type);

        var promise = loader.success(function(html) {
          // we don't want the dynamic template to overwrite the search box.
          // NOTE: the reason for selecting the specific child is jqLite does not
          // support selectors.
          angular.element(element.children()[1]).html(html);
        }).then(function (response) {
            $compile(element.contents())(scope);
        });
      };

      scope.$watch('box.type', function(){
        replaceTemplate();
        if (scope.box.type !== 'empty'){
          scope.box.showCards = true;
        } else {
          scope.box.showCards = false;
        }
      });

      replaceTemplate();

      // this should probably not be in this directive but in a subdirective.
      scope.$watch('selected_timeseries', function () {
        if (scope.selected_timeseries !== undefined){

          scope.data = scope.format_data(scope.selected_timeseries.events);
          // dit kan zeker nog mooier
          scope.metadata.title = scope.selected_timeseries.location.name;
          scope.metadata.ylabel = 'Aciditeit (%)' ; //scope.selected_timeseries.parameter + scope.selected_timeseries.unit.code
          scope.metadata.xlabel = "Tijd";
        } else {
          scope.data = undefined;
        }
      });

    };

  return {
    restrict: 'E',
    link: linker,
    templateUrl: baseUrl + 'omnibox-search.html'
  };
}]);
//graph.js

// create the directives as re-usable components
angular.module('graph', [])
    .directive('nxtTimeseries', function($http) {
        var busy = false;
        var readyForNext = null;
        return {
            restrict: 'E',
            replace: true,
            scope: {
                'url': '@'
            },
            template: '<svg></svg>',
            link: function(scope, element, attrs) {
                var getData = function(url, fn){
                    console.log(url);
                    $.ajax({
                            url: url,
                            type: 'GET',
                            dataType: 'json',
                            success: function(data) {
                                console.log('data!!!', data);
                                var formatted = [{
                                            "key": "timeseries", 
                                            "values": data['timeseries']
                                        }];
                                console.log('formatted 1', formatted, data);
                                fn(formatted);
                                // TODO: possibly a user does not see the very
                                // latest graph...

                                // if (readyForNext !== null) {
                                //     console.log("ReadyForNext!!");
                                //     getData(readyForNext, addGraph);
                                //     readyForNext = null;
                                // } 
                                setTimeout(function() {
                                    busy = false;
                                }, 600);  // wait a while before accepting new
                            },
                            error: function (data) {
                                console.log('error!!!', data);
                                var empty = [{"key": "timeseries",
                                            "values": [[0, 0]]}];
                                fn(empty);
                                setTimeout(function() {
                                    busy = false;
                                }, 600);  // wait a while before accepting new
                            }
                    });  // $.ajax
                }
                var addGraph = function(formatted) {
                    nv.addGraph(function() {
                        //console.log('scope.url2 ', scope.url, '-', scope_url);
                        //console.log('formatted 2', formatted);                    

                        //console.log("dataaa", data, formatted);
                        var chart = nv.models.lineChart()
                                      .x(function(d) { return Date.parse(d[0]) })
                                      .y(function(d) { return d[1] })
                                      .clipEdge(true);
                        var epoch = 0;
                        try {
                            // try to get the startdate.
                            epoch = +Date.parse(formatted[0].values[0][0]);
                        } catch(err) {
                        }
                        //console.log('epoch for this graph is ', epoch);
                        chart.xAxis
                            .axisLabel('Time (hours)')
                            .tickFormat(function(d) {
                                //var hours = +(d- new Date("2012-01-01")) / 1000 / 60 / 60;
                                //console.log('debug ', ((+d) - epoch));
                                var hours = ((+d) - epoch)  / 1000 / 60 / 60;
                             return Math.round(hours*10)/10;
                             //return d3.time.format('%X')(new Date(d)) 
                           });

                        chart.yAxis
                             .axisLabel('Depth (m)')
                             .tickFormat(d3.format(',.2f'));

                        //console.log('element', $(element).attr('id'), element);
                        // Make sure your context as an id or so...
                        d3.select(element.context)
                          .datum(formatted)
                            .transition().duration(500).call(chart);

                        nv.utils.windowResize(chart.update);
                        //console.log('busy? ', busy);
                        return chart;

                    });  // nv.addGraph
                };

                scope.$watch('url', function (url) {
                    //if ((url !== '') && (!busy)) {
                    if ((url !== '') ) {
                        //console.log("time series whahaha", url);
                        if (busy) {
                            // We don't have time for it now, but later you want
                            // the latest available graph.
                            //console.log("timeseries: busy!!"); 
                            readyForNext = url;
                            //showalert("Skipped ", url);
                            return;
                        }
                        // console.log('Get ready for the graph update');
                        busy = true;
                        //console.log('busy', busy);
                        getData(url, addGraph);
                    }
                });  // scope.watch
            }
        }
    });


angular.module('graph')
.directive('nxtLineGraph', function () {
  var chart = function (data, element, legend) {
      var margin = {
          top: 20,
          right: 20,
          bottom: 10,
          left: 30
        },
        maxwidth = 350,
        maxheight = 200;

      if (legend.yLabel) {
        margin.left = 45;
      }

      if (legend.xLabel) {
        margin.bottom = 15;
      }

      var width = maxwidth - margin.left - margin.right,
        height = maxheight - margin.top - margin.bottom;

      if (legend.ymax == undefined){
        legend.ymax = d3.max(data, function(d){
              return d.value
            });
      }
      if (legend.ymin == undefined){
        legend.ymin = d3.min(data, function(d){
              return d.value
            });
      }

      var y = d3.scale.linear()
          .domain([legend.ymin, legend.ymax + 1])
          .range([height, 0]);

      var line = d3.svg.line()
          .y(function (d) {
            return y(d.value);
          });

      var x = {};
      
      // check if data is time based or distance based
      if (data[0].hasOwnProperty('date')) {
        x = d3.time.scale()
          .domain(d3.extent(data, function (d) {
            if (legend.type === "kpi"){
              return Date.parse(d.date);            
            } else {
              return d.date;
            }
          }))
          .range([0, width]);

        line.x(function (d) {
            if (legend.type === "kpi"){
              return x(Date.parse(d.date));
            } else {
              return x(d.date);
            }
        });

        var make_x_axis = function () {
          return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat("")
            .ticks(5);
        };

        var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(5);

      } else if (data[0].hasOwnProperty('distance')) {
        x = d3.scale.linear()
          .domain(d3.extent(data, function (d) {
            return d.distance;
          }))
          .range([0, width]);

        line.x(function (d) {
          return x(d.distance);
        });

        var make_x_axis = function () {
          return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.format(".2"))
            .ticks(5);
        };

        var xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(5);
      }

      var zoomed = function () {
        svg.select(".x.axis").call(xAxis);
        svg.select(".x.grid")
            .call(make_x_axis()
            .tickSize(-height, 0, 0)
            .tickFormat(""));
        svg.select(".line")
            .attr("class", "line")
            .attr("d", line);
      };

      var zoom = d3.behavior.zoom()
        .x(x)
        .on("zoom", zoomed);
      
      // Make sure your context as an id or so...
      var svg = d3.select("#chart")
        .html("")
        .append("svg:svg")
        .attr('width', maxwidth)
        .attr('height', maxheight + 25)
        .append("svg:g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);

      svg.append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "plot");


      //TODO: Ticks hardcoded, make variable
      var make_y_axis = function () {
        return d3.svg.axis()
          .scale(y)
          .orient("left")
          .ticks(5);
      };

      svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis);

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

      svg.append("g")
        .attr("class", "x grid")
        .attr("transform", "translate(0, " + (height + 6) + ")")
        .call(make_x_axis()
          .tickSize(-height, 0, 0)
        );

      svg.append("g")
        .attr("class", "y grid")
        .call(make_y_axis()
          .tickSize(-width, 0, 0)
          .tickFormat("")
        );
          
     //Create title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -50 / 2 + margin.top)
        .attr("class", "title")
        .style("text-anchor", "middle")
        .text(legend.title);
         
      //Create X axis label   
      svg.append("text")
        .attr("x", width / 2)
        .attr("y",  height + margin.bottom * 2)
        .style("text-anchor", "middle")
        .text(legend.xLabel);
            
      //Create Y axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "0.9em")
        .style("text-anchor", "middle")
        .text(legend.yLabel);

      var clip = svg.append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

      var chartBody = svg.append("g")
        .attr("clip-path", "url(#clip)");

      chartBody.append("svg:path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);

    };

  return {
    restrict: 'E',
    template: '<div id="chart"></div>',
    scope: {
      // TODO: add extra options (e.g. width)? 
      title: '=',
      data: '=',
      xlabel: '=',
      ylabel: '=',
      xmin: '=',
      xmax: '=',
      ymin: '=',
      ymax: '=',
      type: '='
    },
    link: function (scope, element, attrs) {
      scope.$watch('data', function () {
        if (scope.data !== undefined) {
          if (attrs.ymax){
            var ymax = parseFloat(attrs.ymax);
          } 
          if (attrs.ymin){
            var ymin = parseFloat(attrs.ymin);
          };
          if (attrs.xmax){
            var xmax = parseFloat(attrs.xmax);
          } 
          if (attrs.xmin){
            var xmin = parseFloat(attrs.xmin);
          };
          var legend = {
            title: scope.title,
            xLabel: scope.xlabel,
            yLabel: scope.ylabel,
            // maybe from scope so controller determines labels
            ymin: ymin,
            ymax: ymax,
            xmin: xmin,
            xmax: xmax,
            type: attrs.type
          };
          chart(scope.data, element, legend);
        }
      });
    }
  };
});

angular.module('graph')
    .directive('nxtCrossSection', function($http) {
        var busy = false;
        return {
            restrict: 'E',
            replace: true,
            scope: {
                'url': '@'
            },
            template: '<svg></svg>',
            link: function(scope, element, attrs) {
                var getData = function(url, fn){
                    $.ajax({
                            url: url,
                            success: function(data) {
                                var formatted = [{
                                  "key": "land", 
                                  "values": data.bathymetry,
                                  "color": "#2C9331"
                                },{
                                  "key": "water", 
                                  "values": data.depth,
                                  "color": "LightSkyBlue"
                                }];
                                //console.log('formatte 1', formatted, data);
                                fn(formatted);
                                setTimeout(function() {
                                    busy = false;
                                }, 600);
                            },
                            error: function (data) {
                                var empty = [{
                                    "key": "land",
                                    "values": [[0, 0], [1/111, 0]],
                                    "color": "#2C9331"
                                },{
                                  "key": "water", 
                                  "values": [[0,0], [1/111, 0]],
                                  "color": "LightSkyBlue"
                                }];
                                fn(empty);
                                setTimeout(function() {
                                    busy = false;
                                }, 600);
                            }
                    });  // $.ajax
                }
                var addGraph = function(formatted) {
                    nv.addGraph(function() {
                        //console.log('scope.url2 ', scope.url, '-', scope_url);
                        //console.log('formatted 2', formatted);
                        
                        //console.log("dataaa", data, formatted);
                        // 2 * pi * r / 360 = 111 km per degrees, approximately
                        var chart = nv.models.stackedAreaChart()
                        //var chart = nv.models.lineChart()
                                      .x(function(d) { return 111*d[0] })
                                      .y(function(d) { return d[1] })
                                      .clipEdge(true);

                        chart.xAxis
                            .axisLabel('Distance (km)')
                            .tickFormat(d3.format(',.2f'));

                        chart.yAxis
                            .axisLabel('Depth (m)')
                            .tickFormat(d3.format(',.2f'));

                        chart.showControls(false);
                        chart.yDomain([0, 3]);

                        //console.log('element', $(element).attr('id'), element);
                        // Make sure your context as an id or so...
                        d3.select(element.context)
                          .datum(formatted)
                            .transition().duration(500).call(chart);

                        nv.utils.windowResize(chart.update);
                        return chart;

                    });  // nv.addGraph
                };

                scope.$watch('url', function (url) {
                    //console.log('profile url update');
                    if (busy) {
                        // Only update if an old request is already finished
                        //console.log("profile: busy!!"); 
                        return;
                    }
                    if (url !== '') {
                        //console.log('updating profile graph...');
                        busy = true;
                        getData(url, addGraph);
                    }
                    //setTimeout(function(){busy = false;}, 5000);
                });  // scope.watch
            }
        }
    });
