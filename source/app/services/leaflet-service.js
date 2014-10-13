/**
 * @ngdoc service
 * @class LeafletService
 * @memberof app
 * @name LeafletService
 * @description Trivial wrapper for global Leaflet object.
 *
 * Perhaps in the future this can be done with CommonJS style requires.
 */
app.service('LeafletService', [function () {
  var TileDataLayer = L.TileLayer.extend({
    onAdd: function (map) {
      this._map = map;
      this._requests = [];

      this._tilesLoading = {};
      this.isLoading = false;

      this.addTileData = this.options.dataCallback;
      
      L.TileLayer.prototype.onAdd.call(this, map);
      var size = this._map.getPixelBounds().getSize();

      this._map.on('moveend', this._onMove, this);
      this._map.on('resize', this._onResize, this);

      this.on('remove', this._onRemove, this);

      this.geojsonLayer = L.geoJson().addTo(map);
      this._map.addLayer(this.geojsonLayer);

    },
    _onRemove: function () {
      this._map.removeLayer(this.geojsonLayer);
    },
    _onMove: function () {
      var bottomLeft = this._map.getPixelBounds().getBottomLeft();
    },
    _onResize: function () {
      this._onMove();
    },
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
    _reset: function () {
        L.TileLayer.prototype._reset.apply(this, arguments);
        for (var i in this._requests) {
            this._requests[i].abort();
        }
        this._requests = [];
        this._tilesLoading = {};
        if (this.geojsonLayer) {
          this._resetgeoJson();
        }
    },
    _resetgeoJson: function () {
      this._map.removeLayer(this.geojsonLayer);
      this.geojsonLayer = L.geoJson({
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, geojsonMarkerOptions);
        }
      }).addTo(this._map);
      this._map.addLayer(this.geojsonLayer);
    },
    drawTheThings: function (data) {
      if (!data) { return; }
      if (data.features.length > 0) {
        this.geojsonLayer.addData(data);
      }

    },
    _tileLoaded: function (tile, tilePoint) {
      // var key = 'key'
      var key = 'key_' + tilePoint.z + '_' + tilePoint.x + '_' + tilePoint.y;
      this._tilesLoading[key] = 'done';

      this.isLoading = false;

      if (tile.datum === null) { return null; }
      
      this.addTileData(tile.datum, tilePoint);
      this.drawTheThings(tile.datum, tilePoint);
      
      for (var tile in this._tilesLoading) {
        if (this._tilesLoading[tile] === null) {
          this.isLoading = true;
          break;
        }
      }

      if (!this.isLoading) {
        this.fire('loadend');
      }
    }
  });

  if (L) {
    // Leaflet global variable to speed up vector layer,
    // see: http://leafletjs.com/reference.html#path-canvas
    window.L_PREFER_CANVAS = true;

    // bind our own TileDataLayer.
    L.TileDataLayer = TileDataLayer;
    
    return L;
  } else {
    throw new Error('Leaflet can not be found');
  }
}]);
