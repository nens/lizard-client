'use strict';

/**
 * @ngdoc service
 * @name lizard-nxt.Layer
 * @description
 * # NxtLayer
 * Factory in the lizard-nxt.
 */
angular.module('lizard-nxt')
  .factory('NxtLayer', [
    'LeafletService', 'VectorService', 'RasterService',
    'UtfGridService', 'UtilService', '$http',
    function (LeafletService, VectorService, RasterService,
      UtfGridService, UtilService, $http) {

      /*
       * @constructor
       * @memberOf app.LayerGroup
       * @description Instantiates a layerGroup with non-readable and
       *              non-configurable properties
       * @param  {object} layergroup definition as coming from the server
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
        Object.defineProperty(this, '_leafletLayer', {
          value: undefined,
          writable: true,
        });
      }

      NxtLayer.prototype = {

        constructor: NxtLayer,

        initializeLayer: function () {
          if (this.type === 'Vector') {
            this._leafletLayer = initializeVectorLayer(this);
          } else if (this.type === 'TMS') {
            this._leafletLayer = initializeTMSLayer(this);
          } else if (this.type === 'UTFGrid') {
            this._leafletLayer = initializeGridLayer(this);
          } else if (this.type === 'WMS' && this.tiled) {
            this._leafletLayer = initializeWMSLayer(this);
          }
          else if (!this.tiled) {
            // TODO: initialise imageoverlay
            return;
          }
          else if (this.type !== 'Store') {
            // this ain't right
            throw new Error(this.type + ' is not a supported layer type');
          }
        },

        add: function (map) {
          if (this._leafletLayer) {
            addLeafletLayer(map, this._leafletLayer);
          }
        },

        remove: function (map) {
          if (this._leafletLayer) {
            removeLeafletLayer(map, this._leafletLayer);
          }
        },

        getData: function (lgSlug, options, deferred) {
          var wantedService;
          if (this.type === 'Store') {
            wantedService = RasterService;
          }
          else if (this.type === 'UTFGrid') {
            wantedService = UtfGridService;
          }
          else if (this.type === 'Vector') {
            wantedService = VectorService;
          }

          if (wantedService) {
            return this._buildPromise(lgSlug, options, deferred, wantedService);
          } else {
            return;
          }
        },

        syncTime: function (mapState, timeState, oldTime) {
          if (this.type === 'Vector' ) {
            this._syncVectorToTime(this, mapState, timeState, oldTime);
          } else if (this.temporal
            && this.type === 'WMS'
            && !this.tiled) {
            //TODO: see layergroup comments
            //this._adhereWMSLayerToTime(this, mapState, timeState, oldTime);
            }
        },

        /**
         * @function
         * @description rescales layer and updates url
         */
        rescale: function (bounds) {
          if (this.rescalable) {
            var url = this.url +
              '?request=getlimits&layers=' + this.slug +
              '&width=16&height=16&srs=epsg:4326&bbox=' +
              bounds.toBBoxString();
            var self = this;
            $http.get(url).success(function (data) {
              self.limits = ':' + data[0][0] + ':' + data[0][1];
              self._leafletLayer.setParams({
                styles: self.options.styles + self.limits
              });
              self._leafletLayer.redraw();
            });
          }
        },

        setOpacity: function (opacity) {
          if (this._leafletLayer && this._leafletLayer.setOpacity) {
            this._leafletLayer.setOpacity(opacity);
          }
        },

        /**
         * Fetches data from service and redraws based on this data.
         */
        _syncVectorToTime: function (layer, mapState, timeState, oldTime) {
          VectorService.getData(layer, {
            geom: mapState.bounds,
            start: timeState.start,
            end: timeState.end
          }).then(function (data) {
            layer._leafletLayer._resetgeoJson();
            layer._leafletLayer.drawTheThings(data);
          });
          return;
        },

       /**
        * @function
        * @memberOf app.LayerGroup
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

          var type = this.type,
              aggType = this.aggregationType,
              slug = this.slug,
              summary = this.summary;

          var buildSuccesCallback = function (data) {
            deferred.notify({
              data: data,
              type: type,
              layerGroupSlug: lgSlug,
              layerSlug: slug,
              aggType: aggType,
              summary: summary
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


      /**
       * @function
       * @memberof app.LayerGroup
       * @param {L.Class} Leaflet layer.
       * @description Adds layer to map
       */
      var addLeafletLayer = function (map, leafletLayer) { // Leaflet NxtLayer
        if (map.hasLayer(leafletLayer)) {
          throw new Error(
            'Attempted to add layer' + leafletLayer._id
            + 'while it was already part of the map'
          );
        } else {
          map.addLayer(leafletLayer);
        }
      };

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {L.Class} Leaflet map
       * @param  {L.Class} Leaflet layer
       * @description Removes layer from map
       */
      var removeLeafletLayer = function (map, leafletLayer) { // Leaflet NxtLayer
        if (map.hasLayer(leafletLayer)) {
          map.removeLayer(leafletLayer);
        } else {
          throw new Error(
            'Attempted to remove layer' + leafletLayer._id
            + 'while it was NOT part of provided the map'
          );
        }
      };

      var initializeVectorLayer = function (nonLeafLayer) {
        var leafletLayer;

        if (nonLeafLayer.tiled) {
          // Initiate a tiled Vector layer
          var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

          leafletLayer = new LeafletService.TileDataLayer(url, {
            minZoom: nonLeafLayer.min_zoom,
            maxZoom: nonLeafLayer.max_zoom,
            color: '#333',
            dataCallback: function (featureCollection, point) {
              if (!featureCollection) { return; }

              if (featureCollection.features.length > 0) {
                VectorService.setData(
                  nonLeafLayer.slug,
                  featureCollection.features,
                  point.z
                );
              }
            },
            slug: nonLeafLayer.slug,
            ext: 'geojson'
          });
        } else {
          // throw new Error('Initiate (non-tiled) Vector layer, for e.g. events');
          return leafletLayer;
        }
        return leafletLayer;
      };


      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {object} layer as served from backend
       * @return {L.TileLayer} leafletLayer
       * @description Initiates a Leaflet Tilelayer
       */
      var initializeTMSLayer = function (nonLeafLayer) {

        var layerUrl = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';
        var layer = LeafletService.tileLayer(
          layerUrl, {
            slug: nonLeafLayer.slug,
            minZoom: nonLeafLayer.min_zoom || 0,
            maxZoom: 19,
            detectRetina: true,
            zIndex: nonLeafLayer.zIndex,
            ext: 'png'
          });

        return layer;
      };

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {object} nonLeafLayer as served from backend
       * @return {L.TileLayer.WMS}              [description]
       * @description Initiates a Leaflet WMS layer
       */
      var initializeWMSLayer = function (nonLeafLayer) {
        var _options = {
          layers: nonLeafLayer.slug,
          format: 'image/png',
          version: '1.1.1',
          minZoom: nonLeafLayer.min_zoom || 0,
          maxZoom: 19,
          opacity: nonLeafLayer.opacity,
          zIndex: nonLeafLayer.zIndex
        };
        _options = angular.extend(_options, nonLeafLayer.options);

        return LeafletService.tileLayer.wms(nonLeafLayer.url, _options);
      };

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {object} nonLeafLayer as served from backend
       * @return {L.UtfGrid} utfgrid
       * @description Initiates layers that deliver interaction with the map
       */
      var initializeGridLayer = function (nonLeafLayer) {

        var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

        var layer = new LeafletService.UtfGrid(url, {
          ext: 'grid',
          slug: nonLeafLayer.slug,
          name: nonLeafLayer.slug,
          useJsonP: false,
          minZoom: nonLeafLayer.min_zoom_click || 0,
          maxZoom: 19,
          order: nonLeafLayer.zIndex,
          zIndex: nonLeafLayer.zIndex
        });
        return layer;
      };

      return NxtLayer;

    }
  ]);
