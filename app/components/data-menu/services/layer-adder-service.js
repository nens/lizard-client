/**
 * Service to handle layer-group retrieval.
 */
angular.module('data-menu')
.service("LayerAdderService", [
  '$http',
  'UtilService',
  'State',
  'notie',
  'gettextCatalog',
  function ($http, UtilService, State, notie, gettextCatalog) {

    // Baselayers are 0, raster and wmslayers are equal and above baselayer,
    // assetgroups are above and eventseries are on top.
    var Z_INDICES = {
      'raster': 1000,
      'wmslayer': 1000,
      'assetgroup': 10000,
      'eventseries': 100000,
    };

    /**
     * Checks the type of the layer and the location of the layer in the menu.
     * Layers lower in the menu are drawn on top of layers of the same type
     * above it.
     *
     * @param  {object} layer object as in State.layers.
     * @return {int}    to be used as leaflet zIndex.
     */
    this.getZIndex = function (layer) {
      var i = _.findIndex(State.layers, {'uuid': layer.uuid});
      return Z_INDICES[layer.type] + i;
    };

    /**
     * Get layergroups from the API.
     * @param {dict} params - A dictionary of request params (e.g.
     *                        {'page_size': 10}).
     * @param {function} success - Execute this function on a successful GET.
     * @param {function} error - Execute this function on an unsuccessful
     *                           GET.
     */
    this.fetchLayers = function (params, success, error) {
      params.type = 'assetgroup,eventseries,layer,rasterstore,scenario';
      params.page_size = 8;
      return $http.get('api/v2/search/', {
        params: params
      }).then(success, error);
    };

    /**
     * Get single layergroup from the API.
     * @param {string} params - slug for layergroup you are looking for.
     * @param {function} success - Execute this function on a successful GET.
     * @param {function} error - Execute this function on an unsuccessful
     *                           GET.
     */
    this.fetchLayer = function (entity, id, name) {
      var onError = function (err) {
        var type = entity === 'eventseries' ?
          'eventseries' :
          entity.slice(0, -1);
        var msg = ['Failed', 'to fetch', type, name || id];
        notie.alert(
          3,
          gettextCatalog.getString(msg.join(' ')),
          3
        );
        // Explicitly throw error to break promise chaining.
        throw new Error(msg.join(' '));
      };

      return $http({
        url: 'api/v2/' + entity + '/' + id + '/',
        method: 'GET'
      })

      .then(function (response) { return response.data; })
      .catch(onError);
    };

    this.remove = function (layer) {
      _.remove(State.layers, {uuid: layer.uuid});
    };

    this.add = function (searchLayer) {
      State.layers.push({
        active: false, // Add layer as non-active to menu. So when users
                       // activate it they can get a clear message whether
                       // this succeeds.
        type: searchLayer.entity_name,
        uuid: searchLayer.entity_uuid.slice(0, 7), // Add layer with short
                                                   // uuid.
        name: searchLayer.title
      });
      notie.alert(
        4,
        gettextCatalog.getString("Added layer " + searchLayer.title),
        2
      );
    };

    this.zoomToBounds = function () {
      State.spatial.bounds = L.latLngBounds(
        L.latLng(this.bounds.south, this.bounds.west),
        L.latLng(this.bounds.north, this.bounds.east)
      );
      if (this.temporal) {
        State.temporal.start = this.first;
        State.temporal.end = this.last;
      }
      UtilService.announceMovedTimeline(State);
    };

    this.getActiveScenarios = function () {
      return _.filter(State.layers, {
        type: 'scenario',
        active: true
      });
    };

    return this;
  }
]);
