var app = angular.module("lizard-nxt", ['ngResource', 'ui.event', 'ui.highlight', 'ui.keypress']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  //
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
 });


app.service("Cabinet", ["$resource", "$rootScope",
  function($resource, $rootScope) {

  var layergroups,
      apiLayerGroups;

  apiLayerGroups = $resource('/api/v1/layergroups//:id/',
    {
      id:'@id'
    }, {
      'query': {method: "GET", isArray:false}
    });

  apiLayerGroups.query(function(response) {
     layergroups = response.results;
     $rootScope.$broadcast('layergroups', layergroups);
  });
  return {
    layergroups: apiLayerGroups
  };
}]);


app.controller("MapLayerCtrl", ["$scope", "Cabinet", function($scope, Cabinet) {
  $scope.layergroups = Cabinet.layergroups;

  $scope.$on('layergroups', function(message, content) {
    $scope.layergroups = content;
  });

}]);