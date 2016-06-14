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
    'LayerAdderService',
    'State',

    function (
      $q,
      AssetService,
      LayerAdderService,
      State
    ) {

      var instance = this;

      // Callback for when assets are being retrieved from api
      var assetChange = function (asset) {
        if (asset) {
          instance.assets.push(asset);
        }

        // A-synchronously remove assets no longer in selection.
        instance.assets = AssetService.removeOldAssets(_assets, instance.assets);

        // Deduplicate instance.assets asynchronous.
        instance.assets = _.uniqWith(instance.assets, _.isEqual);

        instance.getGeomDataForAssets(instance.oldAssets, instance.assets);

        if (instance.onAssetsChange) {
          instance.onAssetsChange();
        }

        console.log('DataService.assets:', instance.assets);
      };

      // Define assets on State and update DataService.assets.
      var setAssets = function (assetsIn) {
        // Dedupe assets in selection synchronous.
        var assets = _.uniq(assetsIn);
        instance.oldAssets = angular.copy(instance.assets);

        // Synchronously remove assets no longer in selection.
        instance.assets = AssetService.removeOldAssets(assets, instance.assets);

        AssetService.updateAssets(instance.assets, _assets, assets)
        .forEach(function (assetPromise) {
          assetPromise.then(assetChange);
        });
        _assets = assets;

        console.log('State.selected.assets:', State.selected.assets);

        rebindAssetFunctions();
      };


      // Rebind add and remove because selected.assets might have been
      // redefined when calling state.selected.assets = []
      var rebindAssetFunctions = function () {
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

      instance.assets = instance.oldAssets = [];
      var _assets = [];
      Object.defineProperty(State.selected, 'assets', {
        get: function () { return _assets; },
        set: setAssets,
        enumerable: true
      });

      State.selected.assets.addAsset = addAsset;
      State.selected.assets.removeAsset = removeAsset;

      /**
       * Return true if geometry is of same type (point, line etc) and has the
       * same coordinates.
       *
       * @param  {object}  one   geometry
       * @param  {object}  other geometry
       * @return {Boolean}
       */
      var isDuplicateGeometry = function (one, other) {
        var oneg = one.geometry;
        var otherg = other.geometry;
        if (oneg.type === otherg.type) {
          return _.every(oneg.coordinates, function (coord, i) {
            return coord === otherg.coordinates[i];
          });
        }
        else {
          return false;
        }
      };

      // Define geometries on State and update DataService.geometries.
      var setGeometries = function (geometriesIn) {
        // Dedupe geometries in selection synchronous.
        var geometries = _.uniqWith(geometriesIn, isDuplicateGeometry);
        instance._updateGeometries(_geometries, angular.copy(geometries))
        .then(function (geometries) {
          // Dedupe instance.geometries asynchronous.
          instance.geometries = _.uniqWith(geometries, isDuplicateGeometry);
          console.log('DataService.geometries:', instance.geometries);

          if (instance.onGeometriesChange) {
            instance.onGeometriesChange();
          }

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

      this.REJECTION_REASONS = {};

      Object.defineProperty(this.REJECTION_REASONS, 'OVERRIDDEN', {
        value: 'overridden',
        writeable: false,
        configurable: false
      });


      // Define temporal here so DataService can update assets, geometries etc.
      var _timelineMoving = State.temporal.timelineMoving;
      Object.defineProperty(State.temporal, 'timelineMoving', {
        get: function () { return _timelineMoving; },
        set: function (value) {
          _timelineMoving = value;
          if (!value) {
            instance.refreshSelected();
          }
        }
      });

      this._dataDefers = {}; // Per callee a list with a defer for every time
                             // getData gets called before the last one
                             // resolves.

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
        var instance = this;
        angular.forEach(this.layerGroups, function (layerGroup) {
          promises.push(
            layerGroup.getData(callee, options).then(null, null, function (response) {

              if (recursiveDefer) {
                recursiveDefer.notify(response);
              } else {
                defer.notify(response);
              }

            })
          );
        });

        $q.all(promises).then(function () {
          finishDefers();
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

        instance.geometries = instance.geometries.filter(function (geom) {
          return newGeoms.filter(function (oldGeom) {
            var oC = oldGeom.geometry.coordinates;
            var nC = geom.geometry.coordinates;
            return _.isEqual(oC, nC);
          }).length;
        });

        if (newGeoms.length > 0) {
          return this.getGeomData(newGeoms[newGeoms.length -1])
          .then(function(newGeo) {
            var dupe = false;
            instance.geometries.forEach(function (old, i) {
              if (_.isEqual(old.geometry.coordinates, newGeo.geometry.coordinates)) {
                dupe = true;
                instance.geometries[i] = newGeo;
              }
            });
            if (!dupe) {
              instance.geometries.push(newGeo);
            }
            return instance.geometries;
          });
        }
        else {
          var defer = $q.defer();
          defer.resolve(instance.geometries);
          return defer.promise;
        }

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
        var defer = $q.defer();

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

        angular.forEach(State.layers, function (layer) {
          if (
            !layer.active
            || (layer.temporal && geo.geometry.type === 'LineString')

          ) {
            return;
          }

          var dataLayer = _.find(instance.dataLayers, {uuid: layer.uuid});

          if (dataLayer) {
            promises.push(
              dataLayer.getData(options).then(function (response) {
                // async so remove anything obsolete.
                geo.properties = geo.properties || {};
                geo.properties[response.uuid] = geo.properties[response.uuid] || {};
                // Replace data and merge everything with existing state of
                // property.
                geo.properties[response.uuid].data = [];
                _.merge(geo.properties[response.uuid], response);
                if (!layer.active
                  && layer.uuid in Object.keys(geo.properties)) {

                    geo.properties[layer.uuid] = null;

                }
              })
            );
          }

        });

        $q.all(promises).then(function () {
            geo.properties = geo.properties || {};
            defer.resolve(geo);
            defer = undefined; // Clear the defer
        });

        return defer.promise;
      };

    }
  ]);
