'use strict';

/**
 * @ngdoc service
 * @name map.Layer
 * @description
 * # NxtLayer
 * Additional methods used to extend nxtLayer with leaflet/map specific methods.
 */
angular.module('map')
.factory('wmsMapLayer', [
  '$q',
  'LeafletService',
  'MapLayerService',
  'RasterService',
  function ($q, LeafletService, MapLayerService, RasterService) {

    return function (options) {

      var wmsMapLayer = options;

      // Support pre layergroup refactored layers. Use slug if no layers in
      // options
      if (!wmsMapLayer.complexWmsOptions.layers) {
        wmsMapLayer.complexWmsOptions.layers = wmsMapLayer.slug;
      }

      // ComplexWmsOptions might have options per zoom and aggWindow. Add layer
      // with default options.
      var params = RasterService.getWmsParameters(
        wmsMapLayer.complexWmsOptions,
        0,
        0
      );

      wmsMapLayer.wms = MapLayerService.createWmsLayer(
        _.extend(options, params)
      );

      wmsMapLayer.update = function (map, timeState, options) {
        var promise;

        // Wms options might be different for current zoom and aggWindow.
        var newParams = RasterService.getWmsParameters(
          wmsMapLayer.complexWmsOptions,
          map.getZoom(),
          timeState.aggWindow
        );

        // Use opacity of lizard-client-layer as defined in favourite or altered
        // by user through opacity-slider and passed through options object by
        // mapservice.
        newParams.opacity = options.opacity;
        wmsMapLayer.wms.setOpacity(options.opacity);

        if (!map.hasLayer(wmsMapLayer.wms)) {
          wmsMapLayer._add(map, timeState, options);
        }

        if (!_.isEqual(newParams, params)) {
          params = newParams;
          wmsMapLayer.wms.setParams(params);
        }

        return promise;
      };

      wmsMapLayer.remove = function (map) {
        if (map.hasLayer(wmsMapLayer.wms)) {
          map.removeLayer(wmsMapLayer.wms);
        }
        map.off('zoomend', wmsMapLayer.onZoomend, wmsMapLayer);
      };

      /**
       * Adds leaflet layer to leaflet map and includes a zoom listener to
       * update wms parameters for different zoomlevels. This functionality is
       * used by stroombanen wmslayer.
       *
       * @param {L.Map}             map
       * @param {state.temporal {}} timeState
       * @param {state layer {}}    options
       */
      wmsMapLayer._add = function (map, timeState, options) {
        map.addLayer(wmsMapLayer.wms);

        // Store callback on instance to remove this callback from leaflets
        // listeners on remove.
        wmsMapLayer.onZoomend = wmsMapLayer
        .update
        .bind(wmsMapLayer, map, timeState, options);

        // WMS parameters can be different for different zoomlevels. On map
        // zoomend call update again with map and options for the same
        // timeState.
        map.on('zoomend', wmsMapLayer.onZoomend, wmsMapLayer);
      };

    return wmsMapLayer;
  };

}]);
