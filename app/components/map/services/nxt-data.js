angular.module('lizard-nxt')
  .factory('NxtData', ['$q', 'LayerGroup', function ($q, LayerGroup) {


    function NxtData(serverSideLayerGroups, map) {
      this.layerGroups = createLayerGroups(serverSideLayerGroups);
      this._map = map._map;
    }

    NxtData.prototype = {

      /**
       * @function
       * @memberOf app.NxtMap
       * @description Toggles a layergroup when layergroups should be toggled
       *              takes into account that baselayers should toggle eachother
       * @param  layerGroup layergroup that should be toggled
       */
      toggleLayerGroup: function (layerGroup) {
        // turn layer group on
        if (!(layerGroup.baselayer && layerGroup.isActive())) {
          layerGroup.toggle(this._map);
          this.layerGroupsChanged = Date.now();
        }
        var map = this._map;
        if (layerGroup.baselayer || layerGroup.temporal) {
          angular.forEach(this.layerGroups, function (_layerGroup) {
            if (layerGroup.baselayer
              && _layerGroup.baselayer
              && _layerGroup.isActive()
              && _layerGroup.slug !== layerGroup.slug
              )
            {
              _layerGroup.toggle(map);
            }
          });
        }
      },

      syncTime: function (timeState) {
        var defer = $q.defer();
        var promises = [];
        angular.forEach(this.layerGroups, function (layerGroup) {
          promises.push(layerGroup.syncTime(timeState, this._map));
        }, this);
        $q.all(promises).then(function () { defer.resolve(); });
        return defer.promise;
      },

      // Options contains geom, time and [event, timeseries, rain, waterchain]
      getData: function (options) {
        var defer = $q.defer();
        var promises = [];
        angular.forEach(this.layerGroups, function (layerGroup) {
          promises.push(layerGroup.getData(options));
        }, this);
        $q.all(promises).then(function () { defer.resolve(); });
        return defer.promise;
      },

      /**
       * @function
       * @memberOf app.NxtMap
       * @description Sets the layergroups to the state they came from the
       *              server. Is called by the urlCtrl when no layergroup
       *              info is found on the server
       */
      setLayerGoupsToDefault: function () {
        var map = this._map;
        angular.forEach(this.layerGroups, function (layerGroup) {
          if (layerGroup.defaultActive) { layerGroup.toggle(map); }
        });
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