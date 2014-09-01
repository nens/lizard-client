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
app.directive('graph', ["Graph", function (Graph) {

  var graphCtrl, preCompile, link;

  graphCtrl = function ($scope, Graph) {
    // Provide defaults for backwards compatability
    this.data = $scope.data || [];
    this.keys = $scope.keys || {x: 0, y: 1};
    this.labels = {
      x: $scope.xlabel || '',
      y: $scope.ylabel || ''
    };
    this.graph = {};
    this.yfilter = "";
  };

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
      width: 370,
      height: 150,
      padding: {
        top: 5,
        right: 5,
        bottom: 50,
        left: 50
      }
    };

    el = element[0].firstChild;

    graphCtrl.yfilter = attrs.yfilter;

    // Create the graph and put it on the controller
    graphCtrl.graph = new Graph(el, dimensions);

  };

  link = function (scope, element, attrs, graphCtrl) {

    /**
     * Calls updateGraph when data changes.
     */
    scope.$watch('data', function (n, o) {
      if (n === o) { return true; }
      graphCtrl.update.call(graphCtrl.graph, scope.data, scope.keys, graphCtrl.labels);
    });

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
      yfilter: '='
    },
    restrict: 'E',
    replace: true,
    template: '<div class="graph-svg-wrapper"><svg></svg></div>'
  };

}]);


app.directive('pie', [function () {

  var link = function (scope, element, attrs, graphCtrl) {

    // Pie graph requires a few extra elements to display its text.
    element.append('<div class="donut-underline donut-underline-top fading"></div>');
    element.append('<div class="donut-underline donut-underline-bottom fading"></div>');
    element.append('<div class="percentage-container fading"></div>');

    var graph = graphCtrl.graph;

    graph.drawDonut(graphCtrl.data);
    graphCtrl.update = graph.drawDonut;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A',
  };

}]);

app.directive('line', [function () {

  var link = function (scope, element, attrs, graphCtrl) {

    var data = graphCtrl.data,
    graph = graphCtrl.graph,
    keys = graphCtrl.keys;

    graph.drawLine(data, keys, graphCtrl.labels);
    graphCtrl.update = graph.drawLine;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };

}]);


app.directive('barChart', ['$filter', function ($filter) {

  var link = function (scope, element, attrs, graphCtrl) {

    var data = graphCtrl.data,
    labels = graphCtrl.labels,
    filter = graphCtrl.yfilter,
    graph = graphCtrl.graph,
    keys = graphCtrl.keys;

    if (filter) {
      labels.y = $filter(filter)(labels.y);
    }

    graph.drawBars(data, keys, labels);

    graphCtrl.update = function (data, keys, labels) {
      if (filter) {
        labels.y = $filter(filter)(labels.y);
      }
      this.drawBars(data, keys, labels);
    };

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };

}]);



app.directive('horizontalStack', [function () {

  var link = function (scope, element, attrs, graphCtrl) {

    var graph = graphCtrl.graph,

    stackDimensions = graph.dimensions;
    stackDimensions.height = 80;
    stackDimensions.padding.left = 0;
    stackDimensions.padding.right = 0;

    graph.resize(stackDimensions);
    graph.drawHorizontalStack(graphCtrl.data, graphCtrl.keys, graphCtrl.labels);
    graphCtrl.update = graph.drawHorizontalStack;

  };

  return {
    require: 'graph',
    link: link,
    restrict: 'A'
  };

}]);
