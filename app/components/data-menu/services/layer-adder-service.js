/**
 * Service to handle layer-group retrieval.
 */
angular.module('data-menu')
  .service("LayerAdderService", ['$http', 'UtilService', 'State', 'notie', 'gettextCatalog', function ($http, UtilService, State, notie, gettextCatalog) {

      /**
       * Get layergroups from the API.
       * @param {dict} params - A dictionary of request params (e.g.
       *                        {'page_size': 10}).
       * @param {function} success - Execute this function on a successful GET.
       * @param {function} error - Execute this function on an unsuccessful
       *                           GET.
       */
      this.fetchLayers = function (params, success, error) {
        params.type = 'assetgroup,eventseries,layer,rasterstore';
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
      this.fetchLayer = function (entity, id, name, error) {
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
          if (error) { error(); }
        };

        return $http({
          url: 'api/v2/' + entity + '/' + id + '/',
          method: 'GET'
        })

        .then(function (response) { return response.data;})
        .catch(onError);
      };

      this.remove = function (layer) {
        _.remove(State.layers, {uuid: layer.uuid});
      };

      this.add = function (searchLayer) {
        State.layers.push({
          active: true,
          type: searchLayer.entity_name,
          uuid: searchLayer.entity_uuid,
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
