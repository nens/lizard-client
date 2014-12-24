

/**
 * @ngdoc service
 * @class NxtData /
 * @memberof app
 * @name NxtData
 * @requires $q, $injector, NxtMap and LayerGroup
 * @summary Encapsulates layergroups
 * @description NxtData service encapsulates layergroups from the server side
 *              configuration of layergroups. It enables to perform actions
 *              on all layergroups simultaneously. When provided with a string
 *              representation of the service containing the global map it
 *              it performs these actions on the map from this service, else
 *              it needs a map object when calling toggleLayerGroup and
 *              syncTime.
 */


angular.module('data-menu')
  .factory('NxtData', ['$q', '$injector', 'NxtMap', 'LayerGroup', function ($q, $injector, NxtMap, LayerGroup) {


    function NxtData(serverSideLayerGroups) {
      var layerGroups = createLayerGroups(serverSideLayerGroups);

      this.layerGroups = layerGroups;

      var state = {
        timeIsSyncing: false,
        gettingData: false,
        isLoading: false
      };

      this.state = state;

      // Combination of data and time syncing
      Object.defineProperty(this.state, 'isLoading', {
        get: function () {
          return state.timeIsSyncing || state.gettingData;
        }
      });

      // Immutable representation of all layergroups
      Object.defineProperty(this.state, 'all', {
        value: Object.keys(layerGroups),
        writeable: false,
        configurable: false
      });

      var instance = this;
      Object.defineProperty(this.state, 'active', {
        get: function () {
          return Object.keys(layerGroups).filter(function (layerGroup) {
            return layerGroups[layerGroup].isActive();
          });
        },
        set: function (newActivelayerGroups) {
          angular.forEach(layerGroups, function (_lg, slug) {
            if (newActivelayerGroups.indexOf(slug) !== -1 && !_lg.isActive()) {
              this.toggleLayerGroup(_lg);
            } else if (_lg.isActive()) {
              this.toggleLayerGroup(_lg);
            }
          }, instance);
        }
      });

    }

    NxtData.prototype = {

      /**
       * @function
       * @memberOf app.NxtMap
       * @description Toggles a layergroup when layergroups should be toggled
       *              takes into account that baselayers should toggle eachother
       * @param  layerGroup layergroup that should be toggled
       */
      toggleLayerGroup: function (layerGroup, optionalMap) {
        // turn layer group on
        var map = optionalMap || this.mapProvider._map;
        if (!(layerGroup.baselayer && layerGroup.isActive())) {
          layerGroup.toggle(map);
        }
        if (layerGroup.baselayer) {
          angular.forEach(this.layerGroups, function (_layerGroup) {
            if (_layerGroup.baselayer
              && _layerGroup.isActive()
              && _layerGroup.slug !== layerGroup.slug
              )
            {
              _layerGroup.toggle(map);
            }
          });
        }
      },

      /**
       * Syncs all layer groups to provided timeState object.
       * @param  {object} timeState   State.temporal object, containing start,
       *                              end, at and aggwindow.
       * @param  {leaflet map} optionalMap map object to sync the data to.
       * @return {promise}             promise that resolves layergroups synced.
       */
      syncTime: function (timeState, optionalMap) {
        var map = optionalMap || this.mapProvider._map;
        var defer = $q.defer();
        var promises = [];
        angular.forEach(this.layerGroups, function (layerGroup) {
          promises.push(layerGroup.syncTime(timeState, map));
        }, this);
        var that = this;
        $q.all(promises).then(function () {
          that.state.timeIsSyncing = false;
          defer.resolve();
          return defer.promise;
        });
        this.state.timeIsSyncing = true;
        return defer.promise;
      },

      /**
       * Gets data from all layergroups.
       *
       * @param  {object} options
       * @return {promise} notifies with data from layergroup and resolves when
       *                            all layergroups returned data.
       */
      getData: function (options) {
        this.reject();
        this._dataDefer = $q.defer();
        var defer = this._dataDefer;
        var promises = [];
        angular.forEach(this.layerGroups, function (layerGroup) {
          promises.push(
            layerGroup.getData(options).then(null, null, function (response) {
              defer.notify(response);
            }));
        }, this);
        var that = this;
        $q.all(promises).then(function () {
          that.state.gettingData = false;
          defer.resolve();
          return defer.promise;
        });
        this.state.gettingData = true;
        return defer.promise;
      },

      /**
       * Rejects call for data and sets loading to false.
       */
      reject: function () {
        this.state.gettingData = false;
        if (this._dataDefer) {
          this._dataDefer.reject();
        }
      },

      /**
       * @function
       * @memberOf app.NxtMap
       * @description Sets the layergroups to the state they came from the
       *              server. Is called by the urlCtrl when no layergroup
       *              info is found on the server
       */
      setLayerGoupsToDefault: function () {
        angular.forEach(this.layerGroups, function (layerGroup) {
          if (layerGroup.defaultActive && !layerGroup.isActive()) {
            this.toggleLayerGroup(layerGroup);
          } else if (!layerGroup.defaultActive && layerGroup.isActive()) {
            this.toggleLayerGroup(layerGroup);
          }
        }, this);
      }
    };

    /**
     * @function
     * @memberof app.NxtMapService
     * @param  {object} nonLeafLayer object from database
     * @description Throw in a layer as served from the backend
     */
    var createLayerGroups = function (serverSideLayerGroups) {
      var layerGroups = {};
      angular.forEach(serverSideLayerGroups, function (sslg) {
        layerGroups[sslg.slug] = new LayerGroup(sslg);
      });
      return layerGroups;
    };

    return NxtData;

  }]);
