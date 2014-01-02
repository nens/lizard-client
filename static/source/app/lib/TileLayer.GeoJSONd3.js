/**
 * Leaflet Tilelayer for d3 geojson vectors
 * from https://gist.github.com/ZJONSSON/5529395
 * plus code copied from http://bl.ocks.org/tnightingale/4718717
 * a little help from @jsmits and @fritzvd and @arjenvrielink
 * 
 * NOTE: this a good candidate to release as open source plugin for leaflet
 *
 * TODO:
 * * write _applyStyle function
 * * write initialise function
 *
 */
L.TileLayer.GeoJSONd3 = L.TileLayer.extend({

  // Write initialise function
    // code to add svg element to map container
    // var overlayPane = this._map.getPanes().overlayPane;
    //if (d3.select("svg.geojsontiles")[0].length === 0) {
      //d3.select(this._container).select("svg.geojsontiles").select("g").remove();
      //this.g = d3.select(this._container).select("svg.geojsontiles")
        //.append("g");
    //} else {

      //this.g = d3.select(this._container).append("svg")
        //.attr("class", "geojsontiles")
        //.append("g");
           //.attr("class", "leaflet-layer leaflet-zoom-hide")
    //}

  options: {
    "maxZoom": 20,
    "minZoom": 16
  },

  //initialize: function (data, options) {
    //options = L.setOptions(this, options);
  //},

  onAdd : function (map) {
    this._map = map;
    //var overlayPane = this._map.getPanes().overlayPane;
    //this._layer = d3.select(".leaflet-tile-container").append("svg");
    // ugly hack to get the proper svg element
    // TODO: clean up to elegant solution
    new L.geoJson({"type": "LineString", "coordinates": [[0, 0], [0, 0]]})
      .addTo(map);

    L.TileLayer.prototype.onAdd.call(this, map);

    this._path = d3.geo.path().projection(function (d) {
      var point = map.latLngToLayerPoint(new L.LatLng(d[1], d[0]));
      return [point.x, point.y];
    });
    
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

  //onRemove: function (map) {
    //d3.select(".geojsontiles").remove();
  //},

  _loadTile : function (tile, tilePoint) {
    var self = this;
    this._adjustTilePoint(tilePoint);

    if (!tile.nodes && !tile.xhr) {
      tile.xhr = d3.json(this.getTileUrl(tilePoint), function (d) {
        tile.xhr = null;
        tile.nodes = d3.select(".leaflet-overlay-pane").select("svg").append("g");
        tile.nodes.selectAll("path")
          .data(d.features).enter()
          .append("path")
            .attr("d", self._path)
            .style("stroke-width", 0)
            .style("fill-opacity", 0)
            .attr("class", function (feature) {
              return self.options.class + " p" + feature.properties.id;
            });
         // }
      });
    }
  },

  //TODO: write applyStyle function
  //_applyStyle: 
});
