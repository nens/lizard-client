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
  .service('DataService', [
    '$q',
    'AssetService',
    'TimeseriesService',
    'dataLayers',
    'DataLayerGroup',
    'State',

    function (
      $q,
      AssetService,
      TimeseriesService,
      dataLayers,
      DataLayerGroup,
      State
    ) {

      // Attributes ////////////////////////////////////////////////////////////

      // Event callbacks are used to performa actions on the map when the
      // state of layergroups changes, may contain a onOpacityChange, OnDblClick
      // and on layerGroupToggled callback functions.
      Object.defineProperty(this, 'eventCallbacks', {
        set: function (newCallBacks) {
          DataLayerGroup.prototype.callbackFns = newCallBacks;
        }
      });

      var instance = this;

      /**
       * Creates a new layerGroup and adds to the layerGroups
       * @param  {object} lgConfig config of layergroup
       * @return {object} layerGroup instance
       */
      this.createLayerGroup = function (lgConfig) {
        return this.layerGroups[lgConfig.slug] = new DataLayerGroup(lgConfig);
      };

      /**
       * @function
       * @memberof app.NxtMapService
       * @param  {object} nonLeafLayers object from database
       * @description Throw in layers as served from the backend
       */
      this._createLayerGroups = function (serverSideLayerGroups) {
        var layerGroups = {};
        angular.forEach(serverSideLayerGroups, function (sslg) {

          var utf = false;

          angular.forEach(sslg.layers, function (layer) {
            if (layer.format === 'UTFGrid') {
              utf = true;
            }
          }, this);

          var lg = new DataLayerGroup(sslg);

          if (utf) { this.utfLayerGroup = lg; }

          this.layerGroups[lg.slug] = lg;

          // utf ? this.utfLayerGroup = lg :

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

      // Define assets on State and update DataService.assets.
      var setAssets = function (assets) {
        var oldAssets = angular.copy(instance.assets);
        AssetService.updateAssets(instance.assets, _assets, assets)
        .then(function (assets) {
          instance.assets = assets;
          instance.getGeomDataForAssets(oldAssets, instance.assets);
          console.log('DataService.assets:', instance.assets);
        });
        _assets = assets;
        console.log('State.selected.assets:', State.selected.assets);
        State.selected.assets.addAsset = addAsset;
        State.selected.assets.removeAsset = removeAsset;
      };

      var addAsset = function (asset) {
        var newAssets = angular.copy(_assets);
        newAssets.push(asset);
        setAssets(newAssets);
      };

      var removeAsset = function (asset) {
        var newAssets = angular.copy(_assets);
        newAssets.splice(_assets.indexOf(asset), 1);
        setAssets(newAssets);
      };

      instance.assets = [];
      var _assets = [];
      Object.defineProperty(State.selected, 'assets', {
        get: function () { return _assets; },
        set: setAssets
      });

      State.selected.assets.addAsset = addAsset;
      State.selected.assets.removeAsset = removeAsset;

      // Define geometries on State and update DataService.geometries.
      var setGeometries = function (geometries) {
        instance._updateGeometries(_geometries, angular.copy(geometries))
        .then(function (geometries) {
          instance.geometries = geometries;
          console.log('DataService.geometries:', instance.geometries);

        });
        _geometries = geometries;
        console.log('State.selected.geometries:', State.selected.geometries);
        State.selected.geometries.addGeometry = addGeometry;
        State.selected.geometries.removeGeometry = removeGeometry;
      };

      var addGeometry = function (geometry) {
        var newGeoms = angular.copy(_geometries);
        newGeoms.push(geometry);
        setGeometries(newGeoms);
      };

      var removeGeometry = function (geometry) {
        var newGeometries = angular.copy(_geometries);
        var index = -1;
        _geometries.forEach(function(geom, i) {
          if (geom.geometry.coordinates[0] === geometry.geometry.coordinates[0]
          && geom.geometry.coordinates[1] === geometry.geometry.coordinates[1]
          && geom.geometry.coordinates[2] === geometry.geometry.coordinates[2]) {
            index = i;
          }
        });
        newGeometries.splice(index, 1);
        setGeometries(newGeometries);
      };


      instance.geometries = [];
      var _geometries = [];
      Object.defineProperty(State.selected, 'geometries', {
        get: function () { return _geometries; },
        set: setGeometries
      });

      State.selected.geometries.addGeometry = addGeometry;
      State.selected.geometries.removeGeometry = removeGeometry;

      // Define timeseries on State and update DataService.timeseries.
      var _timeseries = [];
      Object.defineProperty(State.selected, 'timeseries', {
        get: function () { return _timeseries; },
        set: function (timeseries) {
          instance._updateTimeseries(_timeseries, timeseries);
          _timeseries = timeseries;
        }
      });

      // Define events on State and update DataService.events.
      var _events = [];
      Object.defineProperty(State.selected, 'events', {
        get: function () { return _events; },
        set: function (events) {
          instance._updateEvents(_events, events);
          _events = events;
        }
      });

      // Immutable representation of all layergroups set on State.layerGroups
      Object.defineProperty(State.layerGroups, 'all', {
        value: Object.keys(layerGroups),
        writeable: false,
        configurable: false
      });

      this.REJECTION_REASONS = {};

      Object.defineProperty(this.REJECTION_REASONS, 'OVERRIDDEN', {
        value: 'overridden',
        writeable: false,
        configurable: false
      });

      // List of slugs of active layerGroups, two-way.
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

      // Define temporal here so DataService can update assets, geometries etc.
      var _timelineMoving = State.temporal.timelineMoving;
      Object.defineProperty(State.temporal, 'timelineMoving', {
        get: function () { return _timelineMoving; },
        set: function (value) {
          _timelineMoving = value;
          if (!value) {
            console.log('refreshing');
            instance.refreshSelected();
          }
        }
      });

      this._dataDefers = {}; // Per callee a list with a defer for every time
                             // getData gets called before the last one
                             // resolves.


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
          instance.refreshSelected();
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
       * @param {object} layerGroup instance
       */
      this.addLayergroup = function (layerGroup) {
        return this.layerGroups[layerGroup.slug] = layerGroup;
      };

      /**
       * Removes the provided layerGroups from nxt
       * @param {object} layerGroup instance
       */
      this.removeLayerGroup = function (layerGroup) {
        delete this.layerGroups[layerGroup.slug];
        return this.layerGroups;
      };

      /**
       * Gets data from all layergroups.
       *
       * @param  {object} options
       * @param  {str} callee that gets a list of defers for every time getdata
       *                      is called before a request finishes.
       * @param  {defer} recursiveDefer optional. When supplied is notified with
       *                                data. Used for recursively calling get
       *                                data with data from waterchain of a
       *                                previous getData call.
       * @return {object} notifies with data from layergroup and resolves when
       *                   all layergroups and the timeseries returned data.
       */
      this.getData = function (callee, options, recursiveDefer) {
        var defer = $q.defer();

        if (recursiveDefer === undefined) {
          this.reject(callee, this.REJECTION_REASONS.OVERRIDDEN);
          if (!this._dataDefers[callee]) {
            this._dataDefers[callee] = []; // It is a list because $q.all can not
          }                                // be deregistered.
          var defers = this._dataDefers[callee];
          defers.push(defer); // add to list
        }

        var promises = [];
        var waitForTimeseriesAndEvents = false;
        var instance = this;
        angular.forEach(this.layerGroups, function (layerGroup) {
          promises.push(
            layerGroup.getData(callee, options).then(null, null, function (response) {

              // TS and events are dependent on the waterchain response. So the
              // waterchain response is checked for signs of timeseries. If
              // neccessary we will wait for the timeseries request to finish.
              // Else we keep checking every response.
              if (!waitForTimeseriesAndEvents) {
                waitForTimeseriesAndEvents = instance.getTimeseriesAndEvents(
                  response,
                  options,
                  defer,
                  callee
                );
              }

              if (recursiveDefer) {
                recursiveDefer.notify(response);
              } else {
                defer.notify(response);
              }

            })
          );
        });

        $q.all(promises).then(function () {
          if (waitForTimeseriesAndEvents) {
            waitForTimeseriesAndEvents.then(function () {
              finishDefers();
            });
          } else {
            finishDefers();
          }
        });

        /**
         * @function finishDefers
         * @memberof DataService
         * @summary Checks if current defer is the last one, if so resolves the
         * defer and clears the defers
         */
        var finishDefers = function () {
          // If this defer is the last one in the list of defers the getData
          // is truly finished, otherwise the getData is still getting data for
          // the callee.
          if (recursiveDefer) {
            defer.resolve();
          }
          else if (defers.indexOf(defer) === defers.length - 1) {
            State.layerGroups.gettingData = false;
            defer.resolve(); // Resolve the last one, the others have been
                             // rejected.
            defers.length = 0; // Clear the defers, by using .length = 0 the
                               // reference to this._dataDefers persists.
          }
        };

        State.layerGroups.gettingData = true;
        return defer.promise;
      };

      /**
       * Rejects call for data and sets loading to false.
       */
      this.reject = function (callee, reason) {
        State.layerGroups.gettingData = false;
        if (this._dataDefers[callee]) {
          this._dataDefers[callee].forEach(function (defer) {
            defer.reject(reason);
          });
        }
      };

      this.refreshSelected = function () {
        this.geometries.forEach(function (geom) {

          angular.forEach(geom.properties, function (v, s) {
            if (!this.layerGroups[s].isActive()) {
              delete geom.properties[s];
            }
          }, this);

          this.getGeomData(geom)
          .then(function(newGeo) {
            instance.geometries.forEach(function (old, i) {
              if (_.isEqual(old.geometry.coordinates, newGeo.geometry.coordinates)) {
                instance.geometries[i] = newGeo;
                console.log('DataService.geometries:', instance.geometries);
              }
            });
          });

        }, this);

        this.assets.forEach(function (asset) {

          this.getGeomData(asset)
          .then(function(newAsset) {
            instance.assets.forEach(function (old, i) {
              if (old.entity_name === newAsset.entity_name && old.id === newAsset.id) {
                instance.assets[i] = newAsset;
              }
            });
          });

        }, this);

      };

      this._updateGeometries = function (oldGeoms, newGeoms) {
        var freshGeometries = newGeoms.filter(function (geom) {
          return !oldGeoms.filter(function (oldGeom) {
            var oC = oldGeom.geometry.coordinates;
            var nC = geom.geometry.coordinates;
            return _.isEqual(oC, nC);
          }).length;
        });

        instance.geometries = instance.geometries.filter(function (geom) {
          return newGeoms.filter(function (oldGeom) {
            var oC = oldGeom.geometry.coordinates;
            var nC = geom.geometry.coordinates;
            return _.isEqual(oC, nC);
          }).length;
        });

        var promises = [];

        freshGeometries.forEach(function (geom) {

          promises.push(
            this.getGeomData(geom)
            .then(function(geo) {
              instance.geometries.push(geo);
            })
          );

        }, this);

        return $q.all(promises).then(function () {
          return instance.geometries; });
      };

      this.getGeomDataForAssets = function (oldAssets, assets) {
        var newAssets = assets.filter(function (asset) {
          return !oldAssets.filter(function (oldAsset) {
            return oldAsset.entity_name === asset.entity_name && oldAsset.id === asset.id;
          }).length;
        });

        newAssets.forEach(function (asset) {
          this.getGeomData(asset)
          .then(function(geo) {
            asset.geometry = geo.geometry;
            asset.properties = geo.properties;
          });
        }, this);
      };

      this.getGeomData = function (geo) {
        if (this._defer) {
          this._defer.reject(this.REJECTION_REASONS.OVERRIDDEN); // It is a list because $q.all can not
        }                                // be deregistered.
        this._defer = $q.defer();
        var defer = this._defer;

        var promises = [];
        var instance = this;
        var options = {
          start: State.temporal.start,
          end: State.temporal.end
        };

        if (geo.geometry.type === 'Point') {
          options.geom = L.latLng(geo.geometry.coordinates[1], geo.geometry.coordinates[0]);
        }
        else if (geo.geometry.type === 'LineString') {
          var coords = geo.geometry.coordinates;
          options.geom = [
            L.latLng(coords[0][1], coords[0][0]),
            L.latLng(coords[1][1], coords[1][0])
          ];
        }
        else if (geo.geometry.type === 'Polygon' && geo.id) {
          options.id = geo.id;
        }
        if (geo.geometry.type === 'Polygon') {
          options.geom = L.geoJson(geo).getBounds();
        }
        angular.forEach(this.layerGroups, function (layerGroup) {
          if (layerGroup.slug === instance.utfLayerGroup.slug) { return; }

          promises.push(
            layerGroup.getData('DataService', options).then(null, null, function (response) {
              geo.properties = geo.properties || {};
              geo.properties[response.layerGroupSlug] = response;
              // async so remove anything obsolete.
              if (
                !instance.layerGroups[response.layerGroupSlug].isActive()
                && layerGroup.slug in Object.keys(geo.properties)) {
                delete geo.properties[layerGroup.slug];
              }
            })
          );
        });

        $q.all(promises).then(function () {
            State.layerGroups.gettingData = false;
            defer.resolve(geo);
            defer = undefined; // Clear the defer
        });

        State.layerGroups.gettingData = true;
        return defer.promise;
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
      };

      /**
       * Checks response for id and entity_name and passes this
       * getTimeSeriesForObject with start and end.
       *
       * NOTE, TODO: Since now (october 2015) getting timeseries is a job of the
       * timeseries module with a dedicated directive. This code is legacey,
       * used by the time context and for events. This will change when we
       * implement the livedijk xl features.
       *
       * @param  {object} response response from layergroup
       * @param  {int}    start    time start
       * @param  {int}    end      time end
       * @param  {defer}  defer    defer object to notify with timeseries
       * @param  {string} callee   the origin of the data request, specified by
       *                           the function calling DataService.getData.
       *
       * @return {object} false when no id and entity name or promise
       *                            when making request to timeseries endpoint.
       */
      this.getTimeseriesAndEvents = function (
        response,
        options,
        defer,
        callee
      ) {
        if (response.format === 'UTFGrid'
          && response.data
          && response.data.id
          && response.data.entity_name
        ) {
          // Apparently, we're dealing with the waterchain:
          // The defer from getData is recycled, no need to pass a callee param.
          options.type = 'Event';
          options.object = {
            type: response.data.entity_name,
            id: response.data.id
          };
          // Get all events for the provided options and the events belonging to
          // this object.
          var promises = [this.getData(null, options, defer)];

          return $q.all(promises);
        } else { return false; }
      };

    }
  ]);
