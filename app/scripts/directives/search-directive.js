angular.module('lizard-nxt')
  .directive('search', function (LocationService) {
    
  var link = function (scope, element, attrs) {
    
    // 13 refers to the RETURN key.
    scope.searchKeyPress = function () {
      if ($event.target.id === "searchboxinput" &&
          $event.which === 13) {
        scope.box.content.location = {};
        scope.search();
     }
      element.focus();
    };

    scope.search = function () {
      LocationService.search(scope.geoquery)
          .then(function (response) {
            scope.cleanInput();
            return scope.box.content.location.data = response;
        });
    };

    var destroyLocationModel = function () {
      delete scope.box.content.location;
    };
    
    scope.cleanInput = function () {
      scope.geoquery = "";
    };
   
    scope.zoomTo = function (obj) {
      if (obj.boundingbox) {
        var southWest = new L.LatLng(obj.boundingbox[0], obj.boundingbox[2]);
        var northEast = new L.LatLng(obj.boundingbox[1], obj.boundingbox[3]);
        var bounds = new L.LatLngBounds(southWest, northEast);
        scope.mapState.fitBounds(bounds);
      } else {
        if (window.JS_DEBUG) {
          throw new Error('Oops, no boundingbox on this result - TODO: show a proper message instead of this console error...');
        }
      }
      destroyLocationModel();
    };


   };

  return {
    link: link,
    restrict: 'A',
    templateUrl: 'templates/search.html'
  };

});
