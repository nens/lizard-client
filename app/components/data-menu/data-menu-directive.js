'use strict';

/**
 * Data menu directives
 *
 * Overview
 * ========
 *
 * Defines the data menu.
 */
angular.module('data-menu')
  .directive('datamenu', [function () {

    var link = function (scope, element, attrs) {
    };

    return {
      link: link,
      restrict: 'E',
      replace: true,
      templateUrl: 'data-menu/data-menu.html'
    };

  }
]);

/**
 * @module
 * @memberof datamenu
 * @description Show the layers in the data menu.
 */
angular.module('data-menu')
  .directive('layerSwitcher', [function () {

    var link = function (scope, element, attrs) {
    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        layerGroup: '=',
        menu: '='
      },
      templateUrl: 'data-menu/layer-switcher.html'
    };

  }
]);

/**
 * @module
 * @memberof datamenu
 * @description Add more layers to the data menu.
 */
angular.module('data-menu')
  .directive('layerAdder', ['LayerAdderService', 'DataService', 'notie',
                            function (LayerAdderService, DataService, notie) {

    var link = function (scope, element, attrs) {

      /**
       * Throw an alert and error when something went wrong with fetching the
       * layer groups.
       * @param {dict} httpResponse - The httpResponse headers returned by the
       *                              GET request.
       */
      var fetchLayerGroupsError = function(httpResponse) {
        console.log(httpResponse);
        notie.alert(3,
          gettext(
            "Oops! Something went wrong while fetching the layers."));
        throw new Error(
          httpResponse.status + " - "
          + gettext(
            "Could not retrieve layers:")
          + " " + httpResponse.config.url
          + ".");
      };

      /**
       * Throw an alert and error when something went wrong with fetching the
       * layer groups.
       * @param {array} layerGroups - The array of layer group objects
       *                              returned by the GET request.
       * @return {array} - the layerGroups array without the layergroups
       *                   already present in the portal.
       */
      var excludeExistingLayerGroups = function(layerGroups) {
        // Filter layergroups to layergroups not yet present in the portal.
        var existingLayerGroups = _.values(scope.menu.layerGroups);
        return _.differenceBy(
          layerGroups,
          existingLayerGroups,
          function(o) { return o.slug; }
        );
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
        scope.availableLayerGroups = excludeExistingLayerGroups(
            allLayerGroups);
      };

      /**
       * Get all the layer groups from the API.
       * Update the front-end to reflect a successful GET or throw an alert
       * on error.
       */
      LayerAdderService.fetchLayerGroups(
        {'page_size': 0}, fetchLayerGroupsSuccess, fetchLayerGroupsError);

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

    };

    return {
      link: link,
      restrict: 'E',
      scope: {
        menu: '='
      },
      templateUrl: 'data-menu/layer-adder.html'
    };

  }
]);

/**
 * @memberof datamenu
 * @description Makes the data menu items
 */
angular.module('data-menu')
  .directive('datamenuItem', ['State', function (State) {

  var link = function (scope, elem, attrs) {

    var rmAllButLastAsset = function () {
      State.selected.assets.forEach(function (asset) {
        if (State.selected.assets.length > 1) {
          State.selected.assets.removeAsset(asset);
        }
      });
    };

    scope.changeBoxType = function () {
      if (scope.type === 'point'
        || scope.type === 'region'
        || scope.type === 'area') {
        State.selected.geometries = [];
        rmAllButLastAsset();
      }
      // TODO: enable line with others, only clicklayer is bitching.
      else if (scope.type === 'line') {
        State.selected.geometries = [];
        State.selected.assets = [];
      }
      scope.boxType = scope.type;
    };

  };

  return {
    link: link,
    restrict: 'E',
    replace: true,
    scope: {
      boxType: '=',
      type: '@',
      icon: '@'
    },
    templateUrl: 'data-menu/data-menu-item.html'
  };
}]);
