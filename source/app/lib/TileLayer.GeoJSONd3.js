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

    var size = this._map.getPixelBounds().getSize();

    this._container = d3.select(".leaflet-overlay-pane")
      .append("svg")
      .attr("class", "leaflet-layer leaflet-zoom-hide")
      .attr("id", "geojson-d3")
      .attr("width", size.x)
      .attr("height", size.y);

    this._path = d3.geo.path().projection(function (d) {
      var point = map.latLngToLayerPoint(new L.LatLng(d[1], d[0]));
      return [point.x, point.y];
    });

    // Call onmove to position the svg.
    this._onMove();

    // add event listeners to update layer's position and size
    this._map.on('moveend', this._onMove, this);
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
    this._map.off('resize', this._onResize, this);
  },

  /**
   * Move event function. The svg is moved by the position of the bottomleft 
   * corner of the map relative to the origin. The features within the svg 
   * are moved in the opposite direction to keep the features at the same 
   * position relative to the map.
   */
  _onMove: function () {
    var bottomLeft = this._map.getPixelBounds().getBottomLeft();
    var origin = this._map.getPixelOrigin();
    var size = this._map.getPixelBounds().getSize();
    var svg = this._container;
    // Store location of the svg to position incoming tiles
    this._left = origin.x - bottomLeft.x;
    this._top = origin.y - (bottomLeft.y - size.y);
    svg.style("left", - this._left + "px")
      .style("top", - this._top + "px");
    svg.selectAll('g').attr("transform", "translate(" + this._left + "," + this._top + ")");
  },

  /**
   * Resize event function. Calls onmove to repostion and gets new pixel
   * bounds to resize the svg.
   */
  _onResize: function () {
    this._onMove();
    var size = this._map.getPixelBounds().getSize();
    var svg = this._container;
    svg.attr("width", size.x)
      .attr("height", size.y);
  },

  _loadTile : function (tile, tilePoint) {
    var self = this;
    this._adjustTilePoint(tilePoint);

    if (!tile.nodes && !tile.xhr) {
      tile.xhr = d3.json(this.getTileUrl(tilePoint), function (d) {
        tile.xhr = null;
        tile.nodes = self._container
          .append("g")
            .attr("class", "geojsontile")
            .attr("transform", "translate(" + self._left + "," + self._top + ")");
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
