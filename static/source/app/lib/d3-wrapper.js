/* d3-wrapper.js
* 
* This is meant to be a wrapper for otherwise meaningless repetition.
* You create an instance of NxtD3 by:
* var someNewD3ShinyBeZazz = new NxtD3(
  <d3.select of a svg element or id of an element>, {
    width:
    height:
  });
*
*/

'use strict';

var NxtD3 = function (svg, options) {
  this.svg = d3.select(svg);

  this.createCanvas = function (svg, options) {
    var margin = {
      top: 3,
      right: 30,
      bottom: 20,
      left: 30
    };

    var width = options.width - margin.left - margin.right,
        height = options.height - margin.top - margin.bottom;

    svg.attr('width', options.width)
      .attr('height', options.height)
      .style("margin-top", margin.top)
      .append("g")
        .attr("transform", "translate(" + margin.left + ", 0)")
        //.style("transform", "translate3d(" + margin.left + "," + margin.top + ")")
        .append("rect")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "plot-temporal");
    // Create element for axis
    svg.select('g').append("g")
      .attr('class', 'x axis')
      .attr("transform", "translate(0 ," + height + ")");
    return {
      svg: svg,
      height: height,
      width: width,
      margin: margin
    };
  };

  this.updateCanvas = function (graph, options) {
    graph.width = options.width - graph.margin.left - graph.margin.right;
    graph.height = options.height - graph.margin.top - graph.margin.bottom;

    graph.svg.transition()
      .duration(500)
      .delay(500)
      .attr('height', options.height)
      .select("g")
      .attr("transform", "translate(" + graph.margin.left + ", 0)")
      .select('g')
      .attr("transform", "translate(0 ," + graph.height + ")");
    graph.svg.select("g").select("rect")
      .attr("height", graph.height);
    return graph;
  };

  this.scale = function (minMax, range, options) {
    // Instantiate a d3 scale based on min max and 
    // width and height of plot
    var scale;
    if (options.type === 'time') {
      scale = d3.time.scale()
        .domain([minMax.min, minMax.max])
        .range([range.min, range.max]);
    }
    else {
      if (options.scale === "ordinal") {
        scale = d3.scale.ordinal()
          .domain(function (d) {
            return d3.set(d.event_sub_type).values();
          })
          .range($scope.colors[8]);
      }
      else if (options.scale === "linear") {
        scale = d3.scale.linear()
          .domain([minMax.min, minMax.max])
          .range([range.min, range.max]);
      }
    }
    return scale;
  };
  this.makeAxis = function (scale, options) {
    // Make an axis for d3 based on a scale
    var axis;
    if (options.ticks) {
      axis = d3.svg.axis()
              .scale(scale)
              .orient(options.orientation)
              .ticks(options.ticks);
    } else {
      axis = d3.svg.axis()
            .scale(scale)
            .orient(options.orientation)
            .ticks(5);
    }
    return axis;
  };

  /*
  * Draws the given axis in the given graph
  */
  this.drawAxes = function (graph, xAxis) {
    graph.svg.select('g').select('g')
      .call(graph.xAxis);
  };


  this.drawCircles = function (svg, xScale, yScale, colorScale, xKey, yKey, colorKey, data) {
    var xFunction = function (d) { return Math.round(xScale(d[xKey])); };
    var yFunction = function (d) { return yScale(d[yKey]); };
    var colorFunction = function (d) { return colorScale(d[colorKey]); };
    // DATA JOIN
    // Join new data with old elements, based on the id value.
    var circles = svg.select('g').selectAll("circle")
        .data(data, function  (d) { return d.id; });

    // UPDATE
    // Update old elements as needed.
    circles.attr("class", "bar")
      .transition()
      .delay(500)
      .duration(500)
      .attr("fill", colorFunction)
      .attr("cy", yFunction)
      .attr("cx", xFunction);

    // ENTER
    // Create new elements as needed.
    circles.enter().append("circle")
      .attr("cx", xFunction)
      .attr("cy", yFunction)
      .attr("fill", colorFunction)
      .attr("r", 5)
      .attr("fill-opacity", 0)
      .transition()
      .delay(500)
      .duration(500)
      .attr("fill-opacity", 1);

    // EXIT
    // Remove old elements as needed.
    circles.exit()
      .transition()
      .delay(0)
      .duration(500)
      .attr("cy", 0)
      .attr("cx", xFunction)
      .style("fill-opacity", 1e-6)
      .remove();

    // // Add click listener
    // circles.on('click', function (d) {
    //   $scope.box.type = 'aggregate';
    //   $scope.box.content.eventValue = d;
    //   $scope.$apply();
    // });
  };

  this.drawEventsContainedInBounds = function (bounds) {
    var latLng = [];
    d3.selectAll("circle").classed("hidden", true);
    d3.selectAll("circle")
      .classed("selected", function (d) {
        latLng[0] = d.geometry.coordinates[1];
        latLng[1] = d.geometry.coordinates[0];
        var contained = bounds.contains(latLng);
        // Some book keeping to count
        d.inSpatExtent = contained;
        return contained;
      });
    var selected = d3.selectAll("circle.selected");
    selected.classed("hidden", false);
  };

  var brush = null;
  this.createBrush = function (graph) {
    brush = d3.svg.brush().x(graph.xScale)
      .on("brush", this.brushmove);
    this.brushg = graph.svg.select('g').append("g")
      // .attr("transform", "translate(" + graph.margin.left + ", " + graph.margin.top + ")")
      .attr("class", "brushed")
      .call(brush);
    this.brushg.selectAll("rect")
      .attr("height", graph.height);
    return brush;
  };

  this.updateBrush = function (height) {
    if (this.brushg) {
      this.brushg.selectAll("rect")
        .transition()
        .delay(500)
        .duration(500)
        .attr("height", height);
      this.brushg.call(brush);
    }
  };

  this.removeBrush = function (svg) {
    if (this.brushg) {
      this.brushg.remove();
    }
    svg.classed("selecting", false);
    d3.selectAll('.bar').classed("selected", false);
  };

  this.createCanvas(this.svg, options);
};