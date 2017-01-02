angular.module('legend')
.directive('legend', ["LegendService", function(LegendService) {

  var link = function (scope, element, attrs) {

    /* scope variables used for DISCRETE rasters: ****************************/

    scope.legend = {
      MAX_DISCRETE_CATEGORIES_DEFAULT: 5,
      showAllCategoriesForRaster: {},
      selectedDiscreteRasterName: null,
      uuidMapping: LegendService.uuidMapping,
      data: {
        discrete: {},
        continuous: {}
      }
    };

    var getBorderStyle = function (datum) {
      return datum.label === -1 ? "1px solid #ccc" : "0";
    };

    scope.totalCategoryCount = function (uuid) {
      return scope.legend.data.discrete[uuid].length;
    };

    scope.showingAllCategories = function (uuid) {
      return scope.legend.showAllCategoriesForRaster[uuid];
    };

    scope.toggleShowAllCategories = function (uuid) {
      scope.legend.showAllCategoriesForRaster[uuid] =
        !scope.legend.showAllCategoriesForRaster[uuid];
    };

    scope.getAmountOfDiscreteCategories = function (uuid) {
      if (scope.legend.showAllCategoriesForRaster[uuid]) {
        return scope.totalCategoryCount(uuid);
      } else {
        return scope.legend.MAX_DISCRETE_CATEGORIES_DEFAULT;
      }
    };

    scope.hasMoreCategoriesAvailableThanDefault = function (uuid) {
      return scope.totalCategoryCount(uuid) >
        scope.legend.MAX_DISCRETE_CATEGORIES_DEFAULT;
    };

    scope.mustShowDiscreteLegend = function (uuid) {
      var layer = _.find(scope.state.layers, { uuid: uuid });
      if (layer === undefined) {
        if (scope.legend.data.discrete[uuid]) {
          delete scope.legend.data.discrete[uuid];
          scope.switchSelectedRaster(uuid);
        }
        return false;
      } else {
        return scope.rasterIsSelected(uuid) &&
          scope.legend.data.discrete[uuid] !== undefined;
      }
    };

    scope.mustShowContinuousLegend = function (uuid) {
      var layer = _.find(scope.state.layers, { uuid: uuid });
      if (layer === undefined) {
        if (scope.legend.data.continuous[uuid]) {
          delete scope.legend.data.continuous[uuid];
          scope.switchSelectedRaster(uuid);
        }
        return false;
      } else {
        return scope.rasterIsSelected(uuid) &&
          scope.legend.data.continuous[uuid] !== undefined &&
          scope.legend.data.continuous[uuid].min !== null &&
          scope.legend.data.continuous[uuid].max !== null;
      }
    };

    scope.getGradient = function (uuid) {

      if (scope.legend.data.continuous[uuid] === undefined ||
          scope.legend.data.continuous[uuid].colormap === null) { return;
      }
      var colorData = scope.legend.data.continuous[uuid].colormap.data;
      var rgba,
          colorString,
          suffix = "";

      angular.forEach(colorData, function (datum) {
        rgba = datum[1];
        colorString = "rgb(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + ")";
        suffix += colorString + ",";
      });

      suffix = suffix.substring(0, suffix.length - 1) + ")";

      var gradientValue0 = "background: linear-gradient(to top, "
        + suffix;
      var gradientValue1 = "background: -moz-linear-gradient(bottom, "
        + suffix;
      var gradientValue2 = "background: -webkit-linear-gradient(bottom, "
        + suffix;
      var gradientValue3 = "background: -ms-linear-gradient(bottom, "
        + suffix;


      return gradientValue0 + "; " + gradientValue1 + "; " + gradientValue2 +
        "; " + gradientValue3 ;
    };

    /* Een kaartje voor zowel continuous als discrete rasters ****************/

    scope.selectedRasterName = null;

    scope.getAllRasterUuids = function () {
      var allRasterNames = [];
      _.forEach(scope.legend.data.continuous, function (v, k) {
        if (scope.legend.data.continuous[k] !== undefined) {
          allRasterNames.push(k);
        }
      });
      _.forEach(scope.legend.data.discrete, function (v, k) {
        if (scope.legend.data.discrete[k] !== undefined) {
          allRasterNames.push(k);
        }
      });
      return allRasterNames;
    };

    scope.rasterIsSelected = function (uuid) {
      var allRasterUuids = scope.getAllRasterUuids();
      var layer = _.find(scope.state.layers, {uuid: uuid});
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

    scope.rasterIsVectorized = function (uuid) {
      var layer = _.find(scope.state.layers, {uuid: uuid});
      return !!layer.vectorized;
    };

    scope.switchSelectedRaster = function (uuid) {
      var allRasterUuids = scope.getAllRasterUuids();
      var currentIndex = allRasterUuids.indexOf(uuid);
      if (allRasterUuids.length !== 0) {
        var nextIndex = (currentIndex + 1) % allRasterUuids.length;
        scope.selectedRasterName = allRasterUuids[nextIndex];
      }
    };

    scope.setDiscreteRasterCategory = function (uuid, category) {
      LegendService.setActiveCategory(uuid, category);
    };

    scope.getColoredRect = function (datum) {
      return {
        "background-color": datum.color,
        "border": getBorderStyle(datum)
      };
    };

    scope.getDiscreteRasterCategory = function (uuid) {
      return LegendService.getActiveCategory(uuid);
    };

    scope.$watch(scope.state.toString('layers.active'), function (n, o) {
      if (n === o) { return; }
      LegendService.updateLegendData(
        scope.state.spatial.bounds,
        scope.state.layers
      );
    });

    scope.$watch('state.spatial.bounds', function (n, o) {
      if (n === o) { return; }
      LegendService.updateLegendData(n, scope.state.layers);
    });

    scope.$watch('state.temporal.at', function (n, o) {
      if (n === o) { return; }
      var temporalLayers = [];
      _.forEach(scope.state.layers, function (layer) {
        if (LegendService.rasterIsTemporal(layer.uuid)) {
          temporalLayers.push(layer);
        }
      });
      LegendService.updateLegendData(scope.state.spatial.bounds, temporalLayers);
    });

    scope.legend.data = LegendService.rasterData;

    LegendService.updateLegendData(
      scope.state.spatial.bounds,
      scope.state.layers
    );
  };


  return {
    link: link,
    restrict: 'E',
    scope: {
      state: '='
    },
    templateUrl: "legend/templates/legend.html",
    replace: true
  };
}]);
