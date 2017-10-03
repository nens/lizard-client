angular.module('dashboard')
.service('ChartCompositionService', ['$timeout', function ($timeout) {

  var service = this;
  service.composedCharts = {};

  var getNextChartIndex = function () {
    return Object.keys(service.composedCharts).length;
  };

  var intToString = function (n) {
    return "" + n;
  };

  var isEmpty = function () {
    return getNextChartIndex() === 0;
  };

  // TODO: this can be done more efficient
  var reorderComposedCharts = function (startIdx) {
    console.log("[F] reorderComposedCharts");
    // console.log("*** composedCharts (pre):", JSON.stringify(service.composedCharts));
    var reorderedComposedCharts = {},
        i = 0;
    _.forEach(service.composedCharts, function (v, k) {
      if (i++ < startIdx) {
        reorderedComposedCharts[k] = v;
      } else {
        reorderedComposedCharts[intToString(parseInt(k) - 1)] = v;
      }
    });
    service.composedCharts = reorderedComposedCharts;
    // console.log("*** composedCharts (post):", JSON.stringify(service.composedCharts));
  }

  this.getChartIndexForSelection = function (selectionUuid) {
    var chartIndex,
        selectionIndex;

    _.forEach(service.composedCharts, function (v, k) {
      selectionIndex = v.indexOf(selectionUuid);
      if (selectionIndex > -1) {
        chartIndex = parseInt(k);
      }
    });
    return chartIndex;
  }

  this.addSelection = function (chartIndex, selectionId) {
    console.log("[F] CCService.addSelection");
    var chartKey,
        chartValue;
    if (chartIndex === undefined) {
      // This will result in a single new cartesian plane with a single chart:
      chartKey = intToString(getNextChartIndex());
      chartValue = [];
    } else {
      // This will add a new chart to an existing cartesian plane:
      chartKey = intToString(chartIndex);
      chartValue = service.composedCharts[chartKey] || [];
    }
    chartValue.push(selectionId);
    service.composedCharts[chartKey] = chartValue;
    ///////////////////////////////////////////////////////////////////////////
    //this.debug(); /////////////////////////////////////////////////////////////
  };

  this.dragSelection = function (newChartIndex, selectionUuid) {
    console.log("[F] CCService.dragSelection");
    var oldChartIndex = service.getChartIndexForSelection(selectionUuid);
    console.log("*** oldChartIndex...:", oldChartIndex, "(type=" + (typeof oldChartIndex) + ")");
    console.log("*** newChartIndex...:", newChartIndex, "(type=" + (typeof newChartIndex) + ")");
    var result = {
      changed: false,
      mustActivateSelection: false,
      mustEmulateClick: false
    }

    if (getNextChartIndex() === 0) {
      console.log("AAAAAAAAAAAAAAA");
      // console.log("...returning early (because: no charts yet)!");
      // service.addSelection(undefined, selectionUuid);
      result.changed = true
      result.mustActivateSelection = true;
      result.mustEmulateClick = true;

    } else if (oldChartIndex === newChartIndex) {
      console.log("BBBBBBBBBBBBBBBBBBBBBBB");
      // console.log("...returning early (because: chart was dragged into itself)!");
      result.changed = false;
      result.mustActivateSelection = false;

    } else if (oldChartIndex !== undefined) {

      console.log("CCCCCCCCCCCCCCCCCCCCCCCCC");


      // if (newChartIndex === ....HIERRRRRRRRRRRRRRR)

      // if dragging an existing selection unto the *last* plot:

      if (newChartIndex === getNextChartIndex() - 1) {
        console.log("C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1C1")
        // console.log("DRAG TS INTO LAST PLOT");

        // service.removeSelection(selectionUuid);

        // $timeout(function () {
        //   service.addSelection(newChartIndex, selectionUuid);
        // });

        var countA = getNextChartIndex();
        removeSelectionFromSpecificPlot(oldChartIndex, selectionUuid);
        var countB = getNextChartIndex();

        if (countA === countB) {
          // No plots were deleted
          service.addSelection(newChartIndex, selectionUuid);
        } else {
          // One plot was deleted
          console.log("[!] Entering the DANGER ZONE...");
          service.addSelection(newChartIndex - 1, selectionUuid);
        }

        result.changed = true;
        result.mustActivateSelection = true;

      } else {
        console.log("C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2C2");
        var countA = getNextChartIndex();
        service.removeSelection(selectionUuid);
        var countB = getNextChartIndex();

        console.log("[!!!] countA:", countA);
        console.log("[!!!] countB:", countB);
        console.log("[!!!] oldChartIndex:", oldChartIndex);
        console.log("[!!!] newChartIndex:", newChartIndex);

        if (countA === countB) {
          console.log("[!!!] countA === countB");
          service.addSelection(newChartIndex, selectionUuid);
        } else if (countA === countB + 1) {
          console.log("[!!!] countA === countB + 1... TODO");

          var correctedChartIndex;
          // if (oldChartIndex <= countB) {
          if (oldChartIndex < newChartIndex) {
            console.log("[!!!] case 1; chartindex--");
            correctedChartIndex = newChartIndex - 1;
            // service.addSelection(newChartIndex - 1, selectionUuid);
          } else {
            console.log("[!!!] case 2; chartindex remains the same");
            correctedChartIndex = newChartIndex;
            // service.addSelection(newChartIndex, selectionUuid);
          }
          console.log("[!!!] correctedChartIndex:", correctedChartIndex);
          service.addSelection(correctedChartIndex, selectionUuid);

        } else {
          console.error("[!!!] This should never print");
        }

        result.changed = true;
        result.mustActivateSelection = false;
      }

    } else {

      console.log("DDDDDDDDDDDDDDDDDDDDDDDDDD");

      if (newChartIndex !== undefined) {
        var selections = service.composedCharts[intToString(newChartIndex)]
        selections = selections || [];
        selections.push(selectionUuid);
      } else {
        console.error("An unexpected error; it's such a drag");
      }
    }

    service.debug()
    return result;
  };

  var removeSelectionFromSpecificPlot = function (chartIndex, selectionUuid) {
    console.log("[F] removeSelectionFromSpecificPlot");
    // console.log("*** chartIndex:", chartIndex);
    // console.log("*** selectionUuid:", selectionUuid);

    var composedChart = service.composedCharts[intToString(chartIndex)];
    if (composedChart === undefined) {
      console.error("[E] @removeSelectionFromSpecificPlot: plot #" + chartIndex + " is empty");
    } else {
      var selectionIndex = composedChart.indexOf(selectionUuid);
      if (selectionIndex === -1) {
        console.error("[E] @removeSelectionFromSpecificPlot: plot #" + chartIndex + " does not have selection with uuid " + selectionUuid);
      } else {
        composedChart.splice(selectionIndex, 1);
        if (composedChart.length === 0) {
          delete service.composedCharts[chartIndex];
          reorderComposedCharts(chartIndex);
        }
      }
    }
    //service.debug();
  }

  this.removeSelection = function (selectionUuid) {
    console.log("[F] CCService.removeSelection");
    var selectionIndex,
        someSelectionWasRemoved = false;
    _.forEach(service.composedCharts, function (v, k) {
      selectionIndex = v.indexOf(selectionUuid);
      if (selectionIndex > -1) {
        v.splice(selectionIndex, 1);
        someSelectionWasRemoved = true;
        if (v.length === 0) {
          delete service.composedCharts[k];
          reorderComposedCharts(parseInt(k));
        }
      }
    });
    if (!someSelectionWasRemoved) {
      console.error("Selection not found! Could not remove selection with uuid =", selectionUuid);
    }
    ///////////////////////////////////////////////////////////////////////////
    //this.debug(); /////////////////////////////////////////////////////////////
  };

  this.debug = function () {
    console.log(">>> DEBUG <<<");
    console.log("composedCharts =", JSON.stringify(service.composedCharts));
  }

}]);