'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtDataLayer
 * Factory in the lizard-nxt.
 */
angular.module('data-menu')
  .factory('NxtDataLayer', ['$q', '$injector', 'NxtLayer',
  function ($q, $injector, NxtLayer) {

      var SERVICES = {
        Store: 'RasterService',
        Vector: 'VectorService',
        UTFGrid: 'UtfGridService'
      };

      function NxtDataLayer(layer, tempRes) {
        NxtLayer.call(this, layer, tempRes);

        this._service = $injector.get(SERVICES[this.format]);
      }

      NxtDataLayer.prototype = Object.create(NxtLayer.prototype, {

        constructor: NxtDataLayer,

       /**
        * @function
        * @memberOf app.Layer
        * @description Abstract method to be overridden by the layers that
        *              implement Layer can return data (Store and vector).
        * @param  {string} callee string of the callee to keep requests
        *                         seperate.
        * @param lgSlug slug of the layer.
        * @param options options object with geom and time.
        * @param deferred the defer to resolve when getting data.
        */
        getData: {
          value: function (callee, lgSlug, options, deferred) {
            if (this._filter(options)) {
              return this._buildPromise(
                callee,
                lgSlug,
                options,
                deferred,
                this._service
              );
            } else { return; }
          }
        },

        /**
         * Filters getData request. If the options dictate that this layer
         * should make a request this function returns true.
         * @param {object} options to match with this layer.
         */
        _filter: {
          value: function (options) {
            if (options.type) {
              if (options.type !== this.type) {
                return false;
              }
            }
            if (options.truncate) {
              if (this.format !== 'Store'
                || this._temporalResolution === undefined
                || this._temporalResolution === 0) {
                return false;
              }
            }
            if (options.exclude) {
              if (options.exclude === this.slug) {
                return false;
              }
            }
            return true;
          }
        },

       /**
        * @function
        * @memberOf app.Layer
        * @description creates a promise for the given layer and the provided
        *              service. The service should have a getData function that
        *              returns a promise that is resolved when data is recieved.
        * @param  {string} callee string of the callee to keep requests
        *                         seperate.
        * @param lg layerGroup slug to include in the response.
        * @param layer nxtLayer definition.
        * @param options options containing geometry or time.
        * @param deffered deffered to notify when service.getData resolves.
        * @param wantedService Service to getData from.
        */
        _buildPromise: {
          value: function (callee, lgSlug, options, deferred, wantedService) {

            var aggType = this.aggregationType,
                color = this.color,
                scale = this.scale,
                slug = this.slug,
                summary = this.summary,
                format = this.format,
                type = this.type,
                quantity = this.quantity,
                unit = this.unit;

            var buildSuccesCallback = function (data) {
              deferred.notify({
                color: color,
                data: (data && data.data) || data, // data or if exists data.data
                format: format,
                layerGroupSlug: lgSlug,
                layerSlug: slug,
                aggType: aggType,
                summary: summary,
                scale: scale,
                type: type,
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

            // Pass layer options to the services making the request.
            // RasterServices uses this to add options.styles.
            var extendedOpts = angular.extend({}, options, this.options);
            extendedOpts.agg = this.aggregationType;

            return wantedService.getData(callee, this, extendedOpts)
              .then(buildSuccesCallback, buildErrorCallback);
          }
        }

      });

      return NxtDataLayer;

    }
  ]);
