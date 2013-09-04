<<<<<<< HEAD:lizard_nxt/client/static/src/app/lizard-nxt.js
var app = angular.module('lizard-nxt', ['lizard-nxt.services']);
=======
var app = angular.module("lizard-nxt", [
  'ngResource', 
  'ui.event', 
  'ui.highlight', 
  'ui.keypress',
  'omnibox']);
>>>>>>> 5f552351eec475efdcdafa59eb79a7213f6c2dd9:lizard_nxt/client/static/source/app/lizard-nxt.js

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
 });


<<<<<<< HEAD:lizard_nxt/client/static/src/app/lizard-nxt.js
app.controller("MapLayerCtrl", ["$rootScope", "$scope", "Cabinet", function($rootScope, $scope, Cabinet) {
  $scope.layergroups = Cabinet.layergroups;
  $scope.baselayers = Cabinet.baselayers;
=======
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
>>>>>>> 5f552351eec475efdcdafa59eb79a7213f6c2dd9:lizard_nxt/client/static/source/app/lizard-nxt.js

  $scope.switch = function(layer) {
    $rootScope.$broadcast('LayerSwitched', layer);
  };
  }]);

app.controller("MapCtrl",
  ["$scope", "$rootScope", "leaflet", function($scope, $rootScope, leaflet) {

<<<<<<< HEAD:lizard_nxt/client/static/src/app/lizard-nxt.js
    leaflet.map.on('click', function(e) {
        $rootScope.$broadcast('mapclick', e.latlng);
    });
=======
  $scope.$on('layergroups', function(message, content) {
    $scope.layergroups = content;
  });
>>>>>>> 5f552351eec475efdcdafa59eb79a7213f6c2dd9:lizard_nxt/client/static/source/app/lizard-nxt.js

}]);
