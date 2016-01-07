
angular.module('dashboard')
  .directive('dashboard',
             [
              'EventAggregateService',
              'State',
              'DataService',
              'UtilService',
              'Timeline',
              'TimeseriesService',
              function (
                EventAggregateService,
                State,
                DataService,
                UtilService,
                Timeline,
                TimeseriesService) {

  var link = function (scope, element, attrs) {

    var TL_TOP_MARGIN = 25, // margin plus the temporal.at label
        GRAPH_PADDING = 8,
        GRAPH_5_6th_PADDING_RATIO = 0.83, // The other 6th is used in the css.
        tlDims = {},
        nGraphs = 1;


    var getWidth = function () {
      return element.find('.dashboard-inner').width();
    };


    var getHeight = function () {
      return element.height();
                                    // min-height from top row, we need to make
                                    // this dynamic or bigger when we are going
                                    // to use the top row for maps etc.
    };

    var resize = function (tlDimensions) {
      tlDims = tlDimensions;
      nGraphs = Object.keys(scope.dashboard.content).length;
      scope.dashboard.dims.height =
        (getHeight() - tlDimensions.height - TL_TOP_MARGIN) / nGraphs - GRAPH_PADDING;

      scope.dashboard.dims.width = UtilService.getCurrentWidth() - UtilService.OMNIBOX_WIDTH
        + GRAPH_5_6th_PADDING_RATIO * UtilService.TIMELINE_LEFT_MARGIN;
    };

    scope.dashboard.dims = {
      width: UtilService.getCurrentWidth() - UtilService.OMNIBOX_WIDTH
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

      item = response;

      item.data = response.data || response.events;

      item.aggWindow = State.temporal.aggWindow;
      scope.dashboard.content[response.layerSlug] = item;

      resize(tlDims);

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
      var graphWidth = scope.dashboard.dims.width -
        scope.dashboard.dims.padding.left -
        scope.dashboard.dims.padding.right;

      State.selected.assets.forEach(function (item) {
        TimeseriesService.getTimeSeriesForObject(
              item,
              State.temporal.start,
              State.temporal.end,
              graphWidth // last arg was defer... is that important?
              ).then(function (response) {
          angular.forEach(response.results, function (ts) {
            ts.layerSlug = ts.uuid;
            ts.name = ts.location.name
              + ', '
              + ts.parameter_referenced_unit.parameter_short_display_name;
            ts.unit = ts
              .parameter_referenced_unit
              .referenced_unit_short_display_name;
            ts.type = 'timeseries';
            putDataOnScope(ts);
          });
        });
      });

      State.selected.geometries.forEach(function (geom) {
        DataService.getData('dashboard', {
          geom: geom,
          start: State.temporal.start,
          end: State.temporal.end,
          minPoints: graphWidth,
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
          if (response.layerSlug === 'waterchain_grid') {
            return;

            // Currently events for point and area and timeseries for point are
            // supported.
          } else {
            if (response.type === 'Event') {
              putEventDataOnScope(response);
            } else if (State.box.type === 'point' && response.type !== 'Event') {
              putDataOnScope(response);
            }
          }

        });
      });
    };

    getTimeData();

    /**
     * Updates dashboard when time zoom changes.
     */
    scope.$watch(State.toString('temporal.timelineMoving'), function (n, o) {
      if (n === o || State.temporal.timelineMoving) { return true; }
      getTimeData();
    });

    var applyResize = function () {
      scope.$apply(resize(tlDims));
      getTimeData();
    };

    Timeline.onresize = resize;

    window.addEventListener('resize', applyResize);

    scope.$on('$destroy', function () {
      window.removeEventListener('resize', applyResize);
    });

  };

  return {
    link: link,
    templateUrl: 'dashboard/dashboard.html',
    replace: true,
    restrict: 'E'
  };

}]);
