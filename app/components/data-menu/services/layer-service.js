'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtLayer
 * Factory in the lizard-nxt.
 */
angular.module('data-menu')
  .factory('NxtLayer', ['$q', function ($q) {

      /*
       * @constructor
       * @memberOf app.Layer
       * @description Instantiates a layer with non-readable and
       *              non-configurable properties
       * @param  {object} layer definition as coming from the server.
       * @param  {object} temporal resolution from the parent layergroup.
       */
      function NxtLayer(layer, temporalResolution) {
        Object.defineProperty(this, 'slug', {
          value: layer.slug,
          writable: false,
        });
        Object.defineProperty(this, 'type', {
          value: layer.type,
          writable: false,
        });
        Object.defineProperty(this, 'format', {
          value: layer.format,
          writable: false,
        });
        Object.defineProperty(this, 'minZoom', {
          value: layer.min_zoom,
          writable: false,
        });
        Object.defineProperty(this, 'maxZoom', {
          value: layer.max_zoom,
          writable: false,
        });
        Object.defineProperty(this, 'url', {
          value: layer.url,
          writable: false,
        });
        // Physical time in millieseconds between frames.
        Object.defineProperty(this, '_temporalResolution', {
          value: temporalResolution,
          writable: false,
        });
        Object.defineProperty(this, 'bounds', {
          value: layer.bounds,
          writable: false,
        });
        Object.defineProperty(this, 'color', {
          value: layer.color,
          writable: false,
        });
        Object.defineProperty(this, 'aggregationType', {
          value: layer.aggregation_type,
          writable: false,
        });
        Object.defineProperty(this, 'scale', {
          value: layer.scale,
          writable: false,
        });
        Object.defineProperty(this, 'quantity', {
          value: layer.quantity,
          writable: false,
        });
        Object.defineProperty(this, 'unit', {
          value: layer.unit,
          writable: false,
        });
        Object.defineProperty(this, 'zIndex', {
          value: layer.z_index,
          writable: false,
        });
        Object.defineProperty(this, 'tiled', {
          value: layer.tiled,
          writable: false,
        });
        Object.defineProperty(this, 'options', {
          value: layer.options,
          writable: false,
        });
        Object.defineProperty(this, 'rescalable', {
          value: layer.rescalable,
          writable: false,
        });
        Object.defineProperty(this, 'loadOrder', {
          value: layer.load_order,
          writable: false,
        });
      }

      return NxtLayer;

    }
  ]);
