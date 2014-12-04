/**
 * @ngdoc service
 * @class LeafletService
 * @memberof app
 * @name LeafletService
 * @description Trivial wrapper for global Leaflet object.
 *
 * Perhaps in the future this can be done with CommonJS style requires.
 */
angular.module('lizard-nxt')
  .service('LeafletService', [function () {
  if (L) {
    // Leaflet global variable to speed up vector layer,
    // see: http://leafletjs.com/reference.html#path-canvas
    window.L_PREFER_CANVAS = true;

    // Set max margin of latLng.equals method. This way
    // the vectorservice is able to return the features
    // within 0.0001 degree of the click.
    L.LatLng.MAX_MARGIN = 0.0001;

    return L;
  } else {
    throw new Error('Leaflet can not be found');
  }
}]);
