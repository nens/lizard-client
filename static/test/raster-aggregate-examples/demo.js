'use strict';

var app = angular.module('demo-raster-aggregates', ['omnibox']);

app.controller('DemoCtrl', function ($scope, $http){
  $scope.box = {
    type: 'empty',
    content: {},
    changed: Date.now()
  };

   $scope.getRasterData = function (raster_names, linestring_wkt, srs, agg) {
    // build url
    // NOTE: first part hardcoded
    var url = "http://localhost:8000/api/v1/rasters/";
    url += "?raster_names=" + raster_names;
    url += "&geom=" + linestring_wkt;
    url += "&srs=" + srs;
    if (agg !== undefined) {
      url += "&agg=" + agg;  
    }
    // get profile from server
    $http.get(url)
      .success(function (data) {
        //NOTE: hack to try pop_density
        if (raster_names === 'pop_density') {
          $scope.box.pop_density = data;
        } else {
          var d3data = format_data(data);
          $scope.box.type = "profile";
          $scope.box.content = {
            data: d3data,
            yLabel: 'hoogte [mNAP]',
            xLabel: 'afstand [m]'
          }
        }
      })
      .error(function (data) {
        //TODO: implement error function to return no data + message
        console.log("failed getting profile data from server");
      });
  };

  $scope.$watch('map', function () {
    if ($scope.map != undefined){
      console.log($scope.map)
      var layer = L.tileLayer('http://c.tiles.mapbox.com/v3/examples.map-szwdot65/{z}/{x}/{y}.png', {
      });
      $scope.map.addLayer(layer);      
    }
  });

  $scope.mapState = {

    moved: Date.now(),

  };

  $scope.openTemplate = function (boxType) {
    $scope.box.type = boxType;
  };
});
