angular.module('lizard-nxt')
  .controller("OmniboxCtrl", [
  "$scope",
  "UtilService",
  "ClickFeedbackService",

  function (
    $scope,
    UtilService,
    ClickFeedbackService) {

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

      // if geocode query has been used it needs to be destroyed now
      if ($scope.box.content.hasOwnProperty('location')) {
        delete $scope.box.content.location;
      }

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

        if (UtilService.isSufficientlyRichData(response.data)) {

          var sharedKeys = ['aggType', 'type', 'data', 'summary', 'scale',
            'quantity', 'unit', 'color'];

          angular.forEach(sharedKeys, function (key) {
            lGContent.layers[response.layerSlug][key] = response[key];
          });

          // plakband for hydra_core discrepancy: name vs. display_name
          if (lGContent &&
              lGContent.layers &&
              lGContent.layers.waterchain_grid &&
              lGContent.layers.waterchain_grid.data) {
            lGContent.layers.waterchain_grid.data =
              UtilService.fixUTFNameData(lGContent.layers.waterchain_grid.data);
          }

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


        resetDetailCards();
        // Accomodate chaining in child controllers
        return response;
      };

      angular.forEach($scope.mapState.layerGroups, function (layerGroup) {
        promises.push(layerGroup.getData(options)
          .then(doneFn, doneFn, putDataOnScope));
      });

      // reset detail cards, based on new content models.
      resetDetailCards();
      return promises;
    };

    /**
     *  This resets the detailed card model
     */
    var resetDetailCards = function () {
      $scope.box.fullDetailCards = {};
      angular.forEach(Object.keys($scope.box.content), function (key) {
        $scope.box.fullDetailCards[key] = true;
        if (key === 'waterchain') {
          $scope.box.fullDetailCards.timeseries = true;
        }
      });
    };

    /**
     * Resizes if cards, navbar and timeline are larger
     * then the window size.
     */
    $scope.box.minimizeCards = function () {
      // height of search and nav combined
      var searchNav = $('#searchboxinput').offset().top + $('#searchboxinput').height();
      var heights = $('#cards').height() + searchNav + 
         $('#timeline').height() > $('body').height();
      // jquery is good at this stuff alternative version would be:
      // document.querySelector('#cards').clientHeight etc...
      if (heights) {
         angular.forEach(Object.keys($scope.box.fullDetailCards),
           function (layer) {
             $scope.box.fullDetailCards[layer] = false;
         });
      }
    };
    
    window.addEventListener('resize', $scope.box.minimizeCards);
  }
]);
