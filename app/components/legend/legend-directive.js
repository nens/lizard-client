angular.module('legend')
.directive('legend', ["LegendService", "State", function(LegendService, State) {

  var rgbListToString = function (rgbList) {
    var result = "rgb("
      + rgbList[0] + ","
      + rgbList[1] + ","
      + rgbList[2] + ")";
    return result;
  };

  var shiftColor = function (rgba0, rgba1, shiftRatio) {
    console.log("[F] shiftColor");

    var r0 = rgba0[0];
    var r1 = rgba1[0];
    var rDiff = r1 - r0;
    var rInterp = Math.round(r0 + rDiff * shiftRatio);

    var g0 = rgba0[1];
    var g1 = rgba1[1];
    var gDiff = g1 - g0;
    var gInterp = Math.round(g0 + gDiff * shiftRatio);

    var b0 = rgba0[2];
    var b1 = rgba1[2];
    var bDiff = b1 - b0;
    var bInterp = Math.round(b0 + bDiff * shiftRatio);

    return [rInterp, gInterp, bInterp];
  };

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

      /*

      ////////////////////////////////////////////////////
      var minColor = scope.getColorForMinimum(rasterName);
      ////////////////////////////////////////////////////

      var intermediateColor = "rgb(255, 255, 198)";

      ////////////////////////////////////////////////////
      var maxColor = scope.getColorForMaximum(rasterName);
      ////////////////////////////////////////////////////

      var gradientValue = "-moz-linear-gradient(bottom, ";
      var colorFirst = rgbListToString(minColor);
      var colorLast = rgbListToString(maxColor);
      gradientValue += colorFirst + "," + intermediateColor + "," + colorLast + ")";
      console.log("gradientValue:", gradientValue);

      return gradientValue;

      */


      var colorData = scope.legendData.continuous[rasterName].colormap.data;
      var gradientValue = "-moz-linear-gradient(bottom, ";
      angular.forEach(colorData, function (datum) {
        var rgba = datum[1];
        var colorString = "rgb(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + ")";
        gradientValue += colorString + ",";
      });

      return gradientValue.substring(0, gradientValue.length - 1) + ")";
    };

    scope.getColorForMinimum = function (rasterName) {
      var rasterData = scope.legendData.continuous[rasterName];
      var colorData = rasterData.colormap.data;
      var currentMin = rasterData.min;
      console.log("currentMin:", currentMin);

      var colorDatum;
      var rgba0;
      var rgba1;
      var num;
      var prevNum;
      var prevColorDatum;
      var numDelta;
      var shiftPercentage;
      var interpolatedColor;
      var shiftRatio;

      for (var i = colorData.length - 1; i > 0; i--) {

        colorDatum = colorData[i];
        prevColorDatum = colorData[i - 1];

        num = colorDatum[0];
        prevNum = prevColorDatum[0];

        console.log("num:", num);
        if (currentMin > prevNum && currentMin < num) {
          console.log("OK, found range!", prevNum, "<=", currentMin, " <=", num);

          rgba1 = colorDatum[1];
          rgba0 = prevColorDatum[1];

          numDelta = num - prevNum;
          console.log("numDelta:", numDelta);

          shiftRatio = (currentMin - prevNum) / numDelta;
          console.log("shiftRatio:", shiftRatio);
          interpolatedColor = shiftColor(rgba0, rgba1, shiftRatio);
          console.log("interpolatedColor for minimum:", interpolatedColor);
          break;
        }
      }
      return rgbListToString(interpolatedColor);
    };

    scope.getColorForMaximum = function (rasterName) {
      var rasterData = scope.legendData.continuous[rasterName];
      var colorData = rasterData.colormap.data;
      var currentMax = rasterData.max;
      // console.log("currentMax:", currentMax);

      var colorDatum,
          num,
          rgba0,
          rgba1,
          prevNum,
          deltaNum,
          dist,
          shiftRatio,
          interpolatedColor;

      for (var i=colorData.length - 1; i > 0; i--) {
        colorDatum = colorData[i];
        num = colorDatum[0];
        rgba1 = colorDatum[1];
        if (currentMax <= num) {
          prevNum = colorData[i - 1][0];
          rgba0 = colorData[i - 1][1];
          deltaNum = num - prevNum;
          dist = currentMax - prevNum;
          shiftRatio = dist / deltaNum;
          interpolatedColor = shiftColor(rgba0, rgba1, shiftRatio);
          // console.log("interpolatedColor for maximum:", interpolatedColor);
          break;
        }
      }
      return rgbListToString(interpolatedColor);
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