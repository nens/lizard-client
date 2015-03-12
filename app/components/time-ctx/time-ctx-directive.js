
angular.module('time-ctx')
  .directive('timeCtx',
             ["EventAggregateService", "State", "DataService", "UtilService", "Timeline",
              function (EventAggregateService, State, DataService, UtilService, Timeline) {

  var link = function (scope, element, attrs) {

    var TL_TOP_MARGIN = 20, // margin plus the temporal.at label
        GRAPH_PADDING = 5,
        GRAPH_5_6th_PADDING_RATIO = 0.83, // The other 6th is used in the css.
        TOP_ROW_MIN_HEIGHT = 50,
        tlDims = {},
        nGraphs = 1;


    var getWidth = function () {
      return element.find('.dashboard-inner').width();
    };


    var getHeight = function () {
      return element.height() - TOP_ROW_MIN_HEIGHT;
                                    // min-height from top row, we need to make
                                    // this dynamic or bigger when we are going
                                    // to use the top row for maps etc.
    };

    var resize = function (tlDimensions) {
      tlDims = tlDimensions;
      nGraphs = Object.keys(scope.tctx.content).length;
      scope.tctx.dims.height =
        (getHeight() - tlDimensions.height - TL_TOP_MARGIN) / nGraphs - GRAPH_PADDING;
    };

    Timeline.onresize = resize;

    scope.tctx.dims = {
      width: UtilService.getCurrentWidth()
        + GRAPH_5_6th_PADDING_RATIO * UtilService.TIMELINE_LEFT_MARGIN,
      height: getHeight() / nGraphs,
      padding: {
        top: GRAPH_PADDING,
        right: 0,
        bottom: 2 * GRAPH_PADDING, // Enough for the line of the axis.
        left: GRAPH_5_6th_PADDING_RATIO * UtilService.TIMELINE_LEFT_MARGIN
      }
    };


    var putDataOnScope = function (response) {

      var item = {};
      item.data = response.data || response.events;

      var sharedKeys = [
        'format',
        'scale',
        'quantity',
        'unit',
        'color',
        'type'
      ];

      angular.forEach(sharedKeys, function (key) {
        item[key] = response[key];
      });

      scope.tctx.content[response.layerSlug] = item;

    };

    var putEventDataOnScope = function (response) {

      if (response.data) {
        var lg = DataService.layerGroups[response.layerGroupSlug];
        // aggregate response
        var eventAgg = {
          data: EventAggregateService.aggregate(
            response.data,
            State.temporal.aggWindow,
            lg.mapLayers[0].color
          ),
          unit: lg.name,
        };

        // TODO: remove this ifje and do something with the graph to accomadate
        // datasets smaller than 2.
        if (eventAgg.data.length > 1) {
          putDataOnScope(angular.extend(response, eventAgg));
        }


      }

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
        temporalOnly: true // TODO: actually implement this in data-service.
      }).then(null, null, function (response) {

        // TODO 1: prune this tree.. We need to request waterchain in order
        // to get timeseries from dataservice. This needs to change.
        //
        // TODO 2: We want to be able to use a filter to request only the
        // temporal data.
        //
        // TODO 3: Remove box filtering, always show all the data
        //
        if (response.layerSlug === 'waterchain_grid'
          || response.layerSlug === 'rrc') {
          return;

        } else if (response.layerSlug === 'timeseries') {
          angular.forEach(response.data, function (ts) {
            ts.layerSlug = ts.name;
            putDataOnScope(ts);
          });
        } else {
          if (response.type === 'Event') {
            putEventDataOnScope(response);
          } else if (State.box.type === 'point' && response.type !== 'Event') {
            putDataOnScope(response);
          }
        }

        if (tlDims) {
          resize(tlDims);
        }

      });
    };

    getTimeData();

    /**
     * Updates time-ctx when time zoom changes.
     */
    scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o || State.temporal.timelineMoving) { return true; }
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
