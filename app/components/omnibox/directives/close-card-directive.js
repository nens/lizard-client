/**
 *
 * Removes asset from selection
 *
 * TODO: this directive or an attribute directive should be responsible for
 * making the card small when there is not enough space.
 *
 * TODO 2: use ng-click so we do not have to worry about running a digest cycle
 * manually.
 */
angular.module('omnibox')
  .directive('closeCard', ["State", function (State) {

    var link = function (scope, element, attrs) {

      /**
       * Removes asset from global State.
       *
       * Requires entity and id of asset on scope.
       */
      scope.rmAsset = function () {
        if (scope.entity === undefined || scope.id === undefined) {
          throw new Error(
            'Cannot remove asset from selection. Asset '
            + 'entity_name: '
            + scope.entity
            + '. asset id: '
            + scope.id
          );
        }

        var assetId = scope.entity + '$' + scope.id;
        var selectedAssets = State.selected.assets;
        var i = State.selected.assets.indexOf(assetId);
        if (i >= 0) {
          selectedAssets.splice(i, 1);
        }
      };

    };


    return {
      link: link,
      restrict: 'E',
      scope: {
        entity: '=',
        id: '='
      },
      replace: true,
      templateUrl: 'omnibox/templates/close-card.html'
    };

  }]);

