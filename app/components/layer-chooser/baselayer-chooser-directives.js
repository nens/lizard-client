//layer-directive.js

angular.module('data-menu')
.directive("baselayerChooser", ['DataService', function (DataService)
{
  var link = function (scope, element, attrs) {

    window.onload = function () {

      var _allBLGs = DataService.baselayerGroups,
          _allBLGSlugs = _.pluck(_allBLGs, "slug"),
          _getActiveBLG = function () {
            return _.filter(_allBLGs, function (blg) {
              return blg.isActive();
            })[0];
          };

      scope.getNextInactiveBLG = function () {
        var activeBLGIndex = _allBLGSlugs.indexOf(_getActiveBLG().slug);
        return _allBLGs[(activeBLGIndex + 1) % _allBLGs.length];
      };
    };
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/baselayer-chooser.html',
    restrict: 'E',
  };

}]);
