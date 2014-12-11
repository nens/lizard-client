'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtLayer
 * Factory in the lizard-nxt.
 */
angular.module('lizard-nxt')
  .factory('NxtLayer', ['$q', function ($q) {

      /*
       * @constructor
       * @memberOf app.Layer
       * @description Instantiates a layer with non-readable and
       *              non-configurable properties
       * @param  {object} layer definition as coming from the server
       */
      function NxtLayer(layer) {
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
        Object.defineProperty(this, 'zIndex', {
          value: layer.z_index,
          writable: false,
        });
        Object.defineProperty(this, 'url', {
          value: layer.url,
          writable: false,
        });
        Object.defineProperty(this, 'tiled', {
          value: layer.tiled,
          writable: false,
        });
        Object.defineProperty(this, 'aggregationType', {
          value: layer.aggregation_type,
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
        Object.defineProperty(this, 'bounds', {
          value: layer.bounds,
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
        Object.defineProperty(this, 'color', {
          value: layer.color,
          writable: false,
        });
        Object.defineProperty(this, 'unit', {
          value: layer.unit,
          writable: false,
        });
        Object.defineProperty(this, 'loadOrder', {
          value: layer.load_order,
          writable: false,
        });
        Object.defineProperty(this, 'timeState', {
          value: 0,
          writable: true
        });
      }

      NxtLayer.prototype = {

        constructor: NxtLayer,


       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer and do something on initialization.
        */
        initializeLayer: function () {
          if (!this.tiled) {
            // TODO: initialise imageoverlay
            return;
          }
          else if (this.format !== 'Store') {
            // this ain't right
            throw new Error(this.format + ' is not a supported layer format');
          }
        },

       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer and do something on add (like adding
        *              the leafletLayer to the map).
        * @param map leaflet map to add to.
        */
        add: function (map) {
          var defer = $q.defer();
          defer.resolve();
          return defer.promise;
        },

       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer and do something on remove (like removing
        *              the leafletLayer from the map).
        * @param map leaflet map to add to.
        */
        remove: function (map) {
          return;
        },

       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer can return data (Store and vector).
        * @param lgSlug slug of the layer.
        * @param options options object with geom and time.
        * @param deferred the defer to resolve when getting data.
        */
        getData: function (lgSlug, options, deferred) {
          return;
        },

       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer and can sync to timestate (vector and
        *              wms, currently).
        * @param mapState nxt mapState.
        * @param timeState nxt timeState.
        * @param oldTime previous time in ms from epoch.
        */
        syncTime: function (timeState, map) {
          var defer = $q.defer();
          defer.resolve();
          return defer.promise;
        },

       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer could rescale (wms, tms and vector).
        * @param bounds map bounds object.
        */
        rescale: function (bounds) {
          return;
        },

       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer and can change the opacity of the
        *              leafletLayer.
        * @param opacity between 0 and 1.
        */
        setOpacity: function (opacity) {
          return;
        },

       /**
        * @function
        * @memberOf app.Layer
        * @description creates a promise for the given layer and the provided
        *              service. The service should have a getData function that
        *              returns a promise that is resolved when data is recieved.
        * @param lg layerGroup slug to include in the response.
        * @param layer  nxtLayer definition.
        * @param options options containing geometry or time.
        * @param deffered deffered to notify when service.getData resolves.
        * @param wantedService Service to getData from.
        */
        _buildPromise: function (lgSlug, options, deferred, wantedService) {

          var aggType = this.aggregationType,
              color = this.color,
              scale = this.scale,
              slug = this.slug,
              summary = this.summary,
              format = this.format,
              quantity = this.quantity,
              type = this.type,
              unit = this.unit;

          var buildSuccesCallback = function (data) {
            deferred.notify({
              color: color,
              data: data,
              format: format,
              layerGroupSlug: lgSlug,
              layerSlug: slug,
              aggType: aggType,
              summary: summary,
              scale: scale,
              quantity: quantity,
              unit: unit
            });
          };

          var buildErrorCallback = function (msg) {
            deferred.notify({
              data:  null,
              type: type,
              layerGroupSlug: lgSlug,
              layerSlug: slug
            });
          };

          options = options || {};
          options.agg = this.aggregationType;

          return wantedService.getData(this, options)
            .then(buildSuccesCallback, buildErrorCallback);
        }

      };

      return NxtLayer;

    }
  ]);
