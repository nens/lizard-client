/**
 * ==============
 * LeafletService
 * ==============
 *
 * Trivial wrapper for global Leaflet object.
 * Perhaps in the future this can be done with CommonJS style requires.
 */

app.service('LeafletService', [function () {
  if (L) {
    return L;  
  } else {
    return 'He\'s dead Jim';
  }
}]);