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
  var nxtd3 = {};

  nxtd3.svg = svg;

  nxtd3.createCanvas = function (svg, options) {
    nxtd3.margin = {
      top: 3,
      right: 30,
      bottom: 20,
      left: 30
    };

    nxtd3.width = options.width - nxtd3.margin.left - nxtd3.margin.right;
    nxtd3.height = options.height - nxtd3.margin.top - nxtd3.margin.bottom;
    var that = this;

    // clean up if new instance.
    svg.selectAll('g').remove();

    svg.attr('width', options.width)
      .attr('height', options.height)
      .style("margin-top", that.margin.top)
      .append("g")
        .attr("transform", "translate(" + that.margin.left + ", 0)")
        //.style("transform", "translate3d(" + margin.left + "," + margin.top + ")")
        .append("rect")
          .attr("width", that.width)
          .attr("height", that.height)
          .attr("class", "plot");
    // Create element for axis
    svg.select('g').append("g")
      .attr('class', 'x axis')
      .attr("transform", "translate(0 ," + that.height + ")");
    svg.select('g').append("g")
      .attr('class', 'y axis');
    nxtd3.svg = svg;
  };

  nxtd3.updateCanvas = function (options) {
    nxtd3.width = options.width - nxtd3.margin.left - nxtd3.margin.right;
    nxtd3.height = options.height - nxtd3.margin.top - nxtd3.margin.bottom;
    var that = this;

    nxtd3.svg.transition()
      .duration(500)
      .delay(500)
      .attr('height', options.height)
      .select("g")
      .attr("transform", "translate(" + that.margin.left + ", 0)")
      .select('g')
      .attr("transform", "translate(0 ," + that.height + ")");
    nxtd3.svg.select("g").select("rect")
      .attr("height", that.height);
  };

  /*
  *
  * @param {Array} data - Data that you want the min max of.
  * @param {string} key - key of the parameter in the data list.
  *
  */
  nxtd3.maxMin = function (data, key) {
    var max = d3.max(data, function (d) {
            return Number(d[key]);
          });
    var min = d3.min(data, function (d) {
            return Number(d[key]);
          });
    return {
      max: max,
      min: min
    };
  };

  /*
  * 
  * @param {min: float, max: float} minMax - minimum and maximum of your input data
  * @param {min: float, max: float} range - minimum and maximum of your element (width or height)
  * @param {scale: string, type: string, colors: [array of strings]} options - options for your scale
  *
  */
  nxtd3.createScale = function (minMax, options) {
    var scale;
    if (options.type === 'time') {
      scale = d3.time.scale()
        .domain([minMax.min, minMax.max])
        .range([options.range.min, options.range.max]);
    }
    else {
      if (options.scale === "ordinal") {
        scale = d3.scale.ordinal()
          .domain(function (d) {
            return d3.set(d.event_sub_type).values();
          })
          .range(options.colors);
      }
      else if (options.scale === "linear") {
        scale = d3.scale.linear()
          .domain([minMax.min, minMax.max])
          .range([options.range.min, options.range.max]);
      }
    }
    return scale;
  };
  

  /*
  * Make an axis for d3 based on a scale
  * @param {d3.scale} scale
  * @param {Object {orientation: string, ticks: int}} options
  */
  nxtd3.makeAxis = function (scale, options) {
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
  * Draws the given axis
  * @param {d3.axis} axis
  */
  nxtd3.drawAxes = function (id) {
    nxtd3.svg.select('.x.axis')
      .call(nxtd3.charts[id].x.axis)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
            return "rotate(-45)";
          });
    nxtd3.svg.select('.y.axis')
      .call(nxtd3.charts[id].y.axis);
  };


  nxtd3.drawCircles = function (svg, xScale, yScale, colorScale, xKey, yKey, colorKey, data) {
    var xFunction = function (d) { return Math.round(xScale(d[xKey])); };
    var yFunction = function (d) { return yScale(d[yKey]); };
    var colorFunction = function (d) { return colorScale(d[colorKey]); };
    // DATA JOIN
    // Join new data with old elements, based on the id value.
    var circles = nxtd3.svg.select('g').selectAll("circle")
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

  /*
  *
  * Draws svg rect's as bar chart.
  *
  */
  nxtd3.drawBars = function (id, data) {
    // Bar Chart specific stuff
    var that = nxtd3.charts[id];
    var height = nxtd3.height;
    nxtd3.charts[id].type = 'bar';
    var bars = nxtd3.svg.select("g").selectAll(".bar_" + id)
      .data(data, function (d) { return d[1]; });

    nxtd3.charts[id].x.datafn = function (d) { return that.x.scale(d[1]) - 0.5; };
    nxtd3.charts[id].y.datafn = function (d) { return that.y.scale(d[0]) - 0.5; };
    bars.attr("class", "bar bar_" + id)
      .transition()
      .delay(0)
      .duration(0)
      .attr("x", that.x.datafn)
      .attr("y", that.y.datafn)
      .attr("height", function (d) { return height - that.y.scale(d[0]); });


    bars.enter().append("rect")
      .attr("class", "bar bar_" + id)
      .attr("x", that.x.datafn)
      .attr("y", that.y.datafn)
      .attr("width", 5)
      .attr("height", function (d) { return height - that.y.scale(d[0]); });

    bars.exit()
      .transition()
      .delay(0)
      .duration(500)
      .attr("x", 0)
      .attr("y", 0)
      .style("fill-opacity", 1e-6)
      .remove();
  };

  nxtd3.drawLine = function (id, data) {
    var height = nxtd3.height;
    var width = nxtd3.width;
    // if (nxtd3.charts[id].line === undefined) {
      nxtd3.charts[id].type = 'line';

      nxtd3.charts[id].line = d3.svg.line()
      .y(function (d) {
        return that.y.scale(d[0]);
      })
      .x(function (d) {
        return that.x.scale(d[1]);
      });

      nxtd3.charts[id].line.defined(
        function (d) {
          return !isNaN(parseFloat(d[0]));
        });

    var that = nxtd3.charts[id];
    var linus = nxtd3.svg.select("g").selectAll("path.line_" + id)
      .data([data]);
    linus.enter().append("path")
      .attr("class", "line line_" + id)
      .attr("d", that.line);
    linus.transition()
      .duration(300)
      .attr("d", that.line);
    linus.exit().remove();
  };

  var brush = null;
  nxtd3.createBrush = function (graph) {
    brush = d3.svg.brush().x(graph.xScale)
      .on("brush", nxtd3.brushmove);
    nxtd3.brushg = graph.svg.select('g').append("g")
      // .attr("transform", "translate(" + graph.margin.left + ", " + graph.margin.top + ")")
      .attr("class", "brushed")
      .call(brush);
    nxtd3.brushg.selectAll("rect")
      .attr("height", graph.height);
    return brush;
  };

  nxtd3.updateBrush = function (height) {
    if (nxtd3.brushg) {
      nxtd3.brushg.selectAll("rect")
        .transition()
        .delay(500)
        .duration(500)
        .attr("height", height);
      nxtd3.brushg.call(brush);
    }
  };

  nxtd3.removeBrush = function (svg) {
    if (nxtd3.brushg) {
      nxtd3.brushg.remove();
    }
    svg.classed("selecting", false);
    d3.selectAll('.bar').classed("selected", false);
  };

  nxtd3.addZoom = function () {
    var id = Object.keys(nxtd3.charts)[0];
    var firstChart = nxtd3.charts[id];
    nxtd3.zoomed = function () {
      // console.info(id, nxtd3.charts[id].x.tickFormat);
      nxtd3.svg.select(".x.axis").call(
        nxtd3.makeAxis(nxtd3.charts[id].x.scale, {
        orientation: "bottom",
        // tickFormat: nxtd3.charts[id].x.tickFormat
      }))
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
            return "rotate(-45)";
          });
      for (var i in nxtd3.charts) {
      // id = i;
        if (nxtd3.charts[i].type === 'bar') {
          svg.selectAll(".bar")
            .attr("x", nxtd3.charts[i].x.datafn)
            .attr("transform", "translate(" + "translate(" + d3.event.translate[0] + ",0)scale(" + d3.event.scale + ", 1)");
        }
        if (nxtd3.charts[i].type === 'line') {
          svg.selectAll(".line_" + i)
            .attr("class", "line line_" + i)
            .attr("d", nxtd3.charts[i].line);
        }
      }
    };

    // for (var i in nxtd3.charts) {
      // id = i;
    var zoom = d3.behavior.zoom()
    .x(firstChart.x.scale)
    .on("zoom", nxtd3.zoomed);

    nxtd3.svg.call(zoom)
      .on("mousedown.zoom", null)
      .on("touchstart.zoom", null)
      .on("touchmove.zoom", null)
      .on("touchend.zoom", null);
    nxtd3.svg.call(zoom);
    // }
  };

  nxtd3.initiate = function (data, id) {
    var newChart = null;
    if (nxtd3.charts === undefined) {
      nxtd3.charts = {};
      newChart = true;
    }
    nxtd3.charts[id] = {};
    var x = nxtd3.maxMin(data, '1');
    var y = nxtd3.maxMin(data, '0');
    if (Object.keys(nxtd3.charts).length > 1) {
      x.scale = nxtd3.charts[Object.keys(nxtd3.charts)[0]].x.scale;
      x.axis = nxtd3.charts[Object.keys(nxtd3.charts)[0]].x.axis;
    } else {
      x.scale = nxtd3.createScale(x, {
        range: {
          min: 0,
          max: nxtd3.width
        },
        type: 'time'
      });
      x.axis = nxtd3.makeAxis(x.scale, {
        orientation: "bottom"
      });
    }

    y.scale = nxtd3.createScale(y, {
      range: {
        min: nxtd3.height,
        max: 0
      },
      scale: 'linear'
    });

    y.axis = nxtd3.makeAxis(y.scale, {
      orientation: "left"
    });
    nxtd3.charts[id].x = x;
    nxtd3.charts[id].y = y;
    if (newChart) {
      nxtd3.drawAxes(id);
    }
  };

  nxtd3.createCanvas(nxtd3.svg, options);
  return nxtd3;
};