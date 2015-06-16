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
    'TimeseriesService',
    'dataLayers',
    'DataLayerGroup',
    'State',

    function (
      $q,
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


      /**
       * Creates a new layerGroup and adds to the layerGroups
       * @param  {object} lgConfig config of layergroup
       * @return {layerGroup instance}
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
      };

      /**
       * Removes the provided layerGroups from nxt
       * @param {layerGroup instance}
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
       * @return {promise} notifies with data from layergroup and resolves when
       *                   all layergroups and the timeseries returned data.
       */
      this.getData = function (callee, options, recursiveDefer) {
        var defer = $q.defer();

        if (recursiveDefer === undefined) {
          this.reject(callee);
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
                  defer
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
      this.reject = function (callee) {
        State.layerGroups.gettingData = false;
        if (this._dataDefers[callee]) {
          this._dataDefers[callee].forEach(function (defer) {
            defer.reject();
          });
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
      };

      /**
       * Checks response for id and entity_name and passes this
       * getTimeSeriesForObject with start and end.
       * @param  {object} response response from layergroup
       * @param  {int}    start    time start
       * @param  {int}    end      time end
       * @param  {defer}  defer    defer object to notify with timeseries
       * @return {promise || false} false when no id and entity name or promise
       *                            when making request to timeseries endpoint.
       */
      this.getTimeseriesAndEvents = function (response, options, defer) {
        if (response.format === 'UTFGrid'
          && response.data
          && response.data.id
          && response.data.entity_name
        ) {
          // Apparently, we're dealing with the waterchain:
          var tsPromise = getTimeSeriesForObject(
            response.data.entity_name + '$' + response.data.id,
            options.start,
            options.end,
            options.minPoints,
            defer
          );
          // The defer from getData is recycled, no need to pass a callee param.
          options.type = 'Event';
          options.object = {
            type: response.data.entity_name,
            id: response.data.id
          };
          // Get all events for the provided options and the events belonging to
          // this object.
          var eventsPromsise = this.getData(null, options, defer);
          return $q.all([tsPromise, eventsPromsise]);
        } else { return false; }
      };

      /**
       * @function
       * @memberOf app.pointCtrl
       * @description gets timeseries from service
       */
      var getTimeSeriesForObject = function (
          objectId,
          start,
          end,
          minPoints,
          defer
        ) {

        // maximum number of timeseries events, more probably results in a
        // memory error.
        var MAX_NR_TIMESERIES_EVENTS = 25000;
        var promise = TimeseriesService.getTimeseries(
          objectId,
          {
            start: start,
            end: end
          },
          minPoints
        ).then(function (response) {

           // Filter out the timeseries with too little measurements. And ts
           // without parameter unit info.
          var filteredResult = [];
          angular.forEach(response.results, function (ts) {
            if (ts.events.length > 1 &&
                ts.events.length < MAX_NR_TIMESERIES_EVENTS &&
                ts.parameter_referenced_unit) {
              filteredResult.push(value);
            }
          });
          defer.notify({
            data: filteredResult,
            layerGroupSlug: 'timeseries',
            layerSlug: 'timeseries',
          });

        });

        return promise;
      };

    }
  ]);
