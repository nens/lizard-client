'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('eventseriesMapLayer', ['$q', 'LeafletService', 'MapLayerService',
  function ($q, LeafletService, MapLayerService) {

    return function (options) {

      var eventseriesMapLayer = {};

      eventseriesMapLayer.uuid = options.uuid;

      eventseriesMapLayer.type = 'eventseries';

      eventseriesMapLayer.cml = MapLayerService.createMarkerClusterLayer(options);


      eventseriesMapLayer.update = function (map, timeState, options) {
        var promise;

        eventseriesMapLayer.cml.syncTime(timeState);

        if (!map.hasLayer(eventseriesMapLayer.cml) {
        }

        return promise;
      };


      /**
       * @description removes all _imageOverlays from the map. Removes
       *              listeners from the _imageOverlays, the _imageOverlays
       *              from this layer and removes the references to
       *              the _imageOverlays.
       */
      eventseriesMapLayer.remove = function (map) {
        if (map.hasLayer(eventseriesMapLayer.cml)) {
          map.removeLayer(eventseriesMapLayer.cml);
        }
      };

    return eventseriesMapLayer;
  };

}]);
