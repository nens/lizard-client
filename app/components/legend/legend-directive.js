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

    scope.mustShowDiscreteLegend = function (rasterName) {
      var layer = _.find(State.layers, { name: rasterName });
      if (layer === undefined) {
        if (scope.legendData.discrete[rasterName]) {
          delete scope.legendData.discrete[rasterName];
          scope.switchSelectedRaster(rasterName);
        }
        return false;
      } else {
        return scope.rasterIsSelected(rasterName) &&
          scope.legendData.discrete[rasterName] !== undefined;
      }
    };

    scope.mustShowContinuousLegend = function (rasterName) {
      var layer = _.find(State.layers, { name: rasterName });
      if (layer === undefined) {
        if (scope.legendData.continuous[rasterName]) {
          delete scope.legendData.continuous[rasterName];
          scope.switchSelectedRaster(rasterName);
        }
        return false;
      } else {
        return scope.rasterIsSelected(rasterName) &&
          scope.legendData.continuous[rasterName] !== undefined &&
          scope.legendData.continuous[rasterName].min !== null &&
          scope.legendData.continuous[rasterName].max !== null;
      }
    };

    scope.getGradient = function (rasterName) {

      if (scope.legendData.continuous[rasterName] === undefined ||
          scope.legendData.continuous[rasterName].colormap === null) { return;
      }
      var colorData = scope.legendData.continuous[rasterName].colormap.data;
      var rgba,
          colorString,
          suffix = "";

      angular.forEach(colorData, function (datum) {
        rgba = datum[1];
        colorString = "rgb(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + ")";
        suffix += colorString + ",";
      });

      suffix = suffix.substring(0, suffix.length - 1) + ")";

      var gradientValue0 = "background: -moz-linear-gradient("
        + suffix;
      var gradientValue1 = "background: -webkit-linear-gradient("
        + suffix;
      var gradientValue2 = "background: -ms-linear-gradient("
        + suffix;

      return gradientValue0 + "; " + gradientValue1 + "; " + gradientValue2;
    };

    /* Een kaartje voor zowel continuous als discrete rasters ****************/

    scope.selectedRasterName = null;

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

    scope.switchSelectedRaster = function (currentRasterName) {;
      var allRasterNames = scope.getAllRasterNames();
      var currentIndex = allRasterNames.indexOf(currentRasterName);
      if (allRasterNames.length !== 0) {
        var nextIndex = (currentIndex + 1) % allRasterNames.length;
        scope.selectedRasterName = allRasterNames[nextIndex];
      }
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

    scope.legendData = LegendService.updateLegendData(
      State.spatial.bounds,
      scope.state.layers);
  };

  return {
    link: link,
    restrict: 'E',
    templateUrl: "legend/templates/legend.html",
    replace: true
  };
}]);