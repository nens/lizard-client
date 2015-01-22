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
      if ($scope.box.content.hasOwnProperty('location')) {
        delete $scope.box.content.location;
      }

      var doneFn = function () {
        angular.forEach($scope.box.content, function (value, key) {
          if (State.layerGroups.active.indexOf(key) === -1) {
            delete $scope.box.content[key];
          }
        });
      };

      var putDataOnScope = function (response) {
        var lGContent = $scope.box.content[response.layerGroupSlug] || {layers: {}};
        lGContent.layers[response.layerSlug] = lGContent.layers[response.layerSlug] || {};
        lGContent.layerGroupName = DataService.layerGroups[response.layerGroupSlug].name;
        lGContent.order = DataService.layerGroups[response.layerGroupSlug].order;
        if (UtilService.isSufficientlyRichData(response.data)) {

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
