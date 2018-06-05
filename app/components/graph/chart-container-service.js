/**
 *
 *
 */
angular.module('lizard-nxt')
  .factory('ChartContainer', ['NxtD3', function (NxtD3) {

  var DEFAULT_GREEN = '#16a085';

  var defaultKeys = {
    x: 'timestamp',
    y: 'value'
  };

  function addSurfaceLevelToThresholds (thresholds) {
    var detectedSurfaceLevel = null,
        referenceFrame,
        assetName;

    _.forEach(thresholds, function (v, k) {
      if (detectedSurfaceLevel === null && v.surface_level) {
        detectedSurfaceLevel = v.surface_level;
        referenceFrame = v.reference_frame;
        try {
          assetName = v.name.split(":")[0];
        } catch (e) {
          assetName = "Asset";
        }
      }
    });

    if (detectedSurfaceLevel) {
      thresholds.push({
        name: assetName + ": surface level",
        reference_frame: referenceFrame,
        surface_level: detectedSurfaceLevel,
        value: detectedSurfaceLevel
      });
    }

    return thresholds;
  }

  function mergeOverlappingThresholds (thresholds) {
    var overlappingThresholds = [],
        nonOverlappingThresholds = [],
        th0,
        th1;

    // Get overlapping thresholds (contains double occurrences):
    for (var i = 0; i < thresholds.length; i++) {
      th0 = thresholds[i];
      for (var j = i + 1; j < thresholds.length; j++) {
        th1 = thresholds[j];
        if (th0.value === th1.value) {
          overlappingThresholds.push(th0, th1);
        }
      }
    }

    // remove double occurrences from overlapping thresholds:
    overlappingThresholds = _.uniqBy(overlappingThresholds, 'name');

    // If no doubles were found, we're done and we can return all of the
    // thresholds:
    if (overlappingThresholds.length === 0) {
      return thresholds;
    }

    // Get complement for overlapping thresholds, i.e. the non-overlapping
    // thresholds:
    thresholds.forEach(function (th) {
      if (overlappingThresholds.indexOf(th) === -1) {
        nonOverlappingThresholds.push(th);
      }
    });

    // Merge the overlapping thresholds, i.e. build a single one with a single,
    // merged name:
    var mergedName;
    try {
      mergedName = overlappingThresholds[0].name.split(":")[0] + ":";
    } catch (e) {
      mergedName = "Asset:";
    }

    var varPart;
    for (i = 0; i < overlappingThresholds.length; i++) {
      try {
        varPart = overlappingThresholds[i].name.split(":")[1];
      } catch (e) {
        varPart = "...";
      }

      if (i < overlappingThresholds.length - 1) {
        varPart += " + ";
      } else {
        varPart += " ";
      }

      mergedName += varPart;
    }

    overlappingThresholds[0].name = mergedName;
    nonOverlappingThresholds.push(overlappingThresholds[0]);
    return nonOverlappingThresholds;
  }

  /**
   * Charts are are small objects that are drawn on the graph canvas
   * They are a way to keep track of all of the lines or that are being drawn.
   *
   * NOTE: this might have to change because the api of graphs is crappy
   *
   * It should be something like this:
   * <graph>
   *  <line data="data" etc.. </line>
   * </graph>
   *
   * For now this is a way to keep track of the scales, domains and xy's of the graph
   */
    function ChartContainer (chartContent) {
      this.id = chartContent.id;
      this.keys = chartContent.keys || defaultKeys;
      this.color = chartContent.color || DEFAULT_GREEN;
      this.unit = chartContent.unit;

      this.reference_frame = chartContent.reference_frame;

      if (chartContent.thresholds) {
        var newThresholds = addSurfaceLevelToThresholds(chartContent.thresholds);
        this.thresholds = mergeOverlappingThresholds(newThresholds);
      }

      this.description = chartContent.description;
      this.labels = chartContent.labels;

      this.setContentUpdateY(chartContent);

      return;
  }

  ChartContainer.prototype.setContentUpdateY = function (chartContent) {
    this.data = chartContent.data;
    this.keys = chartContent.keys || defaultKeys;
    this.color = chartContent.color || DEFAULT_GREEN;
    this.unit = chartContent.unit;
    this.yMaxMin = NxtD3.prototype._maxMin(this.data, this.keys.y);
  };

  return ChartContainer;

}]);
