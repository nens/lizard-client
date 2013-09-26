'use strict';

app.controller("ProfileCtrl",
  ["$scope", "$http", "Omnibox", function ($scope, $http, Omnibox)  {

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
        Omnibox.content = d3data;
        Omnibox.open("profile");
      })
      .error(function (data) {
        //TODO: implement error function to return no data + message
        console.log("failed getting profile data from server");
      });
  };
}]);

app.controller("MasterCtrl",
  ["$scope", "Omnibox", function ($scope, Omnibox)  {

  $scope.profile_enabled = false;

  $scope.toggle_profile = function () {
    $scope.profile_enabled = !$scope.profile_enabled;
  };

}]);
