'use strict';

/**
 * @ngdoc service
 * @name LeafletVectorService
 * @description
 * # LeafletVector
 * Creates a Tiled Layer for retrieving and drawing vector data.
 */
angular.module('lizard-nxt')
  .service('LeafletVectorService', ["LeafletService", "VectorService", "UtilService",
      function (LeafletService, VectorService, UtilService) {

  var GeoJSONCanvasLayer = LeafletService.Class.extend({

    includes: [L.Mixin.Events, L.Mixin.TileLoader],

    options: {
      minZoom: 0,
      maxZoom: 28,
      tileSize: 256,
      subdomains: 'abc',
      errorTileUrl: '',
      attribution: '',
      zoomOffset: 0,
      opacity: 1,
      unloadInvisibleTiles: L.Browser.mobile,
      updateWhenIdle: L.Browser.mobile,
      tileLoader: false // installs tile loading events
    },

    initialize: function (options) {
      var self = this;
      options = options || {};
      //this.project = this._project.bind(this);
      this.render = this.render.bind(this);
      L.Util.setOptions(this, options);
      this._canvas = this._createCanvas();
      // backCanvas for zoom animation
      this._backCanvas = this._createCanvas();
      this._ctx = this._canvas.getContext('2d');
      this.currentAnimationFrame = -1;
      this.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                                  window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
                                      return window.setTimeout(callback, 1000 / 60);
                                  };
      this.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
                                  window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || function(id) { clearTimeout(id); };
    },

    _createCanvas: function() {
      var canvas;
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = 0;
      canvas.style.left = 0;
      canvas.style.pointerEvents = "none";
      canvas.style.zIndex = this.options.zIndex || 0;
      var className = 'leaflet-tile-container leaflet-zoom-animated';
      canvas.setAttribute('class', className);
      return canvas;
    },

    onAdd: function (map) {
      this._map = map;

      // add container with the canvas to the tile pane
      // the container is moved in the oposite direction of the
      // map pane to keep the canvas always in (0, 0)
      var tilePane = this._map._panes.tilePane;
      var _container = L.DomUtil.create('div', 'leaflet-layer');
      _container.appendChild(this._canvas);
      _container.appendChild(this._backCanvas);
      this._backCanvas.style.display = 'none';
      tilePane.appendChild(_container);

      this._container = _container;

      // hack: listen to predrag event launched by dragging to
      // set container in position (0, 0) in screen coordinates
      if (map.dragging.enabled()) {
        map.dragging._draggable.on('predrag', function() {
          var d = map.dragging._draggable;
          L.DomUtil.setPosition(this._canvas, { x: -d._newPos.x, y: -d._newPos.y });
        }, this);
      }

      map.on({ 'viewreset': this._reset }, this);
      map.on('move', this.render, this);
      map.on('resize', this._reset, this);
      map.on({
          'zoomanim': this._animateZoom,
          'zoomend': this._endZoomAnim
      }, this);

      if(this.options.tileLoader) {
        this._initTileLoader();
      }

      this._reset();
    },

    _animateZoom: function (e) {
        if (!this._animating) {
            this._animating = true;
        }
        var back = this._backCanvas;

        back.width = this._canvas.width;
        back.height = this._canvas.height;

        // paint current canvas in back canvas with trasnformation
        var pos = this._canvas._leaflet_pos || { x: 0, y: 0 };
        back.getContext('2d').drawImage(this._canvas, 0, 0);

        // hide original
        this._canvas.style.display = 'none';
        back.style.display = 'block';
        var map = this._map;
        var scale = map.getZoomScale(e.zoom);
        var newCenter = map._latLngToNewLayerPoint(map.getCenter(), e.zoom, e.center);
        var oldCenter = map._latLngToNewLayerPoint(e.center, e.zoom, e.center);

        var origin = {
          x:  newCenter.x - oldCenter.x,
          y:  newCenter.y - oldCenter.y
        };

        var bg = back;
        var transform = L.DomUtil.TRANSFORM;
        bg.style[transform] =  L.DomUtil.getTranslateString(origin) + ' scale(' + e.scale + ') ';
    },

    _endZoomAnim: function () {
        this._animating = false;
        this._canvas.style.display = 'block';
        this._backCanvas.style.display = 'none';
    },

    getCanvas: function() {
      return this._canvas;
    },

    getAttribution: function() {
      return this.options.attribution;
    },

    draw: function() {
      return this._reset();
    },

    onRemove: function (map) {
      this._container.parentNode.removeChild(this._container);
      map.off({
        'viewreset': this._reset,
        'move': this._render,
        'resize': this._reset,
        'zoomanim': this._animateZoom,
        'zoomend': this._endZoomAnim
      }, this);
    },

    addTo: function (map) {
      map.addLayer(this);
      return this;
    },

    setOpacity: function (opacity) {
      this.options.opacity = opacity;
      this._updateOpacity();
      return this;
    },

    setZIndex: function(zIndex) {
      this._canvas.style.zIndex = zIndex;
    },

    bringToFront: function () {
      return this;
    },

    bringToBack: function () {
      return this;
    },

    _reset: function () {
      var size = this._map.getSize();
      this._canvas.width = size.x;
      this._canvas.height = size.y;
      this.onResize();
      this._render();
    },

    /*
    _project: function(x) {
      var point = this._map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
      return [point.x, point.y];
    },
    */

    _updateOpacity: function () { },

    _render: function() {
      if (this.currentAnimationFrame >= 0) {
        this.cancelAnimationFrame.call(window, this.currentAnimationFrame);
      }
      this.currentAnimationFrame = this.requestAnimationFrame.call(window, this.render);
    },

    // use direct: true if you are inside an animation frame call
    redraw: function(direct) {
      if (direct) {
        this.render();
      } else {
        this._render();
      }
    },

    onResize: function() {
    },

    render: function() {
      throw new Error('render function should be implemented');
    }

  });

  /**
   * Leaflet does not have a tiled geojson layer.
   * So.. we made it.
   *
   * It uses the tiling mechanism to retrieve data. Which when loaded
   * fires a dataCallback (defined in layer options).
   *
   * For every tile that comes in it draws data in a geojsonLayer.
   *
   */
  var TileDataLayer = LeafletService.TileLayer.extend({

    /**
     * @function
     * @description adds functionality to original Add function
     * of Leaflet.
     */
    onAdd: function (map) {
      this._map = map;
      this._requests = [];

      this._tilesLoading = {};
      this.isLoading = false;

      var color = this.options.color;

      this.drawOptions = {
        pointToLayer: function (feature, latlng) {
          var geojsonMarkerOptions = {
            radius: UtilService.lin2log((feature.properties.radius || 6), 6, 16),
            fillColor: color,
            color: "#FFF",
            weight: 2,
            fillOpacity: 1,
            opacity: 1
          };

          var circle = LeafletService.circleMarker(
            latlng, geojsonMarkerOptions);
          circle.on('click', function (e) {
            // simulate click on map instead of this event;
            this._map.fire('click', {
              latlng: new LeafletService.LatLng(
                e.target.feature.geometry.coordinates[1],
                e.target.feature.geometry.coordinates[0])
            });
          });

          return circle;
        }
      };

      LeafletService.TileLayer.prototype.onAdd.call(this, map);
      var size = this._map.getPixelBounds().getSize();

      this.geojsonLayer = LeafletService.geoJson(
        null, this.drawOptions).addTo(map);
      this._map.on('moveend', this._onMove, this);
    },

    /**
     * @function
     * @description Remove geojson sublayer
     * plus call original onremove event
     * @param {object} instance of Leaflet.Map
     */
    onRemove: function (map) {
      this._reset();
      this._map.off('moveend', this._onMove, this);
      map.removeLayer(this.geojsonLayer);
      this.isLoading = false;
      LeafletService.TileLayer.prototype.onRemove.call(this, map);
    },

    /**
     * @function
     * @description handler for move events,
     * triggers a redraw etc.
     */
    _onMove: function () {
      this.redraw();
    },

    /**
     * @function
     * @description Handles what happens with xhr requests.
     * cancelling and triggering events.
     * @param {object} request object
     * @param {object} layer this is a part of
     * @param {tile} tile this request belongs to
     * @param {LeafletService.TilePoint} coordinates of tile corner.
     */
    _xhrHandler: function (req, layer, tile, tilePoint) {
      return function () {
        if (req.readyState !== 4) {
          return;
        }

        var s = req.status;
        if ((s >= 200 && s < 300) || s === 304) {
          tile.datum = JSON.parse(req.responseText);
          layer._tileLoaded(tile, tilePoint);
        } else {
          layer._tileLoaded(tile, tilePoint);
        }
      };
    },

    /**
     * @function
     * @description does the actual request and sets
     * keys and status.
     * @param {tile} Tile which is being loaded
     * @param {LeafletService.TilePoint} coordinates of tile corner.
     */
    _loadTile: function (tile, tilePoint) {
      var self = this;

      this._adjustTilePoint(tilePoint);

      var key = 'key_' + tilePoint.z + '_' + tilePoint.x + '_' + tilePoint.y;
      this._tilesLoading[key] = 'busy';

      var layer = this;
      var req = new XMLHttpRequest();
      this._requests.push(req);
      req.onreadystatechange = this._xhrHandler(req, layer, tile, tilePoint);
      req.open('GET', this.getTileUrl(tilePoint), true);
      req.send();
    },

    /**
     * @function
     * @description aborts requests and triggers reset for geojson layer
     */
    _reset: function () {
      LeafletService.TileLayer.prototype._reset.apply(this, arguments);
      for (var i in this._requests) {
        this._requests[i].abort();
      }
      this._requests = [];
      this._tilesLoading = {};
      if (this.geojsonLayer) {
        this._resetgeoJson();
      }
    },

    /**
     * @function
     * @description empties and re-adds geojsonlayer to the map
     */
    _resetgeoJson: function () {
      this._map.removeLayer(this.geojsonLayer);
      this.geojsonLayer = LeafletService.geoJson(null, this.drawOptions)
        .addTo(this._map);
    },

    /**
     * @function
     * @description counts all the data for the same point
     * @param {object} geojson features array
     */
    countOverlapping: function (data) {
      var minimumRadius = 6;
      var overlapLocations = [];
      var filteredData = [];
      data.forEach(function (d, index) {
        d.properties.radius = minimumRadius;
        var key = "x:" + d.geometry.coordinates[0] +
                  "y:" + d.geometry.coordinates[1];
        var coord = overlapLocations[key];
        if (coord === undefined) {
          overlapLocations[key] = index;
          filteredData.push(d);
        } else if (!filteredData[overlapLocations[key]]) {
          return undefined;
        } else {
          filteredData[overlapLocations[key]].properties.radius += 1;
        }
      });
      return filteredData;
    },

    /**
     * @function
     * @description Implements opacity handler like other TileLayers
     * @params {float} amount of opacity between 0 and 1.
     */
    setOpacity: function (opacity) {
      // TODO: figure out why it is possible to call setOpacity while there is
      // no geojsonlayer.
      if (this.geojsonLayer) {
        this.geojsonLayer.setStyle({
          opacity: opacity,
          fillOpacity: opacity
        });
      }
    },

    /**
     * @function
     * @description Draws the data in the geojsonlayer
     * @param {data} geojson features object
     */
    drawTheThings: function (data, self) {
      if (!data) { return; }

      var filteredData;
      if (data.hasOwnProperty('features')) {
        filteredData = self.countOverlapping(data.features);
      } else if (data instanceof Array) {
        filteredData = self.countOverlapping(data);
      }
      self.geojsonLayer.addData(filteredData);
    },

    /**
     * @function
     * @description this passes the received data on to the
     * VectorService
     */
    addTileData: function (featureCollection, point) {
      if (!featureCollection) { return; }

      if (featureCollection.features.length > 0) {
        VectorService.setData(
            this.options.slug,
            featureCollection.features,
            point.z
            );
      }
    },


    /**
     * @function
     * @description sync the time
     */
    syncTime: function (layer, timeState) {
      //this.options.layer = layer;
      this.options.start = timeState.start;
      this.options.end = timeState.end;
      this.redraw();
    },

    /**
     * @function
     * @description redraw all the things.
     */
    redraw: function () {
      var self = this;
      if (self._map !== undefined) {
        VectorService.getData(
          self.options.slug, {
            layer: self,
            geom: self._map.getBounds(),
            start: self.options.start,
            end: self.options.end
          }).then(function (response) {
            self._resetgeoJson();
            self.drawTheThings(response, self);
          });
      }
    },

    /**
     * @function
     * @description Triggers after a load of one particular Tile.
     * @param {Tile} Tile this belongs to.
     * @param {LeafletService.TilePoint} coordinates of tile corner.
     */
    _tileLoaded: function (tile, tilePoint) {
      var key = 'key_' + tilePoint.z + '_' + tilePoint.x + '_' + tilePoint.y;
      this._tilesLoading[key] = 'done';

      this.isLoading = false;

      if (tile.datum === null) { return null; }

      this.addTileData(tile.datum, tilePoint);
      for (var tile in this._tilesLoading) {
        if (this._tilesLoading[tile] === 'busy') {
          this.isLoading = true;
          break;
        }
      }

      if (!this.isLoading) {
        this.fire('loadend');
      }

      this.redraw();
    }
  });

  return TileDataLayer;

}]);
