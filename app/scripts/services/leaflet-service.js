/**
 * @ngdoc service
 * @class LeafletService
 * @memberof app
 * @name LeafletService
 * @description Trivial wrapper for global Leaflet object.
 *
 * Perhaps in the future this can be done with CommonJS style requires.
 */
angular.module('lizard-nxt')
  .service('LeafletService', [function () {
  var TileDataLayer = L.TileLayer.extend({
    onAdd: function (map) {
      this._map = map;
      this._requests = [];

      this.addTileData = this.options.dataCallback;
      
      L.TileLayer.prototype.onAdd.call(this, map);
      var size = this._map.getPixelBounds().getSize();

      this._map.on('moveend', this._onMove, this);
      this._map.on('resize', this._onResize, this);

      this.on('tileunload', function (d) {
        if (d.tile.xhr) {
          d.tile.xhr.abort();
        }
        if (d.tile.nodes) {
          // d.tile.nodes.remove();
        }
        d.tile.xhr = null;
      }) 
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
    },
    _tileLoaded: function (tile, tilePoint) {
        // L.TileLayer.Ajax.prototype._tileLoaded.apply(this, arguments);
        if (tile.datum === null) { return null; }
        this.addTileData(tile.datum, tilePoint);
    },
  });

  if (L) {
    // Leaflet global variable to speed up vector layer,
    // see: http://leafletjs.com/reference.html#path-canvas
    window.L_PREFER_CANVAS = true;

    // bind our own TileDataLayer.
    L.TileDataLayer = TileDataLayer;
    
    return L;
  } else {
    return 'He\'s dead Jim';
  }
}]);
