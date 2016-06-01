
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
      var fetchLayerGroupsError = function(httpResponse) {
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
       * @param {array} allLayerGroups - The array of layer group objects
       *                                 returned by the GET request.
       * @param {dict} responseHeaders - Not actually used but required
       *                                 by $resource.
       */
      var fetchLayerGroupsSuccess = function (
          allLayerGroups, responseHeaders) {
        scope.availableLayerGroups = allLayerGroups;
      };

      /**
       * Add the selected layergroup to the portal.
       * @param {object} layerGroup - The layer group that was selected by the
       *                              user to be added to the portal.
       */
      scope.addLayerGroupToPortal = function (layerGroup) {
        // Create the layergroup.
        var newLayerGroup = DataService.createLayerGroup(layerGroup);
        // Turn the layergroup on.
        scope.menu.toggleLayerGroup(newLayerGroup);
        // Go back to the layer chooser menu.
        scope.menu.layerAdderEnabled = !scope.menu.layerAdderEnabled;
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
      var fetchLayerGroups = function (query) {
        if (typeof query === "undefined") {
          query = {};
        }

        // Generate a list of currently selected layer groups.
        var menuLayerGroupSlugs = _.join(
          _.map(
            _.values(scope.menu.layerGroups),
            'slug'),
          ',');

        query.exclude_slugs = menuLayerGroupSlugs;

        LayerAdderService.fetchLayerGroups(
          query,
          fetchLayerGroupsSuccess,
          fetchLayerGroupsError);
      };

      /**
       * Fetch layer groups on initialization of the module.
       */
      fetchLayerGroups();

      /**
       * Fire a layer groups query for every key entered in the filter/search
       * input.
       */
      scope.$watch('searchLayerGroups', function(newValue, oldValue) {
        fetchLayerGroups({'q': newValue});
      });

      scope.$watch('layerGroupsCurrentPage', function (currentPage) {
        fetchLayerGroups({'q': scope.searchLayerGroups, 'page': currentPage});
      });
    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        menu: '='
      },
      templateUrl: 'data-menu/templates/layer-adder.html'
    };

  }
]);
