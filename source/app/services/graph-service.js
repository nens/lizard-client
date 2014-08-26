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
app.factory("Graph", [ function () {

  // The timeline
  var svg;

  // D3 components
  var xScale; // The only d3 scale for placement on the x axis within the whole
              // timeline.
  var xAxis;
  var yAxis;
  var yScale;
  var ordinalYScale; // Scale used to place events in lines for each type

  // Interaction functions
  var clicked;
  var hoovered;

  // Timeline elements
  var noDataIndicator;
  var nowIndicator;
  var brushg;
  var circles; // events
  var lines; // events start - end
  var bars; // rain intensity

  /**
   * @constructor
   * @memberOf app.Graph
   *
   * @param {object} element svg element for the graph.
   * @param {object} dimensions object containing, width, height and
   *                            an object containing top,
   *                            bottom, left and right padding.
   *                            All values in px.
   * @param {integer} start begin value in milliseconds from epoch.
   * @param {integer} end end value in milliseconds from epoch.
   * @param {object} interaction  optional object containing callback functions
   *  for click and hover interaction.
   */
  function Graph(element, dimensions, start, end, interaction) {
    this.dimensions = angular.copy(dimensions);
    svg = createCanvas(element, this.dimensions);
    var width = dimensions.width -
                dimensions.padding.left -
                dimensions.padding.right;
    xScale = makeScale({min: new Date(start), max: new Date(end)},
                            {min: 0, max: width},
                            { type: 'time' });
    xAxis = makeAxis(xScale, {orientation: "bottom", ticks: 5});
    drawAxes(svg, xAxis);
    if (interaction) {
      if (interaction.clickFn) {
        clicked = setClickFunction(xScale, this.dimensions,
          interaction.clickFn);
      }
      if (interaction.moveFn) {
        brushed = setBrushFunction(xScale, interaction.brushFn);
      }
    }
  }

  Graph.prototype = {

    constructor: Graph,

    // TODO: create real noDataIndicator, this is just legacy code
    addNoDataIndicator: function () {}
  };

}]);