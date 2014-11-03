'use strict';

/**
 * @ngdoc service
 * @name LeafletVectorService
 * @description
 * # LeafletVector
 * Creates a Tiled Layer for retrieving and drawing vector data. 
 */
angular.module('lizard-nxt')
  .service('LeafletVectorService', ["LeafletService", "VectorService", 
      function (LeafletService, VectorService) {

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
            radius: (feature.properties.radius) ? feature.properties.radius: 6,
            fillColor: color,
            color: "#000",
            weight: 1,
            fillOpacity: 0.8
          };

          var circle = LeafletService.circleMarker(latlng, geojsonMarkerOptions);
          circle.on('click', function (e) {
            // simulate click on map instead of this event;
            this._map.fire('click', {
              latlng: new LeafletService.LatLng(e.target.feature.geometry.coordinates[1],
                e.target.feature.geometry.coordinates[0])
            });
          });

          return circle;
        }
      };

      LeafletService.TileLayer.prototype.onAdd.call(this, map);
      var size = this._map.getPixelBounds().getSize();

      this.geojsonLayer = LeafletService.geoJson(null, this.drawOptions).addTo(map);
    },
    /**
     * @function
     * @description Remove geojson sublayer
     * plus call original onremove event
     * @param {object} instance of Leaflet.Map
     */
    onRemove: function (map) {
      this.geojsonLayer = false;
      this._reset();
      map.removeLayer(this.geojsonLayer);

      LeafletService.TileLayer.prototype.onRemove.call(this, map);
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
        } else if (!filteredData[overlapLocations[key]]){
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
        this.geojsonLayer.setStyle({ fillOpacity: opacity });
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
    
    redraw: function (layer, mapState, timeState) {
      var self = this;
      VectorService.getData(
          layer, {
            geom: mapState.bounds,
            start: timeState.start,
            end: timeState.end
          }).then(function (response) {
            self._resetgeoJson();
            self.drawTheThings(response, self);
          }); 
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
    }
  });
  
  return TileDataLayer;

 }]);
