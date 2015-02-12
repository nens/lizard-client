'use strict';


/**
 * @ngdoc service
 * @class NxtData /
 * @memberof app
 * @name NxtData
 * @requires $q, dataLayers, LayerGroup and State
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
  .service('DataService', ['$q', 'dataLayers', 'DataLayerGroup', 'State',
    function ($q, dataLayers, DataLayerGroup, State) {

      // Attributes ////////////////////////////////////////////////////////////

      // Event callbacks are used to performa actions on the map when the
      // state of layergroups changes, may contain a onOpacityChange, OnDblClick
      // and on layerGroupToggled callback functions.
      Object.defineProperty(this, 'eventCallbacks', {
        set: function (newCallBacks) {
          DataLayerGroup.prototype.callbackFns = newCallBacks;
        }
      });


      /**
       * Creates a new layerGroup and adds to the layerGroups
       * @param  {object} lgConfig config of layergroup
       * @return {layerGroup instance}
       */
      this.createLayerGroup = function (lgConfig) {
        return this.layerGroups[lgConfig.slug] = new DataLayerGroup(lgConfig);
      },

      /**
       * @function
       * @memberof app.NxtMapService
       * @param  {object} nonLeafLayers object from database
       * @description Throw in layers as served from the backend
       */
      this._createLayerGroups = function (serverSideLayerGroups) {
        var layerGroups = {};
        angular.forEach(serverSideLayerGroups, function (sslg) {
          this.createLayerGroup(sslg);
        }, this);
        return this.layerGroups;
      };

      this.layerGroups = {};
      var layerGroups = this._createLayerGroups(dataLayers);

      this.baselayerGroups = _.filter(layerGroups, function (lgValue, lgKey) {
        return lgValue.baselayer;
      });


      // Immutable representation of all layergroups set on State.layerGroups
      Object.defineProperty(State.layerGroups, 'all', {
        value: Object.keys(layerGroups),
        writeable: false,
        configurable: false
      });

      // List of slugs of active layerGroups, two-way.
      var instance = this;
      Object.defineProperty(State.layerGroups, 'active', {
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

      this._dataDefers = {};


      // Methods //////////////////////////////////////////////////////////////

      /**
       * @function
       * @memberOf app.NxtMap
       * @description Toggles a layergroup when layergroups should be toggled
       *              takes into account that baselayers should toggle eachother
       * @param  layerGroup layergroup that should be toggled
       */
      this.toggleLayerGroup = function (layerGroup) {
        // turn layer group on
        if (!(layerGroup.baselayer && layerGroup.isActive())) {
          layerGroup.toggle();
        }
        if (layerGroup.baselayer) {
          angular.forEach(this.layerGroups, function (_layerGroup) {
            if (_layerGroup.baselayer
              && _layerGroup.isActive()
              && _layerGroup.slug !== layerGroup.slug
              )
            {
              _layerGroup.toggle();
            }
          });
        }
      };

      /**
       * Adds the provided layerGroups to the layerGroups
       * @param {layerGroup instance}
       */
      this.addLayergroup = function (layerGroup) {
        return this.layerGroups[layerGroup.slug] = layerGroup;
      },

      /**
       * Removes the provided layerGroups from nxt
       * @param {layerGroup instance}
       */
      this.removeLayerGroup = function (layerGroup) {
        delete this.layerGroups[layerGroup.slug];
        return this.layerGroups;
      },

      /**
       * Gets data from all layergroups.
       *
       * @param  {object} options
       * @param  {str} callee that gets a seperate defer.
       * @return {promise} notifies with data from layergroup and resolves when
       *                            all layergroups returned data.
       */
      this.getData = function (callee, options) {
        this.reject(callee);
        this._dataDefers[callee] = $q.defer();
        var defer = this._dataDefers[callee];
        var promises = [];
        angular.forEach(this.layerGroups, function (layerGroup) {
          promises.push(
            layerGroup.getData(options).then(null, null, function (response) {
              defer.notify(response);
            })
          );
        });
        $q.all(promises).then(function () {
          State.layerGroups.gettingData = false;
          defer.resolve();
        });
        State.layerGroups.gettingData = true;
        return defer.promise;
      };

      /**
       * Rejects call for data and sets loading to false.
       */
      this.reject = function (callee) {
        State.layerGroups.gettingData = false;
        if (this._dataDefers[callee]) {
          this._dataDefers[callee].reject();
        }
      };

      /**
       * @function
       * @memberOf app.NxtMap
       * @description Sets the layergroups to the state they came from the
       *              server. Is called by the urlCtrl when no layergroup
       *              info is found on the server
       */
      this.setLayerGoupsToDefault = function () {
        angular.forEach(this.layerGroups, function (layerGroup) {
          if (layerGroup.defaultActive && !layerGroup.isActive()) {
            this.toggleLayerGroup(layerGroup);
          } else if (!layerGroup.defaultActive && layerGroup.isActive()) {
            this.toggleLayerGroup(layerGroup);
          }
        }, this);
      }

    }
  ]);