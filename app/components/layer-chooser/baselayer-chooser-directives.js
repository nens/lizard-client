//layer-directive.js

angular.module('data-menu')
.directive("baselayerChooser", ['DataService', function (DataService)
{
  var link = function (scope) {

    var _allBLGs = DataService.baselayerGroups,
        _allBLGSlugs = _.map(_allBLGs, "slug"),
        _getActiveBLG = function () {
          return _.filter(_allBLGs, function (blg) {
            return blg.isActive();
          })[0];
        };

    scope.getNextInactiveBLG = function () {
      var activeBLGIndex = 0;
      if (_getActiveBLG()) {
        activeBLGIndex = _allBLGSlugs.indexOf(_getActiveBLG().slug);
      }
      return _allBLGs[(activeBLGIndex + 1) % _allBLGs.length];
    };
  };

  return {
    link: link,
    templateUrl: 'layer-chooser/baselayer-chooser.html',
    restrict: 'E',
  };

}]);
