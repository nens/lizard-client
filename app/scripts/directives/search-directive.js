'use strict';

/**
 * @description directive that displays search
 * and makes sure the right services are called.
 */
angular.module('lizard-nxt')
  .directive('search', ['LocationService', function (LocationService) {

  var link = function (scope, element, attrs) {

    /**
     * @description event handler for key presses.
     * checks if enter is pressed, does search.
     * @param {event} event that is fired.
     * 13 refers to the RETURN key.
     */
    scope.searchKeyPress = function ($event) {
      if ($event.target.id === "searchboxinput") {
        if ($event.which === 13) {
          // User hits [enter] -> do search;
          scope.search();
        } else if ($event.which === 32) {
          // user hits [space] -> prevent anim. start/stop
          $event.originalEvent.stopPropagation();
        }
      }
    };

    /**
     * @description calls LocationService
     * with the right query and puts in on the scope.
     */
    scope.search = function () {
      if (scope.geoquery && scope.geoquery.length > 1) {
        LocationService.search(scope.geoquery)
          .then(function (response) {
            scope.cleanInput();
            scope.box.content.location = {};
            scope.box.content.location.data = response;
          }
        );
      }
      else {
        scope.cleanInput();
      }
    };

    /**
     * @description removes location model from box content
     */
    var destroyLocationModel = function () {
      delete scope.box.content.location;
    };

    /**
     * @description resets input field
     * on scope, because also needs to trigger on reset button,
     * not just on succesful search/zoom.
     */
    scope.cleanInput = function () {
      scope.geoquery = "";
    };

    /**
     * @description zooms to search result
     * @param {object} one search result.
     */
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
      scope.cleanInput();
    };


   };

  return {
    link: link,
    restrict: 'E',
    replace: true,
    templateUrl: 'templates/search.html'
  };

}]);

