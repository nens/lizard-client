'use strict';

/**
 * Leaflet Tilelayer for d3 geojson vectors
 * from https://gist.github.com/ZJONSSON/5529395
 * plus code copied from http://bl.ocks.org/tnightingale/4718717
 * Cotributions from @jsmits, @fritzvd, @arjenvrielink and @ernstkui
 * 
 * Each feature gets it's id as a class attribute so you can easily select it
 * with d3
 *
 * NOTE: this a candidate to release as open source plugin for leaflet
 *
 */
L.GeoJSONd3 = L.TileLayer.extend({

  options: {
    "maxZoom": 20,
    "minZoom": 16
  },

  onAdd : function (map) {

    this._map = map;

    L.TileLayer.prototype.onAdd.call(this, map);

    var dimensions = this._map.getPixelBounds().getSize();

    // Store initial location of the svg relative to the map
    this._bottomLeft = this._map.getPixelBounds().getBottomLeft();
    // And the location of the svg relative to the svg
    this._left = 0;
    this._top = 0;

    this._container = d3.select(".leaflet-overlay-pane")
      .append("svg")
      .attr("class", "leaflet-layer leaflet-zoom-hide")
      .attr("viewBox", "-0.5 -0.5 " + dimensions.x + " " + dimensions.y)
      .attr("width", dimensions.x)
      .attr("height", dimensions.y);

    this._path = d3.geo.path().projection(function (d) {
      var point = map.latLngToLayerPoint(new L.LatLng(d[1], d[0]));
      return [point.x, point.y];
    });
    
    // add event listeners for updating layer's position and size
    this._map.on('moveend', this._onMove, this);
    this._map.on('zoomend', this._onZoomEnd, this);
    this._map.on('zoomstart', function () {
      this._zoom = true;
    }, this);
    this._map.on('resize', this._onResize, this);

    this.on("tileunload", function (d) {
      if (d.tile.xhr) {
        d.tile.xhr.abort();
      }
      if (d.tile.nodes) {
        d.tile.nodes.remove();
      }
      d.tile.nodes = null;
      d.tile.xhr = null;
    });
  },

  onRemove: function (map) {
    d3.selectAll(".geojsontile").remove();
    this._container.remove();
    this._map.off('moveend', this._onMove, this);
    this._map.off('zoomend', this._onZoomEnd, this);
    this._map.off('zoomstart', function () {
      this._zoom = true;
    }, this);
    this._map.off('resize', this._onResize, this);
  },

  /**
   * Move event function. NewBL is the location of the bottomLeft corner
   * of the map in px. The svg is moved by the difference between the old
   * bottom left position and the new bottom left position. The features 
   * within the svg are moved in the opposite direction to keep the features
   * at the same position relative to the map.
   */
  _onMove: function () {
    if (!this._zoom) {
      var newBL = this._map.getPixelBounds().getBottomLeft();
      var svg = this._container;
      this._left = Number(svg.style("left").slice(0, -2)) - (this._bottomLeft.x - newBL.x);
      this._top = Number(svg.style("top").slice(0, -2)) - (this._bottomLeft.y - newBL.y);
      this._bottomLeft = newBL;
      svg.style("left", this._left + "px")
        .style("top", this._top + "px");
      svg.selectAll('g').attr("transform", "translate(" + -(this._left) + "," + -(this._top) + ")");
    } else {
      this._zoom = false;
    }
  },

  /**
   * Zoom end event function. Dimensions are the current dimensions of the map
   * by setting the svg to these dimensions it always covers the whole extent.
   * This._bottomLeft is the new bottom left position of the resized svg.
   */
  _onZoomEnd: function () {
    var dimensions = this._map.getPixelBounds().getSize();
    var svg = this._container;
    svg.attr("width", dimensions.x)
      .attr("height", dimensions.y);
    this._bottomLeft = this._map.getPixelBounds().getBottomLeft();
  },

  /**
   * Resize event function. Cleans the svg, start over.
   */
  _onResize: function (size) {
    this.onRemove(this._map);
    this.onAdd(this._map);
  },

  _loadTile : function (tile, tilePoint) {
    var self = this;
    this._adjustTilePoint(tilePoint);

    if (!tile.nodes && !tile.xhr) {
      tile.xhr = d3.json(this.getTileUrl(tilePoint), function (d) {
        tile.xhr = null;
        tile.nodes = d3.select(".leaflet-overlay-pane").select("svg")
          .append("g")
            .attr("class", "geojsontile")
            .attr("transform", "translate(" + -(self._left) + "," + -(self._top) + ")");
        var features = tile.nodes.selectAll("path")
          .data(d.features).enter()
          .append("path")
            .attr("d", self._path)
            .attr("class", function (feature) {
              return self.options.class + " p" + feature.properties.id;
            });
        
        if (self.options.applyStyle) {
          self.options.applyStyle.call(this, features);
        }
      });
    }
  }
});

L.geoJSONd3 = function (data, options) {
  return new L.GeoJSONd3(data, options);
};
