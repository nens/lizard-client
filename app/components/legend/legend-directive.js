angular.module('legend')
.directive('legend', ["MapService", "LegendService", "DataService", function(MapService, LegendService, DataService) {

  var link = function (scope, element, attrs) {

    scope.dataLayers = DataService.dataLayers;
    scope.$watch("dataLayers", function (n, o) {
      if (n === o) { return; }
      console.log('scope.state.layers 52346', scope.state.layers);
      LegendService.updateLegendData(
        scope.state.spatial.bounds,
        scope.state.geometries,
        scope.state.layers
      );
    }, true);

    /* scope variables used for DISCRETE rasters: ****************************/
    if (scope){
      // console.log(scope);// not really helpful
      console.log(scope.state.layers);//nr [6]
    }
    // console.log(MapService);
    // console.log(LegendService.uuidMapping);// alleen landgebruik, geen dwarsprofielen
    scope.legend = {
      MAX_DISCRETE_CATEGORIES_DEFAULT: 5,
      showAllCategoriesForRaster: {},
      selectedDiscreteRasterName: null,
      uuidMapping: LegendService.uuidMapping,
      data: {
        discrete: {},
        continuous: {},
      },
      wms: {}
    };
    // if (scope){console.log(scope.legend)}; // undefined
    scope.uuidOrganisationMapping = LegendService.uuidOrganisationMapping;
    scope.hasData = function () {
      for (var key in scope.legend.data.discrete) {
        return true;
      }
      for (var key2 in scope.legend.data.continuous) {
        return true;
      }
      for (var key3 in scope.legend.wms) {
        return true;
      }
      return false;
    };
    // console.log(scope);
    // if (scope){console.log(scope.legend)}; // undefined

    var getBorderStyle = function (datum) {
      return datum.label === -1 ? "1px solid #ccc" : "0";
    };

    scope.toggleVectorModus = function (uuid) {
      var layer = _.find(scope.state.layers, {uuid: uuid});
      // console.log(layer);
      layer.vectorized = !layer.vectorized;
      MapService.updateLayers([layer]);
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
      console.log("mustShowDiscreteLegend");
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

    var _getBrowserType = function () {
      var userAgent = window.navigator.userAgent;
      var REGEX = {
        'mozillaEdge': /Mozilla/i,
        'gecko': /Gecko/i,
        'webkit': /Webkit/i,
      };

      if (userAgent.match(REGEX.mozillaEdge)) {
        return 'edge';
      } else if (userAgent.match(REGEX.gecko)) {
        return 'mozilla';
      } else if (userAgent.match(REGEX.webkit)) {
        return 'webkit';
      }
    };

    scope.getGradient = function (uuid) {

      if (scope.legend.data.continuous[uuid] === undefined ||
          scope.legend.data.continuous[uuid].colormap === null) {
        return;
      }
      var colorData = scope.legend.data.continuous[uuid].colormap.data,
          gradientValuePrefix,
          rgba,
          colorString,
          suffix = "";

      angular.forEach(colorData, function (datum) {
        rgba = datum[1];
        colorString = "rgb(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + ")";
        suffix += colorString + ",";
      });

      suffix = suffix.substring(0, suffix.length - 1) + ")";

      switch (_getBrowserType()) {
        case 'mozilla':
          gradientValuePrefix = "-moz-linear-gradient(bottom, ";
          break;
        case 'webkit':
          gradientValuePrefix = "-webkit-linear-gradient(bottom, ";
          break;
        default:  // case mozillaEdge
          // NB! M$ Edge and new mozilla use the "generic" CSS3 gradient syntax
          gradientValuePrefix = "linear-gradient(to top, ";
      }

      return {
        background: gradientValuePrefix + suffix
      };
    };

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

    scope.$watch(scope.state.toString('layers'), function (n, o) {
      if (n === o) { return; }
      console.log(scope.state.layers); //geen legendUrl
      console.log("scope.legend in layer watcher ", scope.legend);
      // Toggle the wms layer in the legend when you toggle the wmslayer
      scope.legend.wms = LegendService.wmsData.wms;
      LegendService.updateLegendData(
        scope.state.spatial.bounds,
        scope.state.geometries,
        scope.state.layers
      );
    });

    scope.$watch(scope.state.toString('geometries'), function (n, o) {
      if (n === o) { return; }

      LegendService.updateLegendData(
        scope.state.spatial.bounds,
        scope.state.geometries,
        scope.state.layers);
    });

    scope.$watch('state.spatial.bounds', function (n, o) {
      if (n === o) { return; }
      LegendService.updateLegendData(
        n,
        scope.state.geometries,
        scope.state.layers
      );
    });

    scope.$watch('state.temporal.at', function (n, o) {
      if (n === o) { return; }
      var temporalLayers = [];
      _.forEach(scope.state.layers, function (layer) {
        if (LegendService.rasterIsTemporal(layer.uuid)) {
          temporalLayers.push(layer);
        }
      });
      LegendService.updateLegendData(
        scope.state.spatial.bounds,
        scope.state.geometries,
        temporalLayers);
    });

    console.log("LegendService.wmsData 456", LegendService.rasterData);
    scope.legend.data = LegendService.rasterData;
    console.log("LegendService.wmsData 123", LegendService.wmsData);
    // Show the wms legend in the omnibox when you refresh the page
    // or when you add the wms layer.
    scope.legend.wms = LegendService.wmsData.wms;//scope.legend.wmsData

    LegendService.updateLegendData(
      scope.state.spatial.bounds,
      scope.state.geometries,
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
