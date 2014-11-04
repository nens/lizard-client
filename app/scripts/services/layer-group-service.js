
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
 *
 *
 * TODO:
 *
 * - [ ] Move animation out of here. Layergroups adhere to time but should not have
 *       a notion of *animation* and should not *set* timeState to the out side
 *       world. Instead it should communicate with promises to the *animator* whether
 *       it is ready adhering to the timeState.
 *
 * - [ ] AnimState should not have to contain any state other than the time it is
 *       adhering and the leafletLayers (frames) it currently has.
 *
 * - [ ] Temporal layergroups should initialize when toggled to active for the first
 *       time. There should not be a _animState.initiated since the layergroup
 *       already has an initiated property.
 *
 * - [ ] Adhering of a WMS layer to a timeState is the responsibility of the
 *       NxtLayer. The app calls layergroup.syncTime > the layerGroup tells
 *       all its layers to adhere to this time.
 *
 */
angular.module('lizard-nxt')
  .factory('LayerGroup', [
  'NxtTMSLayer', 'NxtWMSLayer', 'NxtVectorLayer', 'NxtUTFLayer', 'StoreLayer', 'NxtLayer',
  'UtilService', '$q', 'RasterService', '$http',
  function (NxtTMSLayer, NxtWMSLayer, NxtVectorLayer, NxtUTFLayer, StoreLayer, NxtLayer, UtilService, $q, RasterService, $http) {

    /*
     * @constructor
     * @memberOf app.LayerGroup
     * @description Instantiates a layerGroup with non-readable and
     *              non-configurable properties
     * @param  {object} layergroup definition as coming from the server
     */
    function LayerGroup(layerGroup) {
      Object.defineProperty(this, 'temporal', {
        value: layerGroup.temporal,
        writable: false,
      });
      Object.defineProperty(this, 'name', {
        value: layerGroup.name,
        writable: false,
      });
      Object.defineProperty(this, 'order', {
        value: layerGroup.order,
        writable: false,
      });
      Object.defineProperty(this, 'baselayer', {
        value: layerGroup.baselayer,
        writable: false,
      });
      Object.defineProperty(this, 'slug', {
        value: layerGroup.slug,
        writable: false,
      });
      Object.defineProperty(this, 'defaultActive', {
        value: layerGroup.active,
        writable: false,
      });
      Object.defineProperty(this, '_layers', {
        value: [],
        writable: true,
      });
      Object.defineProperty(this, '_opacity', {
        value: layerGroup.opacity,
        writable: true,
      });
      Object.defineProperty(this, '_active', {
        value: false,
        writable: true,
      });

      // Instantiate a Layer for every servserside layer of
      // the layergroup.
      var layers = this._layers;
      angular.forEach(layerGroup.layers, function (layer) {
        if (layer.type === 'TMS') {
          layers.push(new NxtTMSLayer(layer));
        }
        else if (layer.type === 'WMS' && layer.tiled) {
          layers.push(new NxtWMSLayer(layer));
        }
        else if (layer.type === 'UTFGrid') {
          layers.push(new NxtUTFLayer(layer));
        }
        else if (layer.type === 'Vector') {
          layers.push(new NxtVectorLayer(layer));
        }
        else if (layer.type === 'Store') {
          layers.push(new StoreLayer(layer));
        }
        else if (!layer.tiled) {
          // TODO: initialise imageoverlay
          layers.push(new NxtLayer(layer));
        }
        else {
          // this ain't right
          throw new Error(this.type + ' is not a supported layer type');
        }
      });

      // Sort them
      this._layers = sortLayers(layers);

    }

    LayerGroup.prototype = {

      constructor: LayerGroup,

     /**
      * @function
      * @memberOf app.LayerGroup.prototype
      * @description toggles a layergroup on the given map.
      * @param  {object} map Leaflet map to toggle this layer on
      */
      toggle: function (map) {
        if (!this._initiated) {
          this._initializeLayers(this._layers);
          this._initiated = true;
        }

        this._active = !this._active;

        this._toggleLayers(map, this._layers, this._active);
      },

      /**
       * Returns true is the current layerGroup (i.e. "this") is active and false
       * otherwise.
       */
      isActive: function () {
        return this._active;
      },

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
            deferred = $q.defer(),
            promises = [];

        if (!this._active) {
          deferred.resolve({slug: this.slug, active: this._active});
          return deferred.promise;
        }
        else {
          angular.forEach(this._layers, function (layer) {
            promises.push(layer.getData(lgSlug, options, deferred));
          });
        }

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
       *
       * Will move to layer-service or become obslote.. here for now
       * @function
       * @memberof app.LayerGroup
       * @param {object} layer passed
       * @description determine if raster layer can be rescaled
       */
      rescaleContinuousData: function (bounds) {
        angular.forEach(this._layers, function (layer) {
          layer.rescale(bounds);
        });
      },

      /**
       * @function
       * @memberof app.LayerGroup
       * @param {float} new opacity value
       * @return {void}
       * @description Changes opacity in layers that have
       * an opacity to be set
       */
      setOpacity: function (newOpacity) {
        if (typeof newOpacity !== 'number' ||
            newOpacity < 0 && newOpacity > 1) {
          throw new Error(newOpacity + "is not a valid opacity value, it is"
            + "either of the wrong type or not between 0 and 1");
        }
        if (this._active) {
          angular.forEach(this._layers, function (layer) {
            layer.setOpacity(newOpacity);
          });
        }
        this._opacity = newOpacity;
      },

      /**
       * @function
       * @member app.LayerGroup
       * @return {float} opacity from 0 to 1.
       * @description retrieve opacity from layer
       */
      getOpacity: function () {
        return this._opacity;
      },

      /**
       * Make layerGroup adhere to current timestate
       */
      syncTime: function (mapState, timeState, oldTime) {
        if (oldTime === timeState.at
          || !this._active) { return; }
        for (var i in this._layers) {
          var layer = this._layers[i];
          layer.syncTime(mapState, timeState, oldTime);
          // TODO: Ideally we delegate the adhering to time of a layer to the
          // layer class. This is legacy:
          if (this.temporal
            && layer.type === 'WMS'
            && !layer.tiled) {
            this._adhereWMSLayerToTime(layer, mapState, timeState, oldTime);
          }
        }
      },

      animationStop: function (timeState) {
        // gets a fresh set of images when the animation stops
        if (!this._animState.initiated) { return; }

        this._animGetImages(timeState);

        if (!timeState.animation.playing) {
          this._animState.imageOverlays[0].setOpacity(this._opacity);
        }
        this._animState.previousFrame = 0;
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

      _adhereWMSLayerToTime: function (temporalWMSLayer, mapState, timeState, oldTime) {
        var overlays,
            newTime = timeState.at,
            s = this._animState;

        if (!temporalWMSLayer) { return; }
        var currentDate  = this._mkTimeStamp(newTime),
            oldDate      = this._mkTimeStamp(oldTime),
            overlayIndex = s.frameLookup[currentDate];

        if (this.isActive()) {
          if (s.initiated) {
            if (!timeState.animation.playing) {
              this.animationStop(timeState);
            }
            else if (overlayIndex !== undefined && overlayIndex !== s.previousFrame) {
              this._animProgressOverlays(s, overlayIndex, currentDate, timeState);
            }
            else if (overlayIndex === undefined) {
              this._stopAnim(s, timeState);
            }
          } else {
            // Possibility 2: we (re-)start the animation:
            this._animRestart(s, mapState, timeState, temporalWMSLayer);
          }
        } else {
          this._animState.initiated = false;
          overlayIndex = undefined;
          // first, check whether we have added the first overlay to the map
          // (this implies a complete fixed-size set has been retrieved from API).
          if (mapState._map.hasLayer(s.imageOverlays[0])) {
            // if so, we remove (all) the overlays:
            for (var i in s.imageOverlays) {
              mapState._map.removeLayer(s.imageOverlays[i]);
            }
          }
        }
      },

      /**
       * Local helper that returns a rounded timestamp
       */
      _mkTimeStamp: function (t) {
        return UtilService.roundTimestamp(t, this._animState.step, false);
      },

      /**
       * stop anim
       */
      _stopAnim: function (s, timeState) {
        if (timeState.animation.playing) {
          s.restart = true;
          s.loadingRaster = 0;
        }
        if (timeState.playPauseAnimation) {
          timeState.playPauseAnimation('off');
        }
      },

      /**
       * restart anim
       */
      _animRestart: function (s, mapState, timeState, temporalWMSLayer) {
        this._animStart(temporalWMSLayer);
        var overlays = this._animState.imageOverlays;

        for (var i in overlays) {
          mapState._map.addLayer(overlays[i]);
        }

        // imgUrlBase equals full URL w/o TIME part
        this._animState.imageUrlBase
          = RasterService.buildURLforWMS(temporalWMSLayer);

        this._animGetImages(timeState);
        s.imageOverlays[0].setOpacity(this._opacity);
      },

      /**
       * progress anim
       */
      _animProgressOverlays: function (s, overlayIndex, currentDate, timeState) {

        var oldOverlay = s.imageOverlays[s.previousFrame],
            newOverlay = s.imageOverlays[overlayIndex];

        // Turn off old frame
        oldOverlay.setOpacity(0);
        // Turn on new frame
        newOverlay.setOpacity(this._opacity);

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
      },

      /**
       * @function
       * @memberof app.LayerGroup
       * @param  {L.Class} Leaflet layer
       * @param temproal boolean describing whether the layer is temporal
       * @description delegates initialization of leaflet layers to other
       *              functions.
       */
      _initializeLayers: function (layers) {
        angular.forEach(layers, function (layer) {
          layer.initializeLayer();
        });
      },

      _toggleLayers: function (map, layers, active) {
        if (active && layers.length > 0) {
          addLayersRecursively(map, layers, 0);
        }
        else {
          angular.forEach(layers, function (layer) {
            layer.remove(map);
          });
        }
        if (this._opacity) {
          this.setOpacity(this._opacity);
        }
      }
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {array} Array of nxt layers
     * @return {array} Array of object sorted by property loadOrder in
     *                 descending order.
     * @description Sorts layers by descending loadOrder
     */
    var sortLayers = function (layers) {
      layers.sort(function (a, b) {
        if (a.loadOrder > b.loadOrder) {
          return -1;
        }
        if (a.loadOrder < b.loadOrder
          || a.loadOrder === null) {
          return 1;
        }
        // a must be equal to b
        return 0;
      });
      return layers;
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {object} map Leaflet map to add layers to
     * @param  {array} Array of nxt layers
     * @param  {int} i index to start from
     * @description Adds the layers with the loadorder of layers[i]. Catches
     *              the returned promises and calls itself with the nxt index.
     *              When all layers are loaded it adds a listener to the last
     *              layer with the highest loadOrder.
     */
    var addLayersRecursively = function (map, layers, i) {
      var currentLoadOrder = layers[i].loadOrder;
      // Wrap contains the promises and the nxt index.
      var wrap = loadLayersByLoadOrder(map, layers, i, currentLoadOrder);
      // If there is more, wait for these layers to resolve
      // and start over with the remaining layers.
      if (wrap.i < layers.length) {
        startOverWhenDone(wrap.promises, map, layers, wrap.i);
      }
      // When done, add listener to the last layer with the max loadOrder
      // that is drawn on the map.
      else if (layers.length > 1) {
        var index = getIndexOfLeadingLayer(layers);
        if (typeof(index) === 'number') {
          addLoadListenersToLayer(map, layers, index);
        }
      }
    };


    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @param  {inte} loadOrder Current load order to add layers.
     * @return {object} next index and list of promises that resolve when layer
     *                       is fully loaded.
     * @description Adds the layers from index i with the given loadorder to the
     *              map. Returns the current index and a list of promises for
     *              all the added layers when a layer with a lower loadorder is
     *              found.
     */
    var loadLayersByLoadOrder = function (map, layers, i, loadOrder) {
      // Add all layers with the current load order
      var promises = [];
      while (i < layers.length
        && layers[i].loadOrder === loadOrder) {
        promises.push(layers[i].add(map));
        i++;
      }
      return {
        i: i,
        promises: promises
      };
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {array} layers Array of nxt layers.
     * @return {int} Index of the last layer with the highest loadOrder.
     * @description Loops through the sorted layers and returns the index of the
     *              last layer in the array with the highest loadOrder.
     */
    var getIndexOfLeadingLayer = function (layers) {
      var index;
      var highestLoadingOrder = 0;
      for (var i = 0; i < layers.length; i++) {
        if (layers[i].tiled
          && (layers[i].loadOrder > highestLoadingOrder
          || layers[i].loadOrder === highestLoadingOrder)) {
          index = i;
          highestLoadingOrder = index;
        }
      }
      return index;
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {array} Array of promises.
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @description Takes a list of promises and calls addLayersRecursively when
     *              all promises have resolved.
     */
    var startOverWhenDone = function (promises, map, layers, i) {
      $q.all(promises).then(function () {
        addLayersRecursively(map, layers, i);
      });
    };

    /**
     * @function
     * @memberof app.LayerGroup
     * @param  {object} map Leaflet map to add layers to.
     * @param  {array} layers Array of nxt layers.
     * @param  {int} i index to start from.
     * @description Adds listeners that call when load starts and finished to
     *              the layer at index i of layers. Callbacks remove layers of
     *              the map after index i when load starts and adds layers after
     *              index i recursively when load finishes.
     */
    var addLoadListenersToLayer = function (map, layers, i) {
      var layer = layers[i];
      var j = i + 1;

      var removeAllAfterI = function () {
        for (j; j < layers.length; j++) {
          layers[j].remove(map);
        }
      };

      var reAdd = function () {
        addLayersRecursively(map, layers, i + 1);
      };

      layer._leafletLayer.off('load');
      layer._leafletLayer.off('loading');
      layer._leafletLayer.on('loading', removeAllAfterI);
      layer._leafletLayer.on('load', reAdd);
    };

    return LayerGroup;
  }
]);
