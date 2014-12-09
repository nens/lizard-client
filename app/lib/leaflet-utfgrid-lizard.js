/*
 Copyright (c) 2012, Smartrak, David Leaver
 Leaflet.utfgrid is an open-source JavaScript library that provides utfgrid interaction on leaflet powered maps.
 https://github.com/danzel/Leaflet.utfgrid
*/
(function (window, undefined) {

  L.Util.ajax = function (url, cb) {
    // the following is from JavaScript: The Definitive Guide
    // and https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/Using_XMLHttpRequest_in_IE6
    if (window.XMLHttpRequest === undefined) {
      window.XMLHttpRequest = function () {
        /*global ActiveXObject:true */
        try {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        catch  (e) {
            throw new Error("XMLHttpRequest is not supported");
        }
      };
    }
    var response, request = new XMLHttpRequest();
    request.open("GET", url, true); // async
    // request.open("GET", url, false); // sync
    request.onreadystatechange = function () {
      /*jshint evil: true */
      if (request.readyState === 4 && request.status === 200) {
        if (window.JSON) {
            response = JSON.parse(request.responseText);
        } else {
            response = eval("(" + request.responseText + ")");
        }
        cb(response);
      }
    };
    request.send();
  };


  L.UtfGrid = L.Class.extend({

    includes: L.Mixin.Events,
    options: {
      subdomains: 'abc',

      minZoom: 0,
      maxZoom: 18,
      tileSize: 256,

      resolution: 4,

      useJsonP: true,
      pointerCursor: true
    },

    //The thing the mouse is currently on
    _mouseOn: null,

    isLoading: false,

    initialize: function (url, options) {
      L.Util.setOptions(this, options);

      this._url = url;
      this._cache = {};
      // We keep track of the tiles which are at least partially within
      // the current spatial extent.
      this._extentCache = {};

      //Find a unique id in window we can use for our callbacks
      //Required for jsonP
      var i = 0;
      while (window['lu' + i]) {
          i++;
      }
      this._windowKey = 'lu' + i;
      window[this._windowKey] = {};

      var subdomains = this.options.subdomains;
      if (typeof this.options.subdomains === 'string') {
          this.options.subdomains = subdomains.split('');
      }
    },

    onAdd: function (map) {
      this._map = map;
      this._container = this._map._container;

      this._update();

      var zoom = this._map.getZoom();

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
        return;
      }

      map.on('click', this._click, this);
      map.on('mousemove', this._move, this);
      map.on('moveend', this._update, this);

      this._tileLoaded(); // Check whether more tiles need loading
    },

    onRemove: function () {
      var map = this._map;
      map.off('click', this._click, this);
      map.off('mousemove', this._move, this);
      map.off('moveend', this._update, this);
      if (this.options.pointerCursor) {
        this._container.style.cursor = '';
      }
    },

    _click: function (e) {
      this.fire('click', this._objectForEvent(e));
    },
    _move: function (e) {
      var on = this._objectForEvent(e);

      if (on.data !== this._mouseOn) {
        if (this._mouseOn) {
          this.fire('mouseout', { latlng: e.latlng, data: this._mouseOn });
          if (this.options.pointerCursor) {
            this._container.style.cursor = '';
          }
        }
        if (on.data) {
          this.fire('mouseover', on);
          if (this.options.pointerCursor) {
            this._container.style.cursor = 'pointer';
          }
        }

        this._mouseOn = on.data;
      } else if (on.data) {
        this.fire('mousemove', on);
      }
    },

    _objectForEvent: function (e) {

      var map = this._map;
      if (!map) {
        // This layer has not been not added to the map yet
        return { latlng: e.latlng, data: null };
      }

      var point = map.project(e.latlng),
        tileSize = this.options.tileSize,
        resolution = this.options.resolution,
        x = Math.floor(point.x / tileSize),
        y = Math.floor(point.y / tileSize),
        gridX = Math.floor((point.x - (x * tileSize)) / resolution),
        gridY = Math.floor((point.y - (y * tileSize)) / resolution),
          max = map.options.crs.scale(map.getZoom()) / tileSize;

      x = (x + max) % max;
      y = (y + max) % max;

      var data = this._cache[map.getZoom() + '_' + x + '_' + y];
      if (!data) {
        return { latlng: e.latlng, data: null };
      }

      var idx = this._utfDecode(data.grid[gridY].charCodeAt(gridX)),
        key = data.keys[idx],
        result = data.data[key];

      if (!data.data.hasOwnProperty(key)) {
        result = null;
      }

      return { latlng: e.latlng, data: result};
    },

    //Load up all required json grid files
    //TODO: Load from center etc
    _update: function () {

      var bounds = this._map.getPixelBounds(),
          zoom = this._map.getZoom(),
          tileSize = this.options.tileSize;

      if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
        return;
      }

      var nwTilePoint = new L.Point(
            Math.floor(bounds.min.x / tileSize),
            Math.floor(bounds.min.y / tileSize)
          ),
          seTilePoint = new L.Point(
            Math.floor(bounds.max.x / tileSize),
            Math.floor(bounds.max.y / tileSize)
          ),
          max = this._map.options.crs.scale(zoom) / tileSize;

      this._extentCache = {}; // empty the _extentCache

      //Load all required ones
      for (var x = nwTilePoint.x; x <= seTilePoint.x; x++) {
        for (var y = nwTilePoint.y; y <= seTilePoint.y; y++) {

          var xw = (x + max) % max, yw = (y + max) % max;
          var key = zoom + '_' + xw + '_' + yw;

          if (!this._cache.hasOwnProperty(key)) {
            // We prepare the new tiles that are to be rendered:
            this._cache[key] = null;
            this._extentCache[key] = null;
            this._loadTile(zoom, xw, yw);
          } else {
            // We keep the old tiles that are still rendered:
            this._extentCache[key] = this._cache[key];
          }
        }
      }
    },

    _tileLoaded: function () {
      var isLoading = false;
      for (var i in this._cache) {
        if (this._cache[i] === null) { isLoading = true; }
      }
      this.isLoading = isLoading;
      if (!this.isLoading) { this.fireEvent('load'); }
    },

    _loadTile: function (zoom, x, y) {
      var url = L.Util.template(this._url, L.Util.extend({
        s: L.TileLayer.prototype._getSubdomain.call(this, { x: x, y: y }),
        z: zoom,
        x: x,
        y: y
      }, this.options));

      var key = zoom + '_' + x + '_' + y;

      this.isLoading = true;

      var self = this;

      L.Util.ajax(url, function (data) {
        self._cache[key] = data;
        self._extentCache[key] = data;
        self._tileLoaded();
      });
    },

    _utfDecode: function (c) {
      if (c >= 93) {
        c--;
      }
      if (c >= 35) {
        c--;
      }
      return c - 32;
    },

    _getUniqueStructureId: function (structureData) {
      try {
        return structureData.entity_name + "$" + structureData.id;
      } catch (e) {
        console.log("[E] Tried to derive a unique structure ID from incomplete data: its not gonna w0rk. Error 'e' =", e);
      }
    },

    getUniqueStructuresForExtent: function () {

      var tile,
          tileSlug,
          uniqueStructures = { data: {} };

      for (tileSlug in this._extentCache) {
        tile = this._extentCache[tileSlug];
        if (tile && tile.data) {

          var datum,
              datumSlug,
              structureKey;

          for (datumSlug in tile.data) {
            datum = tile.data[datumSlug];
            structureKey = this._getUniqueStructureId(datum);
            if (!uniqueStructures.data[structureKey])
            {
              uniqueStructures.data[structureKey] = datum;
            }
          }
        }
      }
      return uniqueStructures;
    }
  });

  L.utfGrid = function (url, options) {
    return new L.UtfGrid(url, options);
  };

}(this));