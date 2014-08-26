/**
 * @name Graph
 * @class app.Graph
 * @memberOf app
 *
 * @summary Service to create and update a graph
 *
 * @description Inject "Graph" and call new graph(<args>) to create a
 * graph. Currently the graph supports lines, bars and donut. The user may interact with
 * the graph through click and hover functions.
 *
 * Everything in the graphs is animated for 500 milliseconds.
 */
app.factory("Graph", ["NxtD3Service", function (NxtD3Service) {

  var svg,

  // D3 components
  xScale, // The only d3 scale for placement on the x axis within the whole
              // timeline.
  xAxis,
  yAxis,
  yScale,

  // Interaction functions
  clicked,
  hoovered,

  // Graph elements
  nowIndicator;

  /**
   * @constructor
   * @memberOf app.Graph
   *
   * @param {object} element svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   * @param {object} interaction  optional object containing callback functions
   *  for click and hover interaction.
   */
  function Graph(svg, dimensions, data, interaction) {
    this.dimensions = angular.copy(dimensions);
    svg = this._createCanvas(svg, this.dimensions);
    var width = dimensions.width -
                dimensions.padding.left -
                dimensions.padding.right;
    if (interaction) {
      if (interaction.clickFn) {
        // clicked = setClickFunction(xScale, this.dimensions,
        //   interaction.clickFn);
      }
      if (interaction.moveFn) {
        // brushed = setMoveFunction(xScale, interaction.brushFn);
      }
    }
  }

  Graph.prototype = Object.create(NxtD3Service.prototype, {

    constructor: Graph,

  });

  return Graph;

}]);

// xScale = this._makeScale({min: new Date(start), max: new Date(end)},
    //                         {min: 0, max: width},
    //                         { type: 'time' });
    // xAxis = this._makeAxis(xScale, {orientation: "bottom", ticks: 5});
    // drawAxes(svg, xAxis);