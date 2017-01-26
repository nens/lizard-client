
/**
 * The omnibox is the complete left panel. It includes search and it has
 * different behavior and markup for dashboard and map. Omnibox-directive is the
 * entry point.
 */
angular.module('omnibox', [
  'templates-main',
  'global-state',
  'data-menu',
  'map',
  'timeseries',
  'image-carousel'
]);
