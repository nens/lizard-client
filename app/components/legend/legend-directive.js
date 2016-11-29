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

    scope.totalCategoryCount = function (uuid) {
      return scope.legendData.discrete[uuid].length;
    };

    scope.showingAllCategories = function (uuid) {
      return scope.showAllCategoriesForRaster[uuid];
    };

    scope.toggleShowAllCategories = function (uuid) {
      scope.showAllCategoriesForRaster[uuid] =
        !scope.showAllCategoriesForRaster[uuid];
    };

    scope.getAmountOfDiscreteCategories = function (uuid) {
      if (scope.showAllCategoriesForRaster[uuid]) {
        return scope.totalCategoryCount(uuid);
      } else {
        return scope.MAX_DISCRETE_CATEGORIES_DEFAULT;
      }
    };

    scope.hasMoreCategoriesAvailableThanDefault = function (uuid) {
      return scope.totalCategoryCount(uuid) >
        scope.MAX_DISCRETE_CATEGORIES_DEFAULT;
    };

    scope.mustShowDiscreteLegend = function (uuid) {
      var layer = _.find(State.layers, { uuid: uuid });
      if (layer === undefined) {
        if (scope.legendData.discrete[uuid]) {
          delete scope.legendData.discrete[uuid];
          scope.switchSelectedRaster(uuid);
        }
        return false;
      } else {
        return scope.rasterIsSelected(uuid) &&
          scope.legendData.discrete[uuid] !== undefined;
      }
    };

    scope.mustShowContinuousLegend = function (uuid) {
      var layer = _.find(State.layers, { uuid: uuid });
      if (layer === undefined) {
        if (scope.legendData.continuous[uuid]) {
          delete scope.legendData.continuous[uuid];
          scope.switchSelectedRaster(uuid);
        }
        return false;
      } else {
        return scope.rasterIsSelected(uuid) &&
          scope.legendData.continuous[uuid] !== undefined &&
          scope.legendData.continuous[uuid].min !== null &&
          scope.legendData.continuous[uuid].max !== null;
      }
    };

    scope.getGradient = function (uuid) {

      if (scope.legendData.continuous[uuid] === undefined ||
          scope.legendData.continuous[uuid].colormap === null) { return;
      }
      var colorData = scope.legendData.continuous[uuid].colormap.data;
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

    scope.getAllRasterUuids = function () {
      var cRasterNames = Object.keys(scope.legendData.continuous);
      var dRasterNames = Object.keys(scope.legendData.discrete);
      return cRasterNames.concat(dRasterNames);
    };

    scope.rasterIsSelected = function (uuid) {
      var allRasterUuids = scope.getAllRasterUuids();
      if (allRasterUuids.length === 1 && allRasterUuids[0] === uuid) {
        scope.selectedRasterName = uuid;
        return true;
      }
      else if (!scope.selectedRasterName) {
        scope.selectedRasterName = uuid;
        return true;
      } else {
        return scope.selectedRasterName === uuid;
      }
    };

    scope.switchSelectedRaster = function (uuid) {
      var allRasterUuids = scope.getAllRasterUuids();
      var currentIndex = allRasterUuids.indexOf(uuid);
      if (allRasterUuids.length !== 0) {
        var nextIndex = (currentIndex + 1) % allRasterUuids.length;
        scope.selectedRasterName = allRasterUuids[nextIndex];
      }
    };

    scope.$watch(State.toString('layers.active'), function (n, o) {
      if (n === o) { return; }
      scope.legendData = LegendService.updateLegendData(
        State.spatial.bounds,
        scope.state.layers);
      // console.log("legendData:", scope.legendData);
    });

    scope.$watch('state.spatial.bounds', function (n, o) {
      if (n === o) { return; }
      scope.legendData = LegendService.updateLegendData(n, scope.state.layers);
      // console.log("legendData:", scope.legendData);
    });

    scope.uuidMapping = LegendService.uuidMapping;

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
