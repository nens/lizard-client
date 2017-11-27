
/**
 * @memberof datamenu
 * @description Makes the data menu items
 */
angular.module('data-menu')
  .directive('datamenuItem', ['State', 'rmAllButLastAssetAndGeometry', 'ClickFeedbackService', function (State, rmAllButLastAssetAndGeometry, ClickFeedbackService) {

  var link = function (scope, elem, attrs) {

    /**
     * Leaves all points when going from point to multi-point. Removes all but
     * last asset when going from multi-point to point and removes everything
     * when coming or going to line, region or area.
     */
    scope.changeBoxType = function () {
      if (scope.type === 'point') {
        ClickFeedbackService.labelsLayer.clearLayers();
      }
      if (scope.type === 'point' && scope.boxType === 'multi-point') {
        rmAllButLastAssetAndGeometry();
      }
      // TODO: enable line with others, only clicklayer is bitching.
      else if (!(scope.boxType === 'point' && scope.type === 'multi-point')) {
        State.geometries = [];
        State.assets = [];
      }
      scope.boxType = scope.type;
    };
    scope.lzIcons = ['multi-point-tool', 'line-tool', 'region-tool'];
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
    templateUrl: 'data-menu/templates/data-menu-item.html'
  };
}]);
