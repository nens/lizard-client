
/**
 * @ngdoc service
 * @class LayerGroup
 * @memberof app
 * @name LayerGroup
 * @summary LayerGroup abstracts the notion of layers out of the app.
 * @description Only layergroups are approachable, from the outside world LayerGroup
 *              defines a group of layers which are loaded at initialization of the
 *              page. They can be toggled on/off and queried for data. Layergroup
 *              draws all its layers and returns data for all layers.
 */
app.factory('LayerGroup', [
  'LeafletService', 'VectorService', 'RasterService', 'UtfGridService',
  'UtilService', '$q', '$rootScope',
  function (LeafletService, VectorService, RasterService, UtfGridService,
    UtilService, $q, $rootScope) {

    /*
     * @constructor
     * @memberOf app.LayerGroup
     * @description Instantiates a layerGroup with non-readable and
     *              non-configurable properties
     * @param  {object} layergroup definition as coming from the server
     */
    function LayerGroup(layerGroup) {
      Object.defineProperty(this, 'name', {
        value: layerGroup.name,
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(this, 'order', {
        value: layerGroup.order,
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(this, '_active', {
        value: false,
        writable: true,
        configurable: true,
        enumerable: false
      });
      Object.defineProperty(this, 'baselayer', {
        value: layerGroup.baselayer,
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(this, 'slug', {
        value: layerGroup.slug,
        writable: false,
        configurable: false,
        enumerable: false
      });
      Object.defineProperty(this, '_layers', {
        value: layerGroup.layers,
        writable: true,
        configurable: true,
        enumerable: false
      });
      Object.defineProperty(this, 'defaultActive', {
        value: layerGroup.active,
        writable: false,
        configurable: false,
        enumerable: false
      });
    }

    LayerGroup.prototype = {

      constructor: LayerGroup,

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description Returns a promise that notifies with data for every layer
      *              of the layergroup that is appplicable (i.e: rain and several
      *              vector layers). It resolves when all data is in.
      * @param  {object} geom latLng object with lat and lng properties or a list of
      *                       such objects.
      * @return  {promise} notifies with data per layer and resolves with value true
      *                    when layergroup was active, or false when layergroup was
      *                    inactive.
      */
      getData: function (options) {

        var lgSlug = this.slug,
            lgActive = this._active,
            deferred = $q.defer();

        if (!this._active) {
          deferred.resolve({slug: this.slug, active: this._active});
          return deferred.promise;
        }

        var promises = [];

        angular.forEach(this._layers, function (layer) {

          var wantedService;

          if (layer.type === 'Store') {
            wantedService = RasterService;
          }
          else if (layer.type === 'UTFGrid') {
            wantedService = UtfGridService;
          }
          /*else if (layer.type === 'Vector') {
            wantedService = VectorService; */
          // else {
          //   console.log('[E] someService.getData() was called w/o finding \'wantedService\' where wantedService =', wantedService);
          // }

          if (wantedService) {

            promises.push(buildPromise(
              lgSlug,
              layer,
              options,
              deferred,
              wantedService
            ));
          }
        });

        // Bear with me: the promises from the individual getData's(),
        // notify() the defer from LayerGroup.getData() on resolve.
        // When all the individual promises have resolved, this defer
        // should be resolved. It resolves with 'true' to indicate activity
        // of layer. No need to keep a counter of the individual promises.
        $q.all(promises).then(function () {
          deferred.resolve({
            slug: lgSlug,
            active: lgActive
          });
        });

        return deferred.promise;
      },


     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description toggles a layergroup on the given map.
      * @param  {object} map Leaflet map to toggle this layer on
      */
      toggle: function (map) {

        if (!this._initiated) {
          this._layers = _initializeLeafletLayers(this._layers, this.temporal);
          this._initiated = true;
        }

        this._active = !this._active;

        var fn = this._active ? addLeafletLayer : removeLeafletLayer;

        angular.forEach(this._layers, function (layer) {

          if (layer.leafletLayer) {
            fn(map, layer.leafletLayer);
          }
        });
      },

      /**
       *
       */
      isActive: function () {
        return this._active;
      },

      _mkTimeStamp: function (t) {
        return UtilService.roundTimestamp(t, this._animState.step, false);
      },

      /**
       *
       */
      adhereToTime: function (mapState, timeState, oldTime, newTime) {

        var i,
            overlays,
            temporalWMSLayer = this._getTemporalWMSLayer(),
            s = this._animState;

        if (oldTime === newTime || !temporalWMSLayer) { return; }

        if (this.isActive()) {

          if (this._animState.initiated) {

            // Possibility 1: we progress the animation to the next frame:
            console.log('Anim progressing!');

            var currentDate  = this._mkTimeStamp(newTime),
                oldDate      = this._mkTimeStamp(oldTime),
                overlayIndex = s.frameLookup[currentDate];

            if (overlayIndex !== undefined && overlayIndex !== s.previousFrame) {

              var oldOverlay = s.imageOverlays[s.previousFrame],
                  newOverlay = s.imageOverlays[overlayIndex];

              // Turn off old frame
              oldOverlay.setOpacity(0);

              // Turn on new frame
              newOverlay.setOpacity(0.7);

              // Delete the old overlay from the lookup, it is gone.
              delete s.frameLookup[currentDate];

              // Remove old listener
              oldOverlay.off('load');

              // Add listener to asynchronously update loadingRaster and framelookup:
              this._animAddLoadListener(
                oldOverlay,
                s.previousFrame,
                s.nxtDate,
                timeState
              );

              // We are now waiting for one extra raster
              s.loadingRaster++;

              // Tell the old overlay to get out and get a new image.
              oldOverlay.setUrl(
                s.imageUrlBase + s.utcFormatter(new Date(s.nxtDate))
              );

              s.previousFrame = overlayIndex;
              s.previousDate = currentDate;
              s.nxtDate += s.step;

            } else if (overlayIndex === undefined) {

              if (timeState.animation.playing) {
                s.restart = timeState.animation.playing;
              }

              if (timeState.playPauseAnimation) {
                timeState.playPauseAnimation('off');
              }
            }

          } else {

            // Possibility 2: we (re-)start the animation:
            console.log('Anim startUp!');

            this._animStart(temporalWMSLayer);
            overlays = this._animState.imageOverlays;

            for (i in overlays) {
              addLeafletLayer(mapState._map, overlays[i]);
            }

            // imgUrlBase equals full URL w/o TIME part
            this._animState.imageUrlBase
              = RasterService.buildURLforWMS(temporalWMSLayer);

            this._animGetImages(timeState);
          }
        } else {
          console.log('KILL ANIM!..');

          this._animState.initiated = false;

          // first, check whether we have added the first overlay to the map
          // (this implies a complete fixed-size set has been retrieved from API).
          if (mapState._map.hasLayer(s.imageOverlays[0])) {
            // if so, we remove (all) the overlays:
            for (i in s.imageOverlays) {
              removeLeafletLayer(mapState._map, s.imageOverlays[i]);
            }
          }
        }
      },

      _animState: {

        imageUrlBase    : undefined,
        imageBounds     : [],
        utcFormatter    : d3.time.format.utc("%Y-%m-%dT%H:%M:%S"),
        step            : [],
        imageOverlays   : {},
        frameLookup     : {},
        numCachedFrames : UtilService.serveToMobileDevice() ? 15 : 30,
        previousFrame   : 0,
        previousDate    : undefined,
        nxtDate         : undefined,
        loadingRaster   : 0,
        restart         : false,
        initiated       : false
      },

      _animStart: function (temporalWMSLayer) {

        var s = this._animState,
            southWest = L.latLng(
              temporalWMSLayer.bounds.south,
              temporalWMSLayer.bounds.west
            ),
            northEast = L.latLng(
              temporalWMSLayer.bounds.north,
              temporalWMSLayer.bounds.east
            );

        s.imageBounds     = L.latLngBounds(southWest, northEast);
        s.utcFormatter    = d3.time.format.utc("%Y-%m-%dT%H:%M:%S");
        s.step            = RasterService.getTimeResolution(this);
        s.frameLookup     = {};
        s.numCachedFrames = 30;
        s.previousFrame   = 0;
        s.loadingRaster   = 0;
        s.restart         = false;
        s.initiated       = true;
        s.imageOverlays   = RasterService.getImgOverlays(
          s.numCachedFrames,
          s.imageBounds
        );
      },

      _animAddLoadListener: function (image, index, date, timeState) {

        var s = this._animState;

        image.on("load", function (e) {
          s.loadingRaster--;
          s.frameLookup[date] = index;
          if (s.restart && s.loadingRaster === 0) {
            s.restart = false;
            timeState.playPauseAnimation();
          }
        });
      },

      _animGetImages: function (timeState) {

        var i, s = this._animState;

        s.nxtDate = UtilService.roundTimestamp(timeState.at, s.step, false);
        s.previousDate = s.nxtDate; // shift the date
        s.loadingRaster = 0;        // reset the loading raster count
        s.frameLookup = {};         // All frames are going to load new ones, empty lookup

        for (i in s.imageOverlays) {

          s.loadingRaster++;
          s.imageOverlays[i].setOpacity(0);
          s.imageOverlays[i].off('load');
          this._animAddLoadListener(s.imageOverlays[i], i, s.nxtDate, timeState);

          s.imageOverlays[i].setUrl(
            s.imageUrlBase + s.utcFormatter(new Date(s.nxtDate))
          );
          s.nxtDate += s.step;
        }

        s.imageOverlays[0].setOpacity(0.7);
      },

      _getTemporalWMSLayer: function () {

        var i, currentLayer;

        for (i = 0; i < this._layers.length; i++) {
          currentLayer = this._layers[i];
          if (currentLayer.temporal && currentLayer.type === 'WMS') {
            return currentLayer;
          }
        }
      }
    };

    ///////////////////////////////////////////////////////////////////////////

   /**
    * @function
    * @memberOf app.LayerGroup
    * @description creates a promise for the given layer and the provided
    *              service. The service should have a getData function that
    *              returns a promise that is resolved when data is recieved.
    * @param lgSlug layerGroup slug to include in the response.
    * @param layer  nxtLayer definition.
    * @param options options containing geometry or time.
    * @param deffered deffered to notify when service.getData resolves.
    * @param wantedService Service to getData from.
    */
    var buildPromise = function (
      lgSlug,
      layer,
      options,
      deferred,
      wantedService) {

      var buildSuccesCallback = function (data) {
        deferred.notify({
          data: data,
          type: layer.type,
          layerGroupSlug: lgSlug,
          layerSlug: layer.slug,
          aggType: layer.aggregation_type
        });
      };

      var buildErrorCallback = function (msg) {
        deferred.notify({
          data:  null,
          type: layer.type,
          layerGroupSlug: lgSlug,
          layerSlug: layer.slug
        });
      };

      options = options || {};
      options.agg = layer.aggregation_type;

      return wantedService.getData(layer, options)
        .then(buildSuccesCallback, buildErrorCallback);
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param {L.Class} Leaflet layer.
     * @description Adds layer to map
     */
    var addLeafletLayer = function (map, leafletLayer) { // Leaflet Layer

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
    var removeLeafletLayer = function (map, leafletLayer) { // Leaflet Layer

      if (map.hasLayer(leafletLayer)) {
        map.removeLayer(leafletLayer);
      } else {
        throw new Error(
          'Attempted to remove layer' + leafletLayer._id
          + 'while it was NOT part of provided the map'
        );
      }
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {L.Class} Leaflet layer
     * @param temproal boolean describing whether the layer is temporal
     * @description delegates initialization of leaflet layers to other
     *              functions.
     */
    var _initializeLeafletLayers = function (layers, temporal) {
      if (temporal) {
        //TODO: initialize imageoverlays
        return layers;
      }
      else {
        angular.forEach(layers, function (layer) {
          if (layer.type === 'Vector') {
            layer.leafletLayer = _initiateVectorLayer(layer);
          } else if (layer.type === 'TMS') {
            layer.leafletLayer = _initiateTMSLayer(layer);
          } else if (layer.type === 'UTFGrid') {
            layer.leafletLayer = _initiateGridLayer(layer);
          } else if (layer.type === 'WMS' && layer.tiled) {
            layer.leafletLayer = _initiateWMSLayer(layer);
          } else if (!layer.tiled) {
            // TODO: initialise imageoverlay
          } else if (layer.type !== 'Store') {
            // this ain't right
            throw new Error(layer.type + ' is not a supported layer type');
          }
        });
      }
      return layers;
    };


    var _initiateVectorLayer = function (nonLeafLayer) {

      var leafletLayer;

      if (nonLeafLayer._tiled) {

        // Initiate a tiled Vector layer

        var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

        leafletLayer = new LeafletService.TileDataLayer(url, {

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

        //throw new Error('Initiate (non-tiled) Vector layer, for e.g. events');
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
    var _initiateTMSLayer = function (nonLeafLayer) {

      var layerUrl = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';
      var layer = LeafletService.tileLayer(
        layerUrl, {
          slug: nonLeafLayer.slug,
          minZoom: nonLeafLayer.min_zoom || 0,
          maxZoom: 19,
          detectRetina: true,
          zIndex: nonLeafLayer.z_index,
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
    var _initiateWMSLayer = function (nonLeafLayer) {
      var _options = {
        layers: nonLeafLayer.slug,
        format: 'image/png',
        version: '1.1.1',
        minZoom: nonLeafLayer.min_zoom || 0,
        maxZoom: 19,
        zIndex: nonLeafLayer.z_index
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
    var _initiateGridLayer = function (nonLeafLayer) {

      var url = nonLeafLayer.url + '/{slug}/{z}/{x}/{y}.{ext}';

      var layer = new LeafletService.UtfGrid(url, {
        ext: 'grid',
        slug: nonLeafLayer.slug,
        name: nonLeafLayer.slug,
        useJsonP: false,
        minZoom: nonLeafLayer.min_zoom_click || 0,
        maxZoom: 19,
        order: nonLeafLayer.z_index,
        zIndex: nonLeafLayer.z_index
      });
      return layer;
    };

    ///////////////////////////////////////////////////////////////////////////

    return LayerGroup;
  }
]);
