angular.module('lizard-nxt')
  .controller("OmniboxCtrl", [
  "$scope",
  "UtilService",
  function ($scope, UtilService) {

    $scope.box.content = {};

    /**
     * @function
     * @memberOf app.pointCtrl
     * @param  {L.LatLng} here
     */
    $scope.fillBox = function (geom) {

      var promises = [];

      var doneFn = function (response) {
        if (response.active === false) {
          delete $scope.box.content[response.slug];
        }
      };

      var putDataOnScope = function (response) {
        var lGContent = $scope.box.content[response.layerGroupSlug] || {layers: {}};
        lGContent.layers[response.layerSlug] = lGContent.layers[response.layerSlug] || {};
        lGContent.layerGroupName = $scope.mapState.layerGroups[response.layerGroupSlug].name;
        lGContent.order = $scope.mapState.layerGroups[response.layerGroupSlug].order;
        if (response.data === null) {
          if ($scope.box.content[response.layerGroupSlug]) {
            delete $scope.box.content[response.layerGroupSlug].layers[response.layerSlug];
          }
        } else {
          lGContent.layers[response.layerSlug].aggType = response.aggType;
          lGContent.layers[response.layerSlug].type = response.type;
          lGContent.layers[response.layerSlug].data = response.data;
          lGContent.layers[response.layerSlug].summary = response.summary;

          /**
           * lGContent now looks like: {
           *   layerGroup: <slug>,
           *   layerGroupName: <name>,
           *   order: <order>,
           *   layers: {
           *     <layerSlug>: {
           *       data: <layer.data>,
           *       type: <layer.type>
           *     },
           *
           *     ...,
           *
           *   }
           * }
           */

          $scope.box.content[response.layerGroupSlug] = lGContent;
        }
        // Accomadate chaining in child controllers
        return response;
      };

      angular.forEach($scope.mapState.layerGroups, function (layerGroup) {
        promises.push(layerGroup.getData({geom: geom})
          .then(doneFn, doneFn, putDataOnScope));
      });

      return promises;
    };

    $scope.toggleThisCard = UtilService.toggleThisCard;

  }
]);