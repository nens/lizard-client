
angular.module('time-ctx')
  .directive('timeCtx',
             ["EventAggregateService", "State", "DataService", "UtilService", "Timeline",
              function (EventAggregateService, State, DataService, UtilService, Timeline) {

  var link = function (scope, element, attrs) {

    var TL_TOP_MARGIN = 10,
        GRAPH_PADDING = 5,
        tlDims = {},
        nGraphs = 1;


    var getWidth = function () {
      return element.find('.dashboard-inner').width();
    };


    var getHeight = function () {
      return element.height() - 50; // min-height from top row
    };

    var resize = function (tlDimensions) {
      tlDims = tlDimensions;
      nGraphs = Object.keys(scope.tctx.content).length;
      scope.tctx.dims.height =
        (getHeight() - tlDimensions.height - TL_TOP_MARGIN) / nGraphs - GRAPH_PADDING;
    };

    Timeline.onresize = resize;

    scope.tctx.dims = {
      width: UtilService.getCurrentWidth() + 0.83 * UtilService.TIMELINE_LEFT_MARGIN,
      height: getHeight() / nGraphs,
      padding: {
        top: GRAPH_PADDING,
        right: 0,
        bottom: 2 * GRAPH_PADDING, // Enough for the line of the axis.
        left: 0.83 * UtilService.TIMELINE_LEFT_MARGIN
      }
    };


    var putDataOnScope = function (response) {

        scope.tctx.content[response.layerSlug] = {};

        scope.tctx.content[response.layerSlug].data = response.data || response.events;

        var sharedKeys = [
          'format',
          'scale',
          'quantity',
          'unit',
          'color',
          'type'
        ];

        angular.forEach(sharedKeys, function (key) {
          scope.tctx.content[response.layerSlug][key] = response[key];
        });

    };


    var geom = State.box.type === 'area'
      ? State.spatial.bounds
      : State.box.type === 'line'
        ? State.spatial.points
        : State.spatial.here;

    var getTimeData = function () {
      DataService.getData('time', {
        geom: geom,
        start: State.temporal.start,
        end: State.temporal.end,
        temporalOnly: true
      }).then(null, null, function (response) {

        if (response.layerSlug === 'waterchain_grid'
          || response.layerSlug === 'rrc') {
          return;
        } else if (response.layerSlug === 'timeseries') {
          angular.forEach(response.data, function (ts) {
            ts.layerSlug = ts.name;
            putDataOnScope(ts);
          });
        } else {
          putDataOnScope(response);
        }

        if (tlDims) {
          resize(tlDims);
        }

        console.log(scope.tctx.content);

      });
    };

    getTimeData();
    /**
     * Updates time-ctx when time zoom changes.
     */
    scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o || State.temporal.timelineMoving) { return true; }
      console.log('new shit');
      getTimeData();
    });

  };

  return {
    link: link,
    templateUrl: 'time-ctx/time-ctx.html',
    replace: true,
    restrict: 'E'
  };

}]);
