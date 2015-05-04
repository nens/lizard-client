angular.module('omnibox')
  .controller("OmniboxCtrl", [
  "$scope",
  "UtilService",
  "ClickFeedbackService",
  "State",
  "DataService",
  "MapService",

  function (
    $scope,
    UtilService,
    ClickFeedbackService,
    State,
    DataService,
    MapService) {

    this.state = { temporal: State.temporal };

    $scope.box = {
      content: {}
    };

    $scope.zoomIn = MapService.zoomIn;
    $scope.zoomOut = MapService.zoomOut;

    /**
     * @function
     * @memberOf app.omnibox
     * @description Fills box by requesting data from DataService
     *              When finished $scope.box.content contains an
     *              object for every active layergroup and an item
     *              in box.content.<layergroup>.layer for every
     *              piece of data.The promises are returned to
     *              add specific logic in the child controllers.
     * @param  {L.LatLng} here | L.Bounds | [L.LatLng]
     */
    $scope.fillBox = function (options) {
      // if geocode query has been used it needs to be destroyed now
      if ($scope.box.content.hasOwnProperty('searchResults')) {
        delete $scope.box.content.searchResults;
      }

      var doneFn = function () {
        // This function deletes scope.box.content for specific layergroups; this implies
        // skippingthe key 'timeseries' since this doesn't denote a layergroup!
        angular.forEach($scope.box.content, function (value, key) {
          if (State.layerGroups.active.indexOf(key) === -1
              && key !== 'timeseries') {
            delete $scope.box.content[key];
          }
        });
      };

      var putDataOnScope = function (response) {
        var lGContent = $scope.box.content[response.layerGroupSlug] || {layers: {}};
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

        } else {

          if ($scope.box.content[response.layerGroupSlug]) {

            if (response.layerGroupSlug === 'waterchain') {
              delete $scope.box.content.waterchain;
              delete $scope.box.content.timeseries;

            } else {
              delete $scope.box.content[response.layerGroupSlug].layers[response.layerSlug];
            }
          }
        }
        // Accomodate chaining in child controllers
        return response;
      };
      var promise = DataService.getData('omnibox', options).then(doneFn, doneFn, putDataOnScope);
      return promise;
    };

    // Make UtilSvc.getIconClass available in Angular templates
    $scope.getIconClass = UtilService.getIconClass;
  }
]);
