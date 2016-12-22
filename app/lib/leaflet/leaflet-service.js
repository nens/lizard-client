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
.service('LeafletService', ['$http', '$q', function ($http, $q) {

  var L = window.L;

  if (L) {
    // Leaflet global variable to speed up vector layer,
    // see: http://leafletjs.com/reference.html#path-canvas
    window.L_PREFER_CANVAS = true;

    // Set max margin of latLng.equals method. This way
    // the vectorservice is able to return the features
    // within 0.0001 degree of the click.
    L.LatLng.MAX_MARGIN = 0.0001;


    /**
     * Nxt ajaxified leaflet geojson layer.
     *
     * An extended L.GeoJSON. Instead of accepting geojson it accepts a url,
     * request parameters and booleans to update on bbox/zoom. The request
     * should return geojson in response.results.
     *
     * if bbox in options is truthy, it takes the bbox from the map and adds it
     * as the in_bbox parameter. Same for zoom, as z parameter.
     *
     */
    L.NxtAjaxGeoJSON = L.GeoJSON.extend({

      options: {
        requestUrl: null, // GeoJSON request URL.
        requestParams: {}, // GeoJSON request args.
      },

      initialize: function(requestUrl, options) {
        // L.GeoJSON init with blank content as we will get it later.
        this.options.requestUrl = requestUrl;
        L.GeoJSON.prototype.initialize.call(this, null, options);
      },

      onAdd: function(map) {
        L.GeoJSON.prototype.onAdd.call(this, map);

        this.reload(); // Load it at the beginning.

        if (this.options.bbox) { // Reload if the map pans or zooms.
          this._map.on('moveend', this.reload, this);
        }
        else if (this.options.zoom) { // Reload if the map zooms.
          this._map.on('zoomend', this.reload, this);
        }

      },

      onRemove: function(map) {
        this._map.off('moveend', this.reload, this);

        L.GeoJSON.prototype.onRemove.call(this, map);
      },

      // Build the final request parameters to send to the server
      _getParams: function() {
        var requestParams = typeof this.options.requestParams === 'function'
          ? this.options.requestParams.call(this, this)
          : this.options.requestParams;

        // Add bbox param if necessary
        if (this.options.bbox && this._map) {
          requestParams.in_bbox = this._map.getBounds().toBBoxString();
        }
        if (this.options.zoom && this._map) {
          requestParams.z = this._map.getZoom();
        }

        return requestParams;
      },

      // Keep track of last deferred to cancel consecutive calls.
      deferred: $q.defer(),

      reload: function() {
        // Any calls still underway can be ignored.
        this.deferred.resolve();
        this.deferred = $q.defer();

        // Use $http to respect loading bar.
        $http.get(this.options.requestUrl, {
          timeout: this.deferred.promise,
          params: this._getParams()
        })
        .then(this._checkResponseStatus.bind(this))
        .then(this.redraw.bind(this));
      },

      _checkResponseStatus: function(response) {
        if (response.status === 200) {
          return response.data.results;
        } else if (response.status) {
          throw new Error(
            'ajaxRequest error status = '
            + response.status
            + ' calling '
            + this._getUrl()
          );
        }
      },

      redraw: function(json) {
        // Empty the layer
        for (var l in this._layers) {
          if (this._map) {
            this._map.removeLayer(this._layers[l]);
          }
        }

        this._layers = [];

        // Add the data to the layer
        this.addData(json);

      }

    });

    L.nxtAjaxGeoJSON = function(url, options) {
      return new L.NxtAjaxGeoJSON(url, options);
    };
  }


  else {
    throw new Error('Leaflet can not be found');
  }

  return L;
}]);
