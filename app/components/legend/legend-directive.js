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

    scope.getGradient = function (rasterName) {
      var colorData = scope.legendData.continuous[rasterName].colormap.data;
      var gradientValue = "-moz-linear-gradient(bottom, ";
      angular.forEach(colorData, function (datum) {
        var rgba = datum[1];
        var colorString = "rgb(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + ")";
        gradientValue += colorString + ",";
      });

      return gradientValue.substring(0, gradientValue.length - 1) + ")";
    };

    scope.getHeightOffsetForMinimum = function (rasterName) {
      console.log("[F] heightOffsetForMinimum");
      var TOTAL_HEIGHT = 120;
      var currentMin = scope.legendData.continuous[rasterName].min;
      var absMin = scope.legendData.continuous[rasterName].colormap.interp[0][0];
      var absMax = scope.legendData.continuous[rasterName].colormap.interp[100][0];
      var totalDelta = absMax - absMin;
      var result = 1 + (currentMin / totalDelta) * TOTAL_HEIGHT;
      return Math.round(result);
    };

    /* Een kaartje voor zowel continuous als discrete rasters ****************/

    scope.selectedRasterName = "Bodem";

    scope.getAllRasterNames = function () {
      var cRasterNames = Object.keys(scope.legendData.continuous);
      var dRasterNames = Object.keys(scope.legendData.discrete);
      return cRasterNames.concat(dRasterNames);
    };

    scope.rasterIsSelected = function (rasterName) {
      var allRasterNames = scope.getAllRasterNames();
      if (allRasterNames.length === 1 && allRasterNames[0] === rasterName) {
        scope.selectedRasterName = rasterName;
        return true;
      }
      else if (!scope.selectedRasterName) {
        scope.selectedRasterName = rasterName;
        return true;
      } else {
        return scope.selectedRasterName === rasterName;
      }
    };

    scope.switchSelectedRaster = function (currentRasterName) {
      var allRasterNames = scope.getAllRasterNames();
      var currentIndex = allRasterNames.indexOf(currentRasterName);
      var nextIndex = (currentIndex + 1) % allRasterNames.length;
      scope.selectedRasterName = allRasterNames[nextIndex];
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