
/**
 * @module
 * @memberof datamenu
 * @description Add more layers to the data menu.
 */
angular.module('data-menu')
  .directive('layerAdder',
             ['LayerAdderService', 'DataService', 'notie', 'gettextCatalog',
              function (LayerAdderService,
                        DataService,
                        notie,
                        gettextCatalog) {

    var link = function (scope, element, attrs) {


      /**
       * Throw an alert and error when something went wrong with fetching the
       * layer groups.
       * @param {dict} httpResponse - The httpResponse headers returned by the
       *                              GET request.
       */
      var fetchLayersError = function(httpResponse) {
        notie.alert(
          3, gettextCatalog.getString(
            "Oops! Something went wrong while fetching the layers."));
        throw new Error(
          httpResponse.status + " - "
          + "Could not retrieve layers:"
          + " " + httpResponse.config.url
          + ".");
      };

      /**
       * Fill the layer adder list with all the layer groups returned by the
       * GET request, existing layer groups in the portal excluded.
       * @param {array} allLayers - The array of layer group objects
       *                                 returned by the GET request.
       * @param {dict} responseHeaders - Not actually used but required
       *                                 by $resource.
       */
      var fetchLayersSuccess = function (response, responseHeaders) {
        scope.availableLayers = response.data;
      };

      /**
       * Add the selected layergroup to the portal.
       * @param {object} layerGroup - The layer group that was selected by the
       *                              user to be added to the portal.
       */
      scope.addLayer = function (layer) {
        LayerAdderService.add(layer);
      };

      /**
       * Get available layer groups from the API.
       * Filter the currently selected layer groups from the available layer
       * groups.
       * Update the front-end to reflect a successful GET or throw an alert
       * on error.
       *
       * @param {object} query - Optional parameter which accepts an object
       *                         with query parameters for the API request.
       */
      var fetchLayers = function (query) {
        if (typeof query === "undefined") {
          query = {};
        }

        LayerAdderService.fetchLayers(
          query,
          fetchLayersSuccess,
          fetchLayersError
        );
      };

      /**
       * Fetch layer groups on initialization of the module.
       */
      fetchLayers();

      /**
       * Fire a layer groups query for every key entered in the filter/search
       * input.
       */
      scope.$watch('searchLayers', function(newValue, oldValue) {
        fetchLayers({'q': newValue});
      });

      scope.$watch('layersCurrentPage', function (currentPage) {
        fetchLayers({'q': scope.searchLayers, 'page': currentPage});
      });
    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        menu: '=',
        state: '='
      },
      templateUrl: 'data-menu/templates/layer-adder.html'
    };

  }
]);
