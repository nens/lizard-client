'use strict';


/**
 * @ngdoc directive
 * @class graph
 * @memberof app
 * @name graph
 * @requires Graph
 * @summary Creates a Graph, adds it to the graphCtrl and watches data to
 *          call graphCtrl.updateGraph.
 * @description  Usage: <graph <type> <attrs></graph>
 *               Angular runs graph.graphCtrl, graph.compile.preCompile,
 *               <type directive>.link, graph.link. It sets up a graph
 *               object and puts it on the graphCtrl for further
 *               modifications by the subdirectives.
 */
angular.module('lizard-nxt')
  .directive('graph', ["Graph", function (Graph) {

  /**
   * @function
   * @memberOf graph
   * @param {scope}     scope     local scope
   * @param {object}    element
   * @param {object}    attrs     data, keys, labels and now
   * @param {object}    graphCtrl controller
   * @description       sets up a graph on the controller after
   *                    the controller's instantiation, but before
   *                    the link. Dimensions have sensible defaults
   *                    that may be partially overwritten by setting
   *                    the dimensions attribute of the graph.
   */
  var preCompile = function (scope, element, attrs, graphCtrl) {
    /*
                       dimensions.width
                               |
                     |         ^             |
                      ______________________  _
                     |   |                  |
                     | y |   Chart area     |
                     |___|__________________|  }- Dimensions.height
                     |   |     x axis       |
    padding.bottom-- |___|_____x label______| _
                       |
                  padding.left

    Labels are placed next to the edge of the svg, remaining padding
    space is available for the axis tick marks.
    */

    var dimensions, el;

    dimensions = {
      width: 375,
      height: 160,
      padding: {
        top: 5,
        right: 5,
        bottom: 50,
        left: 50
      }
    };
    // Overwrite anything provided by dimensions attr on element
    angular.extend(dimensions, scope.dimensions);

    el = element.find('svg')[0];

    graphCtrl.yfilter = attrs.yfilter;
    graphCtrl.type = attrs.type;

    // Create the graph and put it on the controller
    graphCtrl.graph = new Graph(
      el,
      dimensions,
      scope.temporal
    );
  };

  /**
   * @function
   * @memberOf graph
   * @param {scope}     scope     local scope
   * @param {object}    element
   * @param {object}    attrs     data, keys, labels and now
   * @param {object}    graphCtrl controller
   * @description       Contains listeners to values on the element
   *                    and calls the updateFunctions of the graphCtrls
   *                    on the graphs. Suddirectives only have to implement
   *                    an update function on their controller.
   */
  var link = function (scope, element, attrs, graphCtrl) {

    var graphUpdateHelper = function () {
      if (scope.content) {
        console.log('[F] graphUpdateHelper scope.content', scope.content);
        graphCtrl.setData(scope);
      }
      else if (scope.data) {
        console.log('[F] graphUpdateHelper scope.data', scope.data);
        graphCtrl.setFormattedContent(scope);
      }
      
      // if no data is available in specified timeframe, then 
      // the user should see text appear in the charts;
      // "No data available i this timeframe"
      // See Jira:
      // https://nelen-schuurmans.atlassian.net/browse/PROJ-471
      // we assume that when no data is available the data is an empty array
      
      // always remove previous text
      graphCtrl.graph.setDisplayTextChartBody("");
      if (
        (scope.content && !graphCtrl.graph.hasContentToDisplay(scope.content)) ||
        (scope.data && scope.data.length === 0)
      ) {
        graphCtrl.graph.setDisplayTextChartBody("No data available in this timeframe");
      } 

      // UpdateData is called with temporal.timelineMoving to draw subset for
      // performance reasons.
      graphCtrl.updateData.call(
        graphCtrl.graph,
        graphCtrl.content,
        graphCtrl.temporal,
        scope.temporal && scope.temporal.timelineMoving
      );

      // Call the graph with the now
      if (scope.temporal && scope.temporal.at) {
        graphCtrl.updateNow.call(graphCtrl.graph, scope.temporal.at);
      }
    };

    var dimsChangedCb = function () {
      if (!scope.dimensions
        || (scope.dimensions.width === graphCtrl.graph.dimensions.width
          && scope.dimensions.height === graphCtrl.graph.dimensions.height)) {
        return;
      }
      graphCtrl.graph.resize(scope.dimensions);
      graphUpdateHelper();
    };

    /**
     * Calls updateGraph when data is different than controller.content.
     * NOTE: Controller data is set on precompile.
     */
    var contentWatch = scope.$watch('content', function (n, o) {
      if (scope.data) {
        contentWatch();
        return;
      }
      graphUpdateHelper();
    }, true);

    /**
     * Support legacy single line graph api. Restructure data, and follow normal
     * flow throug content watch ^.
     */
    var dataWatch = scope.$watch('data', function (n, o) {
      if (scope.content) {
        dataWatch();
        return;
      }
      graphUpdateHelper();
    }, true);

    scope.$watch('temporal.at', function (n, o) {
      if (n === o) { return true; }
      if (scope.temporal && scope.temporal.at) {
        graphCtrl.updateNow.call(graphCtrl.graph, scope.temporal.at);
      }
    });

    scope.$watch('temporal.start', function (n, o) {
      if (n === o) { return true; }
      graphUpdateHelper();
    });

    scope.$watch('temporal.end', function (n, o) {
      if (n === o) { return true; }
      graphUpdateHelper();
    });

    scope.$watch('dimensions.height', dimsChangedCb);

    scope.$watch('dimensions.width', dimsChangedCb);

    /**
     * Destroy graph to remove listeners when scope is erased.
     */
    scope.$on('$destroy' , function () { graphCtrl.graph.destroy(); });

    scope.title = attrs.name;
  };

  /**
   * @function
   * @memberOf graph
   * @param {scope}     $scope    local scope
   * @param {Graph}     Graph     graph service
   * @description       Stores the graph directives data and update functions
   */
  var graphCtrl = function ($scope, Graph) {
    this.setData = function (scope) {
      // Provide defaults for backwards compatability
      this.content = scope.content || [];
      this.temporal = scope.temporal;
    };

    /**
     * Support legacy graph api. Formats scope.data, scope.labels and scope.keys
     * to a scope.content object with a single graph object.
     */
    this.setFormattedContent = function (scope) {
      this.temporal = scope.temporal;
      this.content = [{
        id: 1, // Give an arbitrary id to identify chart in multi line.
        data: scope.data,
        unit: scope.ylabel,
        xLabel: scope.xlabel,
        keys: {
          x: (scope.keys && scope.keys.x) || 0,
          y: (scope.keys && scope.keys.y) || 1
        }
      }];

    };

    if ($scope.content) {
      this.setData($scope);
    }
    // Support legacy graph api
    else if ($scope.data) {
      this.setFormattedContent($scope);
    }

    this.graph = {};
    this.yfilter = '';
    this.now = $scope.temporal ? $scope.temporal.at : undefined;
    this.type = '';
    this.quantity = $scope.quantity || 'time';

    this.mouseloc = $scope.mouseloc || undefined;

    // Define data update function in attribute directives
    this.updateData = function () {};
    // Define timeState.now update function in attribute directives
    this.updateNow = function () {};
  };


  return {
    controller: graphCtrl,
    compile: function (scope, element, attrs, graphCtrl) {
      return {
        pre: preCompile,
        post: link
      };
    },
    scope: {
      content: '=?',

      mouseloc: '=?',
      yfilter: '=',
      dimensions: '=',
      temporal: '=',

      // Legacy, use list of graph datasets in content. This is for line and
      // other old graphs.
      data: '=?',
      xlabel: '=?',
      ylabel: '=?',
      keys: '=?'
    },
    restrict: 'E',
    replace: true,
    templateUrl: 'graph/graph.html'
  };

}]);


/**
 * @ngdoc directive
 * @class graph
 * @memberof graph
 * @name line
 * @requires graph
 * @description       Draws a line. Additionally it sets the
 *                    location of the users mouse on the parent
 *                    scope. It was initially written for the
 *                    interction and maaiveldcurve.
 * @TODO: enhance its functionality to draw timeseries.
 */
angular.module('lizard-nxt')
  .directive('line', [function () {

  var link = function (scope, element, attrs, graphCtrl) {
    var content = graphCtrl.content,
        graph = graphCtrl.graph,
        temporal = graphCtrl.type === 'temporal',
        drawSubset = false;

    graph.drawLine(content, temporal, drawSubset);

    // fugly ass hackery. This is a sacrifice to Baal for
    // letting the 'bolletje' run loose and creating havock
    // and mayhem all around itself
    // the initiator of this heinous feature is too be blamed.
    //
    // The mouseOnLine in the state is being set to get this to work.
    var watchMouse = scope.$watch('mouseloc', function (n) {
      if (n) {
        graph.drawCircleOnLine(n);
      }
    });

    scope.$on('$destroy', function () {
      var remove = true;
      watchMouse();
      graph.drawCircleOnLine(null, remove);
    });

    if (temporal) {
      graph.drawNow(graphCtrl.now);
      // Function to call when timeState.at changes
      graphCtrl.updateNow = graph.drawNow;
    }

    // Function to call when data changes
    graphCtrl.updateData = graph.drawLine;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };
}]);


/**
 * @ngdoc directive
 * @class graph
 * @memberof graph
 * @name barChart
 * @requires graph
 * @description       Draws a barchart. With dynamic axis label.
 *                    Initially written for the rain graph.
 */
angular.module('lizard-nxt')
  .directive('barChart', ['$filter', function ($filter) {

  var link = function (scope, element, attrs, graphCtrl) {

    var content = graphCtrl.content,
        filter = graphCtrl.yfilter,
        graph = graphCtrl.graph,
        quantity = graphCtrl.quantity;

    graph.drawBars(content, quantity);
    graph.drawNow(graphCtrl.now);

    // Function to call when data changes
    graphCtrl.updateData = function (content, temporal) {
      this.drawBars(content, quantity);
    };

    // Function to call when timeState.at changes
    graphCtrl.updateNow = graph.drawNow;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };

}]);


/**
 * @ngdoc directive
 * @class graph
 * @memberof graph
 * @name horizontal stack
 * @requires graph
 * @description       Draws a barchart. With dynamic axis label.
 *                    Initially written to substitute the landuse donut.
 */
angular.module('lizard-nxt')
  .directive('horizontalStack', [function () {

  var link = function (scope, element, attrs, graphCtrl) {

    var graph = graphCtrl.graph;

    graph.drawHorizontalStack(graphCtrl.content);
    // Function to call when data changes
    graphCtrl.updateData = graph.drawHorizontalStack;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };

}]);


/**
 * Creates a specific line and point graph for levee crosssections.
 *
 * Content should contain property line for elevation data and the property
 * points for timeseries values of wells.
 */
angular.module('lizard-nxt')
.directive('crossSection', [function () {
  var link = function (scope, element, attrs, graphCtrl) {

    var content = graphCtrl.content,
        graph = graphCtrl.graph;

    graph.drawCrosssection(content);

    // Function to call when data changes
    graphCtrl.updateData = graph.drawCrosssection;

    };

    return {
      require: 'graph',
      link: link,
      restrict: 'A'
    };

  }
]);
