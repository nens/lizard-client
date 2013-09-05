var app = angular.module("lizard-nxt", [
  'ngResource', 
  'ui.event', 
  'ui.highlight', 
  'ui.keypress',
  'omnibox',
  'lizard-nxt.services']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
 });


app.controller("MapLayerCtrl", ["$rootScope", "$scope", "Cabinet", function($rootScope, $scope, Cabinet) {
  $scope.layergroups = Cabinet.layergroups;
  $scope.baselayers = Cabinet.baselayers;

  $scope.switch = function(layer) {
    $rootScope.$broadcast('LayerSwitched', layer);
  };
}]);

app.controller("MapCtrl",
  ["$scope", "$rootScope", "leaflet", function($scope, $rootScope, leaflet) {

    leaflet.map.on('click', function(e) {
        $rootScope.$broadcast('mapclick', e.latlng);
    });
}]);



app.controller("LocationSearchCtrl",
    ["$scope", "$resource", "$rootScope",
        function($scope, $resource, $rootScope) {

      $scope.box = {
        query: null,
        disabled: false,
        showCards: false
      };


    $scope.setOmnibox = function(type, object) {
        console.log('type', type);
        console.log('object', object);
    };
    $scope.filter = function ($event) {
        $scope.box.showCards = true;
        if ($scope.box.query.length > 1) {
            var search = $scope.box.Search.get({q:$scope.box.query}, function(data) {
                console.log(data.hits.hits);
                var sources = [];
                for(var i in data.hits.hits) {
                    sources.push(data.hits.hits[i]._source);
                }
                $scope.searchData = sources;
            });

            var geocode = $scope.box.Geocode.query({q:$scope.box.query}, function(data) {
                console.log(data);
                $scope.geocodeData = data;
            });
        }
    };

    $scope.saveAsFavorite = function(data) {
        console.log("debug:", data);
        alert('Opslaan kan nog niet...');
    };

    $scope.shareFeature = function(data) {
        console.log("debug:", data);
        alert('Delen kan nog niet...');
    };


    $scope.reset_query = function() {
        $scope.box.query = null;
    };

    $scope.close_box = function(){
        $scope.box.showCards = false;
    };

    $scope.open_box = function(type) {
        $scope.box.showCards = true;
        $scope.box.type = type;
    };

    $scope.panzoom = function(lat,lon) {
        // getting pan/zoom request, tell map to pan zoom to location
        $rootScope.$broadcast('panzoom', lat, lon);
    };


    $scope.$on('open_box', function(message, content) {
        $scope.open_box(content);
    });

    $scope.$on('featureclick', function(message, content) {
        console.log('feature was clicked!', content);
        $scope.featureData = content;
        $scope.$apply();
        // this should be done differently
    });


    $scope.$on('mapclick', function(message, content) {
        console.log('map was clicked!!!', content.lat);

        var reversegeocode = $scope.box.ReverseGeocode.get({
            lat:content.lat,
            lon:content.lng
        }, function(data) {
            console.log(data);
            // show card for data!
        });

    });


    $scope.$on('open_box', function(message, content) {
        // Somewhat hacky: selected icon lights up

        if ($scope.box.content.marker !== undefined){
            $scope.box.content.marker._icon.classList.remove('selected-icon');
        }
        if ($scope.box.content !== 'empty') {
            $scope.close_box();  // close box and clean stuff up.
        }
        $scope.$apply(function() {
            $scope.box.content = content;
            $scope.box.disabled = false;
        });
        // If you have dynamic content, you should listen to this broadcast.
        $scope.$broadcast(content.type, content);
    });

    // Close the box from another scope using $rootScope.$broadcast
    $scope.$on('close_box', function(message, content) {
        $scope.close_box();
    });

    $scope.$on('keypress-esc', function(message, content) {
        $scope.close_box();
    });
}]);
