
/**
 * Component responsible for adding data-layers to lizard. Adding a datalayer
 * means adding a map-layer to the map-service and a data-layer to the
 * data-service. The map-directive draws all map-layers. The data-service gets
 * data for all data-layers. 
 */
angular.module('data-menu', [
  'global-state',
  'map'
]);
