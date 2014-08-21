'use strict';

/**
 * Leaflet layer for d3 geojson vectors
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
L.NonTiledGeoJSONd3 = L.Class.extend({

  options: {
    "maxZoom": 20,
    "minZoom": 10
  },

  initialize: function (data, options) {
    this._data = data;
    this.options = L.extend(this.options, options);
    if (this.options.hasOwnProperty('idExtractor')) {
      this._idExtractor = this.options.idExtractor;
    } else {
      this._idExtractor = function (feature) { return feature.id; };
    }
  },

  onAdd : function (map) {

    this._map = map;

    var size = this._map.getPixelBounds().getSize();

    this._container = d3.select(map.getPanes().overlayPane)
      .append("svg")
      .attr("class", "leaflet-layer leaflet-zoom-hide")
      .attr("id", "geojson-d3-non-tiled")
      .attr("width", size.x)
      .attr("height", size.y);

    this._projection = function (d) {
      var point = map.latLngToLayerPoint(new L.LatLng(d[1], d[0]));
      return [point.x, point.y];
    };
    var self = this;
    this._path = d3.geo.path().projection(self._projection);

    this.overlapLocations = {};
    this.g = this._renderG();
    this._refreshData();

    // Call onmove to position the svg.
    this._onMove();

    // add event listeners to update layer's position and size
    this._map.on('moveend', this._onMove, this);
    this._map.on('resize', this._onResize, this);
  },

  _renderG: function () {
    var self = this;
    return this._container.append("g")
      .attr("class", "geojsonnontile")
      .attr("transform", "translate(" + self._left + "," + self._top + ")");
  },

  /**
   * _renderData 
   * Renders geoJSON data in the svg container.
   * If the options has a 'selectorPrefix' property
   * your 'path' elements will be accessible with an id.
   *
   * NOTE: this is now only a good option for point data.
   * something could be done with paths:
   *        .append("path")
   *        .attr("d", self._path);
   *
   */
  _refreshData: function () {
    var self = this;
    self.overlapLocations = {};
    if (this.g.empty()) {
      this.g = this._renderG();
    }
    var features = this.g.selectAll("circle")
      .data(this._data.features, self.idExtractor);

    features.enter()
      .append("svg:circle")
        .attr("stroke-width", 1.8)
        .attr("stroke", "white")
        .attr("class", function (feature) {
          var classList = self.options.class;
          if (self.options.hasOwnProperty('selectorPrefix')) {
            classList += " " + self.options.selectorPrefix
                             + self._idExtractor(feature);
          }
          return classList;
        });

    var overlapLocations = {};

    features
      .attr("fill", function (d) { return d.properties.color; })
      .attr("cx", function (d) {
        return self._projection(d.geometry.coordinates)[0];
      })
      .attr("cy", function (d) {
        return self._projection(d.geometry.coordinates)[1];
      })
      .attr("r", function (d) {
        var radius, overlaps;
        overlaps = self.countOverlapLocations(overlapLocations, d);
        // logarithmic scaling with a minimum radius of 6
        radius = 6 + (5 * Math.log(overlaps));
        return radius;
      });

    features.exit()
        .style("fill-opacity", 1e-6)
        .remove();

    if (self.options.applyStyle) {
      self.options.applyStyle.call(this, features);
    }
  },

  /**
   * Count overlapping locations.
   *
   * Adds a lat + lon key to overlapLocations if not defined and sets
   * counter to 1. If key exists adds +1 to counter. Returns counter for
   * current key.
   *
   * TODO: add option to set precision of location?
   *
   * @parameter {object} d D3 data object, should have  a geometry property
   * @returns {integer} Count for current key
   *
   */
  countOverlapLocations: function (overlapLocations, d) {
      var key = "x:" + d.geometry.coordinates[0] +
                "y:" + d.geometry.coordinates[1];
      var coord = overlapLocations[key];
      if (coord === undefined) {
        overlapLocations[key] = 1;
      } else {
        overlapLocations[key] += 1;
      }
      return overlapLocations[key];
    },

  /**
   * Clean up layer.
   *
   * reset overlapLocations, remove DOM elements, unbind events.
   */
  onRemove: function (map) {
    this.overlapLocations = {};
    d3.selectAll(".geojsonnontile").remove();
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
    var self = this;
    var bottomLeft = this._map.getPixelBounds().getBottomLeft();
    var origin = this._map.getPixelOrigin();
    var size = this._map.getPixelBounds().getSize();
    var svg = this._container;
    // Store location of the svg to position incoming tiles
    this._left = origin.x - bottomLeft.x;
    this._top = origin.y - (bottomLeft.y - size.y);
    svg.style("left", - this._left + "px")
      .style("top", - this._top + "px");
      // debugger
    svg.selectAll("g")
      .attr("transform", "translate(" + this._left + "," + this._top + ")")
      .selectAll("circle")
        .attr("cx", function (d) {
          return self._projection(d.geometry.coordinates)[0];
        })
        .attr("cy", function (d) {
          return self._projection(d.geometry.coordinates)[1];
        });
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

  /**
   * Select all features in layer.
   */
  getFeatureSelection: function () {
    return this._container.selectAll("g")
          .selectAll("circle");
  },

  /**
   * Bind click handler to layer.
   *
   * Works differently from Leaflet native, because it does not have a
   * connection to UTFGrid like the TileLayers. It uses d3 selection and
   * d3 onClick event.
   *
   */
  _bindClick: function (fn) {
    var self = this;
    if (typeof(fn) === "function") {
      var featureSelection = self.getFeatureSelection(self);
      self.clickHandler = fn;
      // NOTE: this is a d3 click.
      featureSelection.on('click', function (d) {
        d3.event.stopImmediatePropagation();
        self.clickHandler(d);
      });
    }
  },
});

L.nonTiledGeoJSONd3 = function (data, options) {
  return new L.NonTiledGeoJSONd3(data, options);
};
