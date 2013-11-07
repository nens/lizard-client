/* 
 * Leaflet Tilelayer for d3 vectors
 * from https://gist.github.com/ZJONSSON/5529395
 * plus code copied from http://bl.ocks.org/tnightingale/4718717
 * a little help from @jsmits and @fritzvd
 * 
 */
// this GeoJSOND3 generates one linestring per tile
L.TileLayer.GeoJSONd3 = L.TileLayer.extend({
  onAdd : function(map) {
    // debugger
    L.TileLayer.prototype.onAdd.call(this,map);
    // var overlayPane = this._map.getPanes().overlayPane;
    if (d3.select("svg.geojsontiles")[0].length == 0){
      d3.select(this._container).select("svg.geojsontiles").select("g").remove();    
      this.g = d3.select(this._container).select("svg.geojsontiles")
        .append("g")
    } else {

      this.g = d3.select(this._container).append("svg")
        .attr("class", "geojsontiles")
        .append("g")
          // .attr("class", "leaflet-layer leaflet-zoom-hide")
    }

    this._path = d3.geo.path().projection(function(d) {
      var point = map.latLngToLayerPoint(new L.LatLng(d[1],d[0]));
      return [point.x,point.y];
    });
    
    this.on("tileunload",function(d) {
      if (d.tile.xhr) d.tile.xhr.abort();
      if (d.tile.nodes) d.tile.nodes.remove();
      d.tile.nodes = null;
      d.tile.xhr = null;
    });
  },
  _loadTile : function(tile, tilePoint) {
    var self = this;
    this._adjustTilePoint(tilePoint);

    if (!tile.nodes && !tile.xhr) {
      tile.nodes = d3.select();
      tile.xhr = d3.json(this.getTileUrl(tilePoint), function(d) {
        tile.xhr = null;
          tile.nodes 
          self.g.selectAll("path")
            .data(d.features).enter()
              .append("path")
                .attr("d", self._path)
                .style("stroke", "#222")
                .style("stroke-width", "6px")
                .style("fill", "#222")
                .attr("class", self.options.class);
         // }
      });
    }
  },
  onRemove: function (map) {
    d3.select(".geojsontiles").remove();
  }
});


// this GeoJSOND3 does show all line elements separately, which results in
// a large number (>10000) of linestrings. Animating these slows down
// performance considerably.
/* Experimental vector tile layer for Leaflet
 * Uses D3 to render GeoJSON; faster than Leaflet's native.
 * Originally by Ziggy Jonsson: http://bl.ocks.org/ZJONSSON/5602552
 * Reworked by Nelson Minar: http://bl.ocks.org/NelsonMinar/5624141
 *
 * Todo:
 *   Make this work even if <svg> isn't in the DOM yet
 *   Make this work for tile types that aren't FeatureCollection
 *   Match D3 idioms for .classed(), .style(), etc
 *   Work on allowing feature popups, etc.
 */
//L.TileLayer.GeoJSONd3 =  L.TileLayer.extend({
//    onAdd : function(map) {
//        L.TileLayer.prototype.onAdd.call(this,map);
//        this._path = d3.geo.path().projection(function(d) {
//            var point = map.latLngToLayerPoint(new L.LatLng(d[1],d[0]));
//            return [point.x,point.y];
//        });
//        this.on("tileunload",function(d) {
//            if (d.tile.xhr) d.tile.xhr.abort();
//            if (d.tile.nodes) d.tile.nodes.remove();
//            d.tile.nodes = null;
//            d.tile.xhr = null;
//        });
//    },
//    _loadTile : function(tile,tilePoint) {
//        var self = this;
//        this._adjustTilePoint(tilePoint);
//
//        if (!tile.nodes && !tile.xhr) {
//            tile.xhr = d3.json(this.getTileUrl(tilePoint),function(geoJson) {
//                tile.xhr = null;
//                tile.nodes = d3.select(map._container).select("svg").append("g");
//                tile.nodes.selectAll("path")
//                  .data(geoJson.features).enter()
//                  .append("path")
//                    .attr("d", self._path)
//                    .attr("class", self.options.class);
////                    .attr("style", self.options.style)
////                    .attr("id", self.options.identifier);
//            });
//        }
//    }
//});
