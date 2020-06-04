'use strict';

/**
 * @module
 * @memberof datamenu
 * @description Add more layers to the data menu.
 */
angular.module('data-menu')
  .directive('layerAdder',
             ['LayerAdderService', 'DataService', 'notie', 'gettextCatalog',
               '$rootScope',
              function (LayerAdderService,
                        DataService,
                        notie,
                        gettextCatalog,
                        $rootScope) {

    var link = function (scope, element, attrs) {
      var isEdge = navigator.appVersion.indexOf("Edge") > -1;
      var EMPTY_RESPONSE = {
        count: 0,
        next: null,
        previous: null,
        results: []
      };

      scope.availableLayers = _.clone(EMPTY_RESPONSE);

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
        scope.availableLayers = _.clone(EMPTY_RESPONSE);
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
        /**
         * Function below is a fix for old Edge versions. In some cases when
         * adding a layer Edge cannot handle clickevents. It gets out of this
         * state by clicking an input field. Which we do here.
        */
        if (isEdge) {
        var oldEdgeFix = function(){
          $rootScope.$on('$stateChangeSuccess', function(){
               $('#layer-adder-edge-fix').click();
               $('#layer-adder-edge-fix')[0].focus();
            });
          };
          oldEdgeFix();
        }
        fetchLayers({'q': scope.searchLayers, 'page': scope.layersCurrentPage});
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
        query.exclude = _.map(scope.state.layers, 'uuid').join(',');
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
       * Function to send request on sendRequest button click
       * based on search term entered in the input.
       */
      scope.sendRequest = function() {
        if (scope.searchLayers) {
          fetchLayers({'q': scope.searchLayers});
        }
      };

      /**
       * Function to send request on Enter keypress
       * based on search term entered in the input.
       */
      scope.sendRequestOnEnter = function(keyEvent) {
        if (keyEvent.which === 13 && scope.searchLayers) {
          fetchLayers({'q': scope.searchLayers});
        }
      };

      /**
       * Automatically fire a layer groups query with empty search
       * string when the input field is clear.
       */
      scope.$watch('searchLayers', function(newValue, oldValue) {
        if (newValue === '') {
          fetchLayers({'q': newValue});
        }
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
