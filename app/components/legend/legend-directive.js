angular.module('legend')
.directive('legend', ["LegendService", "State", function(LegendService, State) {

  var link = function (scope, element, attrs) {

    /* scope variables used for DISCRETE rasters: ****************************/

    scope.MAX_DISCRETE_CATEGORIES_DEFAULT = 5;
    scope.showAllCategoriesForRaster = {};
    scope.selectedDiscreteRasterName = null;

    scope.getBorderStyle = function (datum) {
      return datum.label === -1 ? "1px solid #ccc" : "0";
    };

    scope.totalCategoryCount = function (rasterName) {
      return scope.legendData.discrete[rasterName].length;
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
      return scope.totalCategoryCount(rasterName) >
        scope.MAX_DISCRETE_CATEGORIES_DEFAULT;
    };

    scope.discreteRasterIsSelected = function (rasterName) {
      var allRasterNames = Object.keys(scope.legendData.discrete);
      if (allRasterNames.length === 1 && allRasterNames[0] === rasterName) {
        // If only a single discrete raster is present, that must be the
        // selected discrete raster:
        scope.selectedDiscreteRasterName = rasterName;
        return true;
      }
      else if (!scope.selectedDiscreteRasterName) {
        // If currently no discrete raster is the selected one, we choose the
        // first we encounter (used on initial load):
        scope.selectedDiscreteRasterName = rasterName;
        return true;
      } else {
        return scope.selectedDiscreteRasterName === rasterName;
      }
    };

    scope.switchSelectedDiscreteRaster = function (currentRasterName) {
      var allRasterNames = Object.keys(scope.legendData.discrete);
      var currentIndex = allRasterNames.indexOf(currentRasterName);
      var nextIndex = (currentIndex + 1) % allRasterNames.length;
      scope.selectedDiscreteRasterName = allRasterNames[nextIndex];
    };

    /* scope variables used for CONTINUOUS rasters: **************************/

    scope.selectedContinuousRasterName = null;

    scope.continuousRasterIsSelected = function (rasterName) {
      var allRasterNames = Object.keys(scope.legendData.continuous);
      if (allRasterNames.length === 1 && allRasterNames[0] === rasterName) {
        // If only a single continuous raster is present, that must be the
        // selected continuous raster:
        scope.selectedContinuousRasterName = rasterName;
        return true;
      }
      else if (!scope.selectedDiscreteRasterName) {
        // If currently no discrete raster is the selected one, we choose the
        // first we encounter (used on initial load):
        scope.selectedDiscreteRasterName = rasterName;
        return true;
      } else {
        return scope.selectedDiscreteRasterName === rasterName;
      }
    };

    scope.round = function (r, decimalCount) {
      var d = decimalCount === undefined ? 0 : decimalCount;
      var multiplier = Math.pow(10, d);
      return Math.round(r * multiplier) / multiplier;
    };

    scope.buildGradient = function (rasterName) {
      console.log("[F] buildGradient");
      var min = scope.legendData[rasterName].min;
      var max = scope.legendData[rasterName].max;
      var allColors = scope.legendData[rasterName].colormap.interp;
      var selectedColors = [];
      angular.forEach(allColors, function (v, k) {


      });
    };

    /* 2x $watch used for triggering changes in both the discrete and
       continuous legends: */

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