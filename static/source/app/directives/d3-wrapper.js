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
  // var nxtd3 = {};
  this.svg = svg;

  this.createCanvas = function (svg, options) {
    this.margin = {
      top: 3,
      right: 30,
      bottom: 20,
      left: 30
    };

    this.width = options.width - this.margin.left - this.margin.right;
    this.height = options.height - this.margin.top - this.margin.bottom;
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
    this.svg = svg;
  };

  this.updateCanvas = function (options) {
    this.width = options.width - this.margin.left - this.margin.right;
    this.height = options.height - this.margin.top - this.margin.bottom;
    var that = this;

    this.svg.transition()
      .duration(500)
      .delay(500)
      .attr('height', options.height)
      .select("g")
      .attr("transform", "translate(" + that.margin.left + ", 0)")
      .select('g')
      .attr("transform", "translate(0 ," + that.height + ")");
    this.svg.select("g").select("rect")
      .attr("height", that.height);
  };

  /*
  *
  * @param {Array} data - Data that you want the min max of.
  * @param {string} key - key of the parameter in the data list.
  *
  */
  this.maxMin = function (data, key) {
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
  this.createScale = function (minMax, options) {
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
  this.makeAxis = function (scale, options) {
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
  this.drawAxes = function (id) {
    this.svg.select('.x.axis')
      .call(this.charts[id].x.axis)
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
            return "rotate(-45)";
          });
    this.svg.select('.y.axis')
      .call(this.charts[id].y.axis);
  };


  this.drawCircles = function (svg, xScale, yScale, colorScale, xKey, yKey, colorKey, data) {
    var xFunction = function (d) { return Math.round(xScale(d[xKey])); };
    var yFunction = function (d) { return yScale(d[yKey]); };
    var colorFunction = function (d) { return colorScale(d[colorKey]); };
    // DATA JOIN
    // Join new data with old elements, based on the id value.
    var circles = this.svg.select('g').selectAll("circle")
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
  this.drawBars = function (id, data) {
    // Bar Chart specific stuff
    var that = this.charts[id];
    var height = this.height;
    this.charts[id].type = 'bar';
    var bars = this.svg.select("g").selectAll(".bar_" + id)
      .data(data);

    this.charts[id].x.datafn = function (d) { return that.x.scale(d[1]) - 0.5; };
    this.charts[id].y.datafn = function (d) { return that.y.scale(d[0]) - 0.5; };
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

  this.updateBars = function (id, data) {   
    var bars = this.svg.select("g").selectAll(".bar_" + id)
      .data(data);
  };

  this.drawLine = function (id, data) {
    var height = this.height;
    var width = this.width;
    // if (this.charts[id].line === undefined) {
      this.charts[id].type = 'line';

      this.charts[id].line = d3.svg.line()
      .y(function (d) {
        return that.y.scale(d[0]);
      })
      .x(function (d) {
        return that.x.scale(d[1]);
      });

      this.charts[id].line.defined(
        function (d) {
          return !isNaN(parseFloat(d[0]));
        });

    var that = this.charts[id];
    var linus = this.svg.select("g").selectAll("path.line_" + id)
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

  this.addZoom = function () {
    var id = Object.keys(this.charts)[0];
    var firstChart = this.charts[id];
    this.zoomed = function () {
      // console.info(id, this.charts[id].x.tickFormat);
      this.svg.select(".x.axis").call(
        this.makeAxis(this.charts[id].x.scale, {
        orientation: "bottom",
        // tickFormat: this.charts[id].x.tickFormat
      }))
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
            return "rotate(-45)";
          });
      for (var i in this.charts) {
        if (this.charts[i].type === 'line') {
          svg.selectAll(".line_" + i)
            .attr("class", "line line_" + i)
            .attr("d", this.charts[i].line);
        }
        if (this.charts[i].type === 'bar') {
          svg.selectAll(".bar")
            .attr("x", this.charts[i].x.datafn)
            .attr("transform", "translate(" + "translate(" + d3.event.translate[0] + ",0)scale(" + d3.event.scale + ", 1)");
        }

      }
    };

    var zoom = d3.behavior.zoom()
    .x(firstChart.x.scale)
    .on("zoom", this.zoomed);

    for (var i in this.charts) {
      zoom.x(this.charts[i].x.scale)
    }

    this.svg.call(zoom)
      .on("mousedown.zoom", null)
      .on("touchstart.zoom", null)
      .on("touchmove.zoom", null)
      .on("touchend.zoom", null);
    this.svg.call(zoom);
  };

  this.initiate = function (data, id) {
    var newChart = null;
    if (this.charts === undefined) {
      this.charts = {};
      newChart = true;
    }
    this.charts[id] = {};
    var x = this.maxMin(data, '1');
    var y = this.maxMin(data, '0');
    if (Object.keys(this.charts).length > 1) {
      x.scale = this.charts[Object.keys(this.charts)[0]].x.scale;
      x.axis = this.charts[Object.keys(this.charts)[0]].x.axis;
    } else {
      x.scale = this.createScale(x, {
        range: {
          min: 0,
          max: this.width
        },
        type: 'time'
      });
      x.axis = this.makeAxis(x.scale, {
        orientation: "bottom"
      });
    }

    y.scale = this.createScale(y, {
      range: {
        min: this.height,
        max: 0
      },
      scale: 'linear'
    });

    y.axis = this.makeAxis(y.scale, {
      orientation: "left"
    });
    this.charts[id].x = x;
    this.charts[id].y = y;
    if (newChart) {
      this.drawAxes(id);
    }
  };

  this.createCanvas(this.svg, options);
};