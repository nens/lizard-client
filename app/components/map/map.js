
/**
 * Lizard wrapper around leaflet. It writes and reads state to update the
 * spatial state of the map and the temporal state of the layers. A layer is
 * drawn if MapService has a map-layer which implements an update function and
 * matches and item in state.layers which is active.
 */
angular.module('map', [
  'global-state',
  'data-menu'
]);
