'use strict';


var app = angular.module("lizard-nxt", []);

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
 });

app.controller("loginCtrl", function($scope){
    $scope.user = "Ernst";
})

app.controller("InfoPoint", ["$scope", function($scope) {
    $scope.content = null;
    $scope.counter = 0;

    var infoPoint = function(content) {
        // content must have properties .loaded_model and .point.
        var lonlat = content.point;
        //var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
        //$scope.infourl = 'http://dev2.nxt.lizard.net:8080/hbase-api/api/v1/events/186c77bb-0030-48e3-8044-ea90028c9114/';
        $scope.infourl = '/static/carsten.json';
    }

    $scope.$on("infopoint", function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            console.log("open box infopoint");
            infoPoint(content);
            // var lonlat = content.point;
            // var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
            // $scope.infourl = $layer.dataset['workspaceWmsUrl'].split('/wms')[0] + '/data?' + "REQUEST=gettimeseries&LAYERS=" + content.loaded_model + "&SRS=EPSG:4326&POINT="+lonlat.lng.toString() + ',' + lonlat.lat.toString();
        });        
    });


}]);

/* Controller to initiate leaflet factory */
app.controller("Leaflet", ["$scope", "leaflet", function($scope, leaflet) { 
}]);



/* Directives */

// app.factory('leaflet', function ($rootScope) {
//     if (debug) {
//         console.log('initializing leaflet...');
//     }
//     map.on('click', function onMapClick(e) {
//             if (debug){
//                 console.log("click in navigate mode: ", e.latlng);
//                     };
//         var content = {
//             type: 'infopoint',
//             point: e.latlng
//         };
//         $rootScope.$broadcast('open_box', content);
//         } else if (clientstate.program_mode === MODE_INFO_POINT){
//             $rootScope.$broadcast('open_box', {
//                 type: 'infopoint', 
//                 point: e.latlng,
//                 loaded_model: state.loaded_model
//             });
//         } else {
//             if (debug) {
//                 console.log("click in unhandled mode: " + clientstate.program_mode);
//             }
//         } 

//     });

//     /*return {
//         emitExtent: function () {
//             var bounds = map.getBounds();
//             var extent_list = [
//                 bounds._southWest.lat, bounds._southWest.lng,
//                 bounds._northEast.lat, bounds._northEast.lng
//                 ];
//             socket.emit(
//                 'set_map_location', extent_list,
//                 function() {
//                     if (debug){
//                         console.log('emit map location', extent_list);
//                     }
//                 });
//         }


//     }*/
// });
