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

      this._tilesLoading = {};
      this.isLoading = false;

      var color = this.options.color;
      this.addTileData = this.options.dataCallback;

      this.options.opacity = 0.8; // default opacity for events

      this.drawOptions = {
        pointToLayer: function (feature, latlng) {

          var geojsonMarkerOptions = {
            radius: (feature.properties.radius) ? feature.properties.radius: 6,
            fillColor: color,
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          };

          var circle = L.circleMarker(latlng, geojsonMarkerOptions);
          circle.on('click', function (e) {
            // simulate click on map instead of this event;
            this._map.fire('click', {
              latlng: new L.LatLng(e.target.feature.geometry.coordinates[1],
                e.target.feature.geometry.coordinates[0])
            });
          });

          return circle;
        }
      };

      L.TileLayer.prototype.onAdd.call(this, map);
      var size = this._map.getPixelBounds().getSize();

      this._map.on('moveend', this._onMove, this);
      this._map.on('resize', this._onResize, this);


      this.geojsonLayer = L.geoJson(null, this.drawOptions).addTo(map);
    },
    onRemove: function (map) {
      map.removeLayer(this.geojsonLayer);
      this.geojsonLayer = false;
      this._reset();

      this._map.off('moveend',  this._onMove, this);
      this._map.off('resize', this._onResize, this);
      // debugger
      L.TileLayer.prototype.onRemove.call(this, map);
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
      this.geojsonLayer = L.geoJson(null, this.drawOptions)
        .addTo(this._map);
    },
    countOverlapping: function (data) {
      var overlapLocations = [];
      var filteredData = [];
      data.forEach(function (d, index) {
        d.properties.radius = 6;
        var key = "x:" + d.geometry.coordinates[0] +
                  "y:" + d.geometry.coordinates[1];
        var coord = overlapLocations[key];
        if (coord === undefined) {
          overlapLocations[key] = index;
          filteredData.push(d);
        } else {
          filteredData[overlapLocations[key]].properties.radius += 1;
        }
      });
      return filteredData;
    },
    setOpacity: function (opacity) {
      this.geojsonLayer.setStyle({ fillOpacity: opacity });
    },
    drawTheThings: function (data) {
      if (!data) { return; }
      if (data.features.length > 0) {
        var filteredData;
        if (data.hasOwnProperty('features')) {
          filteredData = this.countOverlapping(data.features);
        } else if (data instanceof Array) {
          filteredData = this.countOverlapping(data);
        }
        this.geojsonLayer.addData(filteredData);
      }
    },
    _tileLoaded: function (tile, tilePoint) {
      var key = 'key_' + tilePoint.z + '_' + tilePoint.x + '_' + tilePoint.y;
      this._tilesLoading[key] = 'done';

      this.isLoading = false;

      if (tile.datum === null) { return null; }

      this.addTileData(tile.datum, tilePoint);
      this.drawTheThings(tile.datum, tilePoint);
      for (var tile in this._tilesLoading) {
        if (this._tilesLoading[tile] === 'busy') {
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

    // Set max margin of latLng.equals method. This way
    // the vectorservice is able to return the features
    // within 0.0001 degree of the click.
    L.LatLng.MAX_MARGIN = 0.0001;

    // bind our own TileDataLayer.
    L.TileDataLayer = TileDataLayer;

    return L;
  } else {
    throw new Error('Leaflet can not be found');
  }
}]);
