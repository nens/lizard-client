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

  var graphCtrl, preCompile, link;

  /**
   * @function
   * @memberOf angular.module('lizard-nxt')
  .graph
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
  preCompile = function (scope, element, attrs, graphCtrl) {
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

    el = element[0].firstChild;

    graphCtrl.yfilter = attrs.yfilter;
    graphCtrl.type = attrs.type;

    // Create the graph and put it on the controller
    graphCtrl.graph = new Graph(el, dimensions);
  };

  /**
   * @function
   * @memberOf angular.module('lizard-nxt')
  .graph
   * @param {scope}     scope     local scope
   * @param {object}    element
   * @param {object}    attrs     data, keys, labels and now
   * @param {object}    graphCtrl controller
   * @description       Contains listeners to values on the element
   *                    and calls the updateFunctions of the graphCtrls
   *                    on the graphs. Suddirectives only have to implement
   *                    an update function on their controller.
   */
  link = function (scope, element, attrs, graphCtrl) {

    /**
     * Calls updateGraph when data changes.
     */
    scope.$watch('data', function (n, o) {
      if (n === o) { return true; }
      graphCtrl.setData(scope);
      // Call graph with the new data
      graphCtrl.updateData.call(graphCtrl.graph, graphCtrl.data, graphCtrl.keys, graphCtrl.labels);
      // Call the graph with the now
      graphCtrl.updateNow.call(graphCtrl.graph, scope.now);
    });

    scope.$watch('now', function (n, o) {
      if (n === o) { return true; }
      graphCtrl.updateNow.call(graphCtrl.graph, scope.now);
    });

  };

  /**
   * @function
   * @memberOf angular.module('lizard-nxt')
  .graph
   * @param {scope}     $scope    local scope
   * @param {Graph}     Graph     graph service
   * @description       Stores the graph directives data and update functions
   */
  graphCtrl = function ($scope, Graph) {

    this.setData = function (scope) {

      // Provide defaults for backwards compatability
      this.data = scope.data || [];
      this.keys = scope.keys || {x: 0, y: 1};
      this.labels = {
        x: scope.xlabel || '',
        y: scope.ylabel || ''
      };
    };

    this.setData($scope);

    this.graph = {};
    this.yfilter = '';
    this.now = $scope.now;
    this.type = '';

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
      data: '=',
      xlabel: '=',
      ylabel: '=',
      keys: '=',
      yfilter: '=',
      now: '=',
      dimensions: '='
    },
    restrict: 'E',
    replace: true,
    template: '<div class="graph-svg-wrapper"><svg></svg></div>'
  };

}]);


/**
 * @ngdoc directive
 * @class graph
 * @memberof angular.module('lizard-nxt')
  .graph
 * @name donut
 * @requires graph
 * @description       Draws a donut graph. Currently not in use by nxt.
 */
angular.module('lizard-nxt')
  .directive('donut', [function () {

  var link = function (scope, element, attrs, graphCtrl) {

    var graph = graphCtrl.graph;

    graph.drawDonut(graphCtrl.data);
    // Function to call when data changes
    graphCtrl.updateData = graph.drawDonut;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A',
  };

}]);

/**
 * @ngdoc directive
 * @class graph
 * @memberof angular.module('lizard-nxt')
  .graph
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

    var data = graphCtrl.data,
    graph = graphCtrl.graph,
    keys = graphCtrl.keys,
    temporal = graphCtrl.type === 'temporal';

    graph.drawLine(data, keys, graphCtrl.labels, temporal);

    graph.followMouse(function (position) {
      scope.$apply(function () {
        scope.$parent.box.mouseLoc = position;
      });
    });

    graph.mouseExit(function () {
      scope.$apply(function () {
        scope.$parent.box.mouseLoc = undefined;
      });
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
 * @memberof angular.module('lizard-nxt')
  .graph
 * @name barChart
 * @requires graph
 * @description       Draws a barchart. With dynamic axis label.
 *                    Initially written for the rain graph.
 */
angular.module('lizard-nxt')
  .directive('barChart', ['$filter', function ($filter) {

  var link = function (scope, element, attrs, graphCtrl) {

    var data = graphCtrl.data,
        labels = graphCtrl.labels,
        filter = graphCtrl.yfilter,
        graph = graphCtrl.graph,
        keys = graphCtrl.keys;

    // Apply the filter on the ylabel to go from aggWindow
    // in ms to a nice 'mm/dag' label. This could be migrated
    // to the html, but filtering from the DOM is expensive
    // in angular.
    if (filter) {
      labels.y = $filter(filter)(labels.y);
    }

    graph.drawBars(data, keys, labels);
    graph.drawNow(graphCtrl.now);

    // Function to call when data changes
    graphCtrl.updateData = function (data, keys, labels) {
      if (filter) {
        labels.y = $filter(filter)(labels.y);
      }
      this.drawBars(data, keys, labels);
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
 * @memberof angular.module('lizard-nxt')
  .graph
 * @name horizontal stack
 * @requires graph
 * @description       Draws a barchart. With dynamic axis label.
 *                    Initially written to substitute the landuse donut.
 */
angular.module('lizard-nxt')
  .directive('horizontalStack', [function () {

  var link = function (scope, element, attrs, graphCtrl) {

    var graph = graphCtrl.graph;

    graph.drawHorizontalStack(graphCtrl.data, graphCtrl.keys, graphCtrl.labels);

    // Function to call when data changes
    graphCtrl.updateData = graph.drawHorizontalStack;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };

}]);
