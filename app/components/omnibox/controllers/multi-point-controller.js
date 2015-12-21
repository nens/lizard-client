'use strict';

/**
 * @ngdoc
 * @memberOf app
 * @class MultiPointCtrl
 * @name MultiPointCtrl
 * @description multipoint is a controller for the tool to a multiple selection
 * of points on the map
 */

angular.module('omnibox')
.controller('MultiPointCtrl', [
    'State',
    'ClickFeedbackService',
    'DataService',
    'UtilService',
    'MapService',
    '$http',
    '$scope',
  function (
    State,
    ClickFeedbackService,
    DataService,
    UtilService,
    MapService,
    $http,
    $scope) {

    var selectedItem = {};

    var lastClick;
    var aggWindow;
    var layerId;
    var clicks = {};


    /**
     * @memberOf MultiPointCtrl
     * @function
     * @description gets point data based on clicks. Spatial.here
     */
    var getPointData = function () {
      lastClick = State.spatial.here;

      layerId = ClickFeedbackService.drawCircle(MapService, lastClick, true);
      ClickFeedbackService.startVibration(layerId);
      var options = {
        geom: lastClick,
        start: State.temporal.start,
        end: State.temporal.end,
        id: layerId,
        aggWindow: State.temporal.aggWindow
      };
      var promise = DataService.getData('omnibox', options);
      clicks[layerId] = promise;
      promise.then(drawFeedback, failed, fillCards);
      return promise;

    };

     /**
     * @memberOf MultiPointCtrl
     * @function
     * @description response function for the Data is being retrieved
     * works for a click, as well as a refresh
     * @params {object} response from api, grid or store
     */
    var fillCards = function (response) {
      var lGContent = {layers: {}};
      lGContent.layers[response.layerSlug] = lGContent.layers[response.layerSlug] || {};

      var lg = DataService.layerGroups[response.layerGroupSlug];
      if (lg) {
        lGContent.layerGroupName = lg.name;
        lGContent.order = lg.order;
        lGContent.temporal = lg.temporal;
      }

      if (UtilService.isSufficientlyRichData(
            (response.data && response.data.data) || response.data
            )) {

        var sharedKeys = ['aggType', 'format', 'data', 'summary', 'scale',
        'quantity', 'unit', 'color', 'type'];

        angular.forEach(sharedKeys, function (key) {
          lGContent.layers[response.layerSlug][key] = response[key];
        });

        /**
         * lGContent now looks like: {
         *   layerGroup: <slug>,
         *   layerGroupName: <name>,
         *   order: <order>,
         *   layers: {
         *     <layerSlug>: {
         *       data: <layer.data>,
         *       format: <layer.format>
         *     },
         *
         *     ...,
         *
         *   }
         * }
         */

        $scope.box.content[response.layerGroupSlug] = lGContent;
        if (response.layerGroupSlug.indexOf('waterchain') !== -1) {
          $scope.box.content.assets = ($scope.box.content.assets) ? $scope.box.content.assets : [];
          var gridKey = response.layerGroupSlug + '_grid';
          var asset = {
              data: angular.copy(response.data),
            };

          asset.data.geometry = asset.data.geom;

          var unique = isUnique($scope.box.content.assets, asset.data.id);
          if (unique) {
            $scope.box.content.assets.push(asset);
            State.selected.assets.push(asset.data.entity_name + '$' + asset.data.id);
          }
        }
      }

      // when all is said and done fill the mo fo's cards
       if (response && response.data) {
          // If we deal with raster data....
          if (response.layerSlug === 'rain' &&
              response.data && response.data.data !== null) {
            if ($scope.box.content[
                  response.layerGroupSlug] === undefined) { return; }
            if (!$scope.box.content[response.layerGroupSlug].layers.hasOwnProperty(response.layerSlug)) { return; }

            // This could probably be different..
            $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].changed =
              !$scope.box.content[response.layerGroupSlug].layers[response.layerSlug].changed;
            $scope.box.content[response.layerGroupSlug].layers[response.layerSlug].aggWindow = aggWindow;
          }
        }
       ClickFeedbackService.removeClickFromClickLayer(response.id);
    };


    /**
     * @function
     * @memberOf app.multiPointCtrl
     * @description Draw visual feedback after client clicked on the map
     * stolen from pointctrl
     */
    var drawFeedback = function (reason) {
      if (reason === 'overridden') { return; } // keep vibrating, other calls
                                               // will finish.
      var feedbackDrawn = false;
      var drawVectorFeedback = function (content) {
        angular.forEach(content, function (lg) {
          if (lg && lg.layers) {
            angular.forEach(lg.layers, function (layer) {
              if (layer.format === 'Vector' && layer.data.length > 0) {
                ClickFeedbackService.drawGeometry(
                  MapService,
                  layer.data
                );
                ClickFeedbackService.vibrateOnce();
                feedbackDrawn = true;
              }
            });
          }
        });
      };

      var drawUTFGridFeedback = function (content) {
        if (content.assets) {
          angular.forEach(content.assets, function (asset) {
            // bail if already drawn
            if (asset.feedbackDrawn) { return; }
            var feature = {
              type: 'Feature',
              geometry: angular.fromJson(asset.data.geometry),
              properties: {
                entity_name: asset.data.entity_name,
                type: asset.data.type || ''
              }
            };
            ClickFeedbackService.drawGeometry(
                MapService,
                feature
                );
            ClickFeedbackService.vibrateOnce();
            asset.feedbackDrawn = true;
            feedbackDrawn = true;
          });
        }
      };

      var drawStoreFeedback = function (content) {
        if (!feedbackDrawn) {
          angular.forEach(content, function (lg) {
            if (lg && lg.layers) {
              angular.forEach(lg.layers, function (layer) {
                if (layer.format === 'Store' && layer.data.length > 0) {
                  ClickFeedbackService.drawArrow(MapService, State.spatial.here);
                  feedbackDrawn = true;
                }
              });
            }
          });
        }
      };

      ClickFeedbackService.removeClickFromClickLayer(reason);
      drawVectorFeedback($scope.box.content);
      drawUTFGridFeedback($scope.box.content);
      drawStoreFeedback($scope.box.content);
      if (!feedbackDrawn) {
        ClickFeedbackService.vibrateOnce({
          type: 'Point',
          coordinates: [State.spatial.here.lng, State.spatial.here.lat]
        });
      }
    };    // something went wrong, report error remove pulsating point

    var failed = function (error) {
      ClickFeedbackService.removeClickFromClickLayer(layerId);
      // remove pulsating
      throw error;
    };

    $scope.$watch(State.toString('spatial.here'), function (n, o) {
      if (n === o || n === undefined) { return ;}
      getPointData();
    });

    /**
     * @function
     * @description Checks whether asset is already in the assets container
     * @params {array} list of assets
     * @params {number} id of asset that you want to append
     */
    var isUnique = function (assets, assetId) {
      // dedupe the shiz
      var unique = true;
      assets.filter(function (item, index) {
        if (item.data.id === assetId) {
          unique = false;
          return item;
        }
      });
      return unique;
    };

    /**
     * @function
     * @description Looks at urlState and fills boxes accordingly
     */
    var changeUrlState = function () {
      $scope.box.content.assets = ($scope.box.content.assets) ? $scope.box.content.assets : [];
      angular.forEach(State.selected.assets, function (asset, i) {
        var entity = asset.split('$')[0];
        var id = asset.split('$')[1];

        if (!isUnique($scope.box.content.assets, id)) { return; }

        $http({
          url: 'api/v2/' + entity + 's' + '/' + id + '/',
          method: 'GET'
        })
        .then(function (response) {
          response.data.entity_name = entity;
          $scope.box.content.assets.push({
            data: response.data,
          });
          drawFeedback();
        });
      });
    };

    $scope.$watch(State.toString('selected'), function (n, o) {
      var assetAmount = ($scope.box.content.assets) ? $scope.box.content.assets.length : 0;
      if (n === o ||
          (State.selected.assets.length === assetAmount)
          ) { return ;}
      changeUrlState();
    });

    $scope.$watch(State.toString('context'), function (n, o) {
      if (n === o) { return ;}

      if (n === 'map') {
        ClickFeedbackService.emptyClickLayer(MapService);
        $scope.box.content.assets.forEach(function (asset) {
          var feature = {
            type: 'Feature',
            geometry: angular.fromJson(asset.data.geom),
            properties: {
              entity_name: asset.data.entity_name,
              type: asset.data.type || ''
            }
          };
          ClickFeedbackService.drawGeometry(
            MapService,
            feature
          );
        });
      }
    });

    // initially look up from url
    changeUrlState();

  }
]);
