var app = angular.module("lizard-nxt", ['ngResource']);

app.config(function($interpolateProvider) {
  //To prevent Django and Angular Template hell
  //
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
 });


app.controller("InfoPoint", ["$scope", function($scope) {
    $scope.content = null;
    $scope.counter = 0;

    var infoPoint = function(content) {
        // content must have properties .loaded_model and .point.
        var lonlat = content.point;
        //var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
        //$scope.infourl = 'http://dev2.nxt.lizard.net:8080/hbase-api/api/v1/events/186c77bb-0030-48e3-8044-ea90028c9114/';
        $scope.infourl = '/static/carsten.json';
    };

    $scope.$on("infopoint", function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            // console.log("open box infopoint");
            infoPoint(content);
            // var lonlat = content.point;
            // var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
            // $scope.infourl = $layer.dataset['workspaceWmsUrl'].split('/wms')[0] + '/data?' + "REQUEST=gettimeseries&LAYERS=" + content.loaded_model + "&SRS=EPSG:4326&POINT="+lonlat.lng.toString() + ',' + lonlat.lat.toString();
        });
    });
}]);






/* Directives */

app.directive('ngHistogram', function(){
  // turns the <histogram/> element into an interactive crossfilter
  // depends on crossfilter.js
  return function($scope, element){
    element[0].focus();
  };
});




app.directive('ngFocus', function(){
  // focus()es on the element you put this directive on
  return function($scope, element){
    element[0].focus();
  };
});

app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.onEnter);
                });
                event.preventDefault();
            }
        });
    };
});
