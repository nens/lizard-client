angular.module('lizard-nxt')
  .controller("OmniboxCtrl", [
  "$scope",
  "UtilService",
  function ($scope, UtilService) {

    $scope.box.content = {};

    /**
     * @function
     * @memberOf app.omnibox
     * @description Loops over all layergroups to request data
     *              for the provided geom. When finished $scope.
     *              box.content contains an object for every
     *              active layergroup and an item in box.content
     *              .<layergroup>.layer for every piece of data.
     *              The promises are returned to add specific
   *              logic in the child controllers.
     * @param  {L.LatLng} here | L.Bounds | [L.LatLng]
     */
    $scope.fillBox = function (options) {

      var promises = [];

      var doneFn = function (response) {
        if (response.active === false) {
          delete $scope.box.content[response.slug];
        }
      };

      /**
       * @function
       * @memberOf app.omnibox
       * @description - checks whether API response has enough (non-null) data
       *                to actually put it on the scope.
       * @param {Object[]} response - An API response
       * @return {boolean}
       */
      var isSufficientlyRichData = function (response) {

        if (response.data === null) {
          // kill: null
          return false;

        } else if (response.constructor === 'Array') {

          if (response.length === 0) {
            // kill: []
            return false;

          } else if (UtilService.all(response, function (x) { return x === null; })) {
            // kill: [null, null, ..., null]
            return false;

          } else if (response[0].constructor === 'Array') {
            // kill: [[x0, null], [x1, null], ..., [xn, null]]

            return UtilService.all(response, function (elem) {
              return elem[1] === null;
            });
          }
        }
        return true;
      };

      var putDataOnScope = function (response) {

        var lGContent = $scope.box.content[response.layerGroupSlug] || {layers: {}};
        lGContent.layers[response.layerSlug] = lGContent.layers[response.layerSlug] || {};
        lGContent.layerGroupName = $scope.mapState.layerGroups[response.layerGroupSlug].name;
        lGContent.order = $scope.mapState.layerGroups[response.layerGroupSlug].order;

        if (isSufficientlyRichData(response)) {

          var sharedKeys = ['aggType', 'type', 'data', 'summary', 'scale',
            'quantity', 'unit', 'color'];

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
           *       type: <layer.type>
           *     },
           *
           *     ...,
           *
           *   }
           * }
           */

           // kill timeseries

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
        // Accomadate chaining in child controllers
        return response;
      };

      angular.forEach($scope.mapState.layerGroups, function (layerGroup) {
        promises.push(layerGroup.getData(options)
          .then(doneFn, doneFn, putDataOnScope));
      });

      return promises;
    };
  }
]);
