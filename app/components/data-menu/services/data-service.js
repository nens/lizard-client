'use strict';


/**
 * @ngdoc service
 * @class NxtData /
 * @memberof app
 * @name NxtData
 * @requires $q, dataLayers, LayerGroup, getNestedAssets and State
 * @summary Encapsulates dataLayers
 * @description NxtData service encapsulates dataLayers from the server side
 *              configuration of dataLayers. It enables to perform actions
 *              on all dataLayers simultaneously. When provided with a string
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

      instance.dataLayers = [];

      // Callback for when assets are being retrieved from api
      var assetChange = function (asset) {
        if (asset) {
          instance.assets.push(asset);
        }

        // A-synchronously remove assets no longer in selection.
        instance.assets = AssetService.removeOldAssets(_assets, instance.assets);

        // Deduplicate instance.assets asynchronous.
        instance.assets = _.uniqWith(instance.assets, _.isEqual);

        // instantes
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
        .forEach(function (promise) {
          promise.then(function (geometries) {
            // Dedupe instance.geometries asynchronous.
            instance.geometries = _.uniqWith(geometries, isDuplicateGeometry);
            console.log('DataService.geometries:', instance.geometries);
            if (instance.onGeometriesChange) {
              instance.onGeometriesChange();
            }
          });
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

      // When timeline is not moving and at is changed, also update assets and
      // geometries.
      //
      // NOTE: This implementation is not fool proof. When at is changed because
      // the timeline is dragged, refreshSelected is not called here. This is
      // not noticeable because when timelineMoving goes to false is
      // refreshSelected is also called.
      var _at = Date.now();
      Object.defineProperty(State.temporal, 'at', {
        get: function () { return _at; },
        set: function (value) {
          _at = value;
          if (!State.temporal.timelineMoving && !State.temporal.playing) {
            console.log('set at');
            instance.refreshSelected();
          }
        }
      });

      this._dataDefers = {}; // Per callee a list with a defer for every time
                             // getData gets called before the last one
                             // resolves.

      this.refreshSelected = function () {
        this.geometries.forEach(function (geom) {

          angular.forEach(geom.properties, function (v, s) {
            var layer = _.find(State.layers, {uuid: s});
            if (!layer || !layer.active) {
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

        var promises = [] ;
        if (newGeoms.length > 0) {
          // Get data for all the new geometries by slicing it with the old
          // ones.
          newGeoms = _.slice(newGeoms, oldGeoms.length, newGeoms.length);
          _.forEach(newGeoms, function (newGeom) {
            promises.push(instance.getGeomData(newGeom)
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
            }));
          });
        }
        else {
          var defer = $q.defer();
          defer.resolve(instance.geometries);
          promises.push(defer.promise);
        }
        return promises;
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

      /**
       * @description - Retrieve data layer by layer UUID
       * @param uuid {string} - Layer UUID
       * @return {object} - Data layer object
       */
      this.getDataLayer = function(uuid) {
        return _.find(instance.dataLayers, {uuid: uuid});
      };

      this.updateLayerData = function (geo, layer, options, promises) {

        if (!layer.active) {
          return;
        }

        var dataLayer = this.getDataLayer(layer.uuid);

        if (dataLayer
          && !(dataLayer.temporal && geo.geometry.type === 'LineString')
        ) {
          promises.push(
            dataLayer.getData(options).then(function (response) {
              // async so remove anything obsolete.
              geo.properties = geo.properties || {};
              geo.properties[layer.uuid] = geo.properties[layer.uuid] || _.clone(dataLayer);
              // Replace data and merge everything with existing state of
              // property.
              if (response.data) {
                geo.properties[layer.uuid].data = [];
                _.merge(geo.properties[layer.uuid], response);
              } else {
                geo.properties[layer.uuid].data = response;
              }
              if ((!layer.active && layer.uuid in Object.keys(geo.properties))
                || geo.properties[layer.uuid].data === null) {

                // Use delete to remove the key and the value and the omnibox
                // can show a nodata message.
                delete geo.properties[layer.uuid];
              }
            })
          );
        }
      };

      this.getGeomData = function (geo) {

        var defer = $q.defer();

        var promises = [];
        var instance = this;

        var options = {
          start: State.temporal.start,
          end: State.temporal.end
        };

        options.geom = geo.geometry;

        if (geo.geometry && (geo.geometry.type === 'Polygon' || geo.geometry.type === 'MultiPolygon') && geo.id) {
          options.id = geo.id;
          options.boundary_type = geo.regionType;
        }

        angular.forEach(State.layers, function (layer) {
          instance.updateLayerData(geo, layer, options, promises);
        });

        if (State.annotations.active) {
          var uuid = instance.annotationsLayer.uuid;
          promises.push(
            instance.annotationsLayer.getData(options).then(function (response) {
              // async so remove anything obsolete.
              geo.properties = geo.properties || {};
              geo.properties[uuid] = geo.properties[uuid] || {};
              // Replace data and merge everything with existing state of
              // property.
              geo.properties[uuid].data = response;
              if (!State.annotations.active && uuid in Object.keys(geo.properties)) {
                  geo.properties[uuid] = null;
              }
            })
          );
        }

        $q.all(promises).then(function () {
            geo.properties = geo.properties || {};
            defer.resolve(geo);
            defer = undefined; // Clear the defer
        });

        return defer.promise;
      };

    }
  ]);
