angular.module('legend')
.directive('legend', ["LegendService", "State", function(LegendService, State) {

  // When using this directive to actually draw the legend in the browser, you
  // only need to read from scope.legendData.

  var link = function (scope, element, attrs) {

    scope.MAX_DISCRETE_CATEGORIES_DEFAULT = 5;
    scope.showAllCategoriesForRaster = {};
    scope.selectedRasterName = null;

    scope.getBorderStyle = function (datum) {
      return datum.label === -1 ? "1px solid #ccc" : "0";
    };

    scope.totalCategoryCount = function (rasterName) {
      return scope.legendData.discrete[rasterName].length;
    };

    scope.shownCategoryCount = function (rasterName) {
      // return scope.legendData.discrete[rasterName].length;

      return Math.min(
        scope.MAX_DISCRETE_CATEGORIES_DEFAULT,
        scope.totalCategoryCount(rasterName)
      );
    };

    scope.showingAllCategories = function (rasterName) {
      return scope.showAllCategoriesForRaster[rasterName];
    };

    scope.toggleShowAllCategories = function (rasterName) {
      scope.showAllCategoriesForRaster[rasterName] =
        !scope.showAllCategoriesForRaster[rasterName];
    };

    scope.getAmountOfDiscreteCategories = function (rasterName) {
      if (scope.showAllCategoriesForRaster[rasterName]) {
        return scope.totalCategoryCount(rasterName);
      } else {
        return scope.MAX_DISCRETE_CATEGORIES_DEFAULT;
      }
    };

    scope.hasMoreCategoriesAvailableThanDefault = function (rasterName) {
      return scope.totalCategoryCount(rasterName) > scope.MAX_DISCRETE_CATEGORIES_DEFAULT;
    };

    scope.discreteRasterIsSelected = function (rasterName) {
      var allRasterNames = Object.keys(scope.legendData.discrete);
      if (allRasterNames.length === 1 && allRasterNames[0] === rasterName) {
        // If only a single discrete raster is present, that must be the
        // selected discrete raster:
        scope.selectedRasterName = rasterName;
        return true;
      }
      else if (!scope.selectedRasterName) {
        // If currently no discrete raster is the selected one, we choose the
        // first we encounter (used on initial load):
        scope.selectedRasterName = rasterName;
        return true;
      } else {
        return scope.selectedRasterName === rasterName;
      }
    };

    scope.switchSelectedRaster = function (currentRasterName) {
      var allRasterNames = Object.keys(scope.legendData.discrete);
      var currentIndex = allRasterNames.indexOf(currentRasterName);
      var nextIndex = (currentIndex + 1) % allRasterNames.length;
      scope.selectedRasterName = allRasterNames[nextIndex];
    };

    scope.$watch(State.toString('layers.active'), function (n, o) {
      if (n === o) { return; }

      scope.legendData = LegendService.updateLegendData(
        State.spatial.bounds,
        scope.state.layers);
      console.log("legendData:", scope.legendData);
    });
    scope.$watch('state.spatial.bounds', function (n, o) {
      if (n === o) { return; }
      scope.legendData = LegendService.updateLegendData(n, scope.state.layers);
      console.log("legendData:", scope.legendData);
    });
  };

  return {
    link: link,
    restrict: 'E',
    templateUrl: "legend/templates/legend.html",
    replace: true
  };
}]);