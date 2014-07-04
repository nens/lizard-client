'use strict';

//graph.js

/**
 * The graph directive contains low level behavior of the graph element
 * Higher level behavior that is chart type specific, is implemented
 * in directives for attributes.
 *
 * In HTML this should look like:
 * <graph [graph-type] data=[data object] [optional labels, titles etc]></graph>
 */
angular.module('graph', []);

angular.module('graph')
.directive('graph', function ($filter) {

  var controller = function ($scope) {

    /**
     * Abstract function. Directives using this controller
     * will need to implement a callChart function. This 
     * function should be called once to set up the graph. 
     * See barChart directive for an example.
     * 
     * @param  {object} data    data object
     * @param  {object} element html element
     * @param  {legend} legend  legend element containing labels
     * @return {object} graph object
     */
    this.callChart = function (data, element, legend) {
    };

    /**
     * Optional abstract function. Directive might implement
     * this function to update an existing graph with new data
     * following a d3 update pattern. See barchart directive 
     * for an example.
     * 
     * @param  {object} data    data object
     * @param  {object} graph   graph object from callChart
     * @return {object} graph object
     */
    this.drawFeatures = function (data, graph) {
    };


    this.createCanvas =  function (legend, element) {
      var margin = {
        top: 20,
        right: 10,
        bottom: 20,
        left: 20
      },
      maxwidth = 370,
      maxheight = 150;

      if (legend.yLabel) {
        margin.left = 60;
      }

      if (legend.xLabel) {
        margin.bottom = 35;
      }
      var width = maxwidth - margin.left - margin.right,
        height = maxheight - margin.top - margin.bottom;

      this.svg = d3.select(element[0])
        .html("")
        .append("svg:svg")
        .attr('width', maxwidth)
        .attr('height', maxheight + 25)
        .append("svg:g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      if (!legend.pie) {
        this.svg.append("svg:rect")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "plot");
        //Create title
        this.svg.append("text")
          .attr('class', 'graph-text')
          .attr("x", width / 2)
          .attr("y", -50 / 2 + margin.top)
          .attr("class", "title")
          .style("text-anchor", "middle")
          .text(legend.title);
          
      }
              
      if (legend.xLabel) {
         //Create X axis label   
        this.svg.append("text")
           .attr('class', 'graph-text')
           .attr("x", width / 2)
           .attr("y",  height + margin.bottom * 1.5)
           .style("text-anchor", "middle")
           .text(legend.xLabel);
      }

      if (legend.yLabel) {
        //Create Y axis label
        this.svg.append("text")
          .attr('class', 'graph-text')
          .attr('id', 'ylabel')
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (height / 2))
          .attr("dy", "0.9em")
          .style("text-anchor", "middle")
          .text(legend.yLabel);
      }
      return {
        svg: this.svg,
        height: height,
        width: width,
        margin: margin
      };
    };

    this.createDrawingArea = function (width, height) {
      // Add clippath to limit the drawing area to inside the graph
      // See: http://bost.ocks.org/mike/path/
      var clip = this.svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", width)
        .attr("height", height);
      
      // Put the data in this group
      var g = this.svg.append("g")
        .attr("clip-path", "url(#clip)")
        .attr('id', 'feature-group');

      // Create line to indicate timeState.at out of sight
      g.append('line')
        .attr('class', 'now-indicator')
        .attr('x1', -5)
        .attr('x2', -5)
        .attr('y1', height)
        .attr('y2', 0);

      return g;
    };

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

    this.scale = function (min, max, options) {
      var scale = {};
      if (options.type === 'time') {
        scale = d3.time.scale()
            .domain([min, max])
            .range([options.range[0], options.range[1]]);
      } else if (options.type === 'kpi') {
        scale = d3.time.scale()
          .domain(d3.extent(options.data, function (d) {
              return Date.parse(d.date);
            }))
          .range([options.range[0], options.range[1]]);
      } else {
        scale = d3.scale.linear()
          .domain([min, max])
          .range([options.range[0], options.range[1]]);
      }
      return scale;
    };

    this.makeAxis = function (scale, options) {
      var axis = {};
      if (options.tickFormat) {
        axis = d3.svg.axis()
          .scale(scale)
          .orient(options.orientation)
          .tickFormat(options.tickFormat)
          .ticks(5);
      } else {
        axis = d3.svg.axis()
          .scale(scale)
          .orient(options.orientation)
          .ticks(5);
      }
      return axis;
    };

    this.drawAxes = function (svg, x, y, options) {
      var xAxis = {}, yAxis = {};
      if (options.axes) {
        xAxis = options.axes.x;
        yAxis = options.axes.y;
      } else {
        xAxis = this.makeAxis(x.scale, {orientation: "bottom"});
        yAxis = this.makeAxis(y.scale, {orientation: "left"});
      }
      svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + options.height + ")")
        .call(xAxis)
        .selectAll("text")
          .style("text-anchor", "end")
          .attr('class', 'graph-text')
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", function (d) {
            return "rotate(-45)";
          });

      svg.append("g")
        .attr("class", "y-axis y axis")
        .call(yAxis)
        .selectAll("text")
          .style("text-anchor", "end")
          .attr('class', 'graph-text');
    };

    /**
     * Shows the line element indicating timeState.at.
     * 
     * @param  {graph object} graph contains the svg and a d3 scale object
     * @param  {now} now   epoch timestamp in ms
     */
    this.drawNow = function (graph, now) {
      var line = graph.svg.select('#feature-group').select('.now-indicator');
      line
        .transition()
        .duration(300)
        .ease('in-out')
        .attr('x1', graph.x.scale(now) || -5)
        .attr('x2', graph.x.scale(now) || -5)
        .attr('y1', graph.height)
        .attr('y2', 0);
    };

    this.hideNow = function (graph) {
      var line = graph.svg.select('#feature-group').select('.now-indicator');
      line
        .attr('x1', -5)
        .attr('x2', -5)
        .attr('y1', null)
        .attr('y2', null);
    };

  };

  var link = function (scope, element, attrs, graphCtrl) {

    scope.$watch('data', function () {
      var legend = {
        title: scope.title,
        xLabel: scope.xlabel,
        yLabel: scope.ylabel,
        type: attrs.type
      };
      if (attrs.yfilter) {
        legend.yLabel = $filter(attrs.yfilter)(scope.ylabel);
      }
      // Build chart from scratch
      if (scope.graph === undefined) {
        // clear the chart beforehand
        d3.select(element[0]).html("");
        scope.graph = graphCtrl.callChart(scope.data, element, legend);
        scope.graph = graphCtrl.drawFeatures(scope.data, scope.graph, legend);
        // Draw the now for the rain
        if (scope.$parent.tools.active === 'rain') {
          graphCtrl.drawNow(scope.graph, scope.$parent.timeState.at);
        }
      // Update graph with new data
      } else {
        scope.graph = graphCtrl.drawFeatures(scope.data, scope.graph, legend);
      }
    });
    
    scope.$parent.$watch('timeState.at', function (n, o) {
      if (n === o) { return true; }
      if (scope.$parent.tools.active === 'rain' &&
        scope.graph) {
        graphCtrl.drawNow(scope.graph, scope.$parent.timeState.at);
      } else if (scope.graph) {
        graphCtrl.hideNow(scope.graph);
      }
    });

  };

  return {
    controller: controller,
    link: link,
    scope: {
      // TODO: add extra options (e.g. width)? 
      title: '=',
      data: '=',
      xlabel: '=',
      ylabel: '=',
      xmin: '=',
      xmax: '=',
      ymin: '=',
      ymax: '=',
      type: '=',
      size: '='
    },
    restrict: 'E',
    replace: true,
    template: '<div class="graph-directive"></div>'
  };
});

angular.module('graph')
.directive('barChart', function () {
  var link = function (scope, element, attrs, graphCtrl) {
    
    /**
     * Builds d3 chart object with axes scales and zoom functionality.
     *
     * Designed for and used by the rain on point, see templates/rain.html
     * and rain-aggregate-directives.
     * 
     * @param   {object} data    list of data values [timestamp, sum]
     * @param   {[type]} element html element
     * @returns {[object]}       graph object
     */
    graphCtrl.callChart = function (data, element, legend) {
      var graph = graphCtrl.createCanvas(legend, element);
      var svg = graph.svg,
          height = graph.height,
          width = graph.width,
          margin = graph.margin;

      var x = {};
      x.max = data[data.length - 1][0];
      x.min = data[0][0];
      var y = graphCtrl.maxMin(data, '1');

      x.scale = graphCtrl.scale(scope.timeState.start, scope.timeState.end, {
        range: [0, width],
        type: 'time'
      });
      y.scale = graphCtrl.scale(y.min, y.max, {
        range: [height, 0]
      });

      var barWidth = x.scale(data[1][0]) - x.scale(data[0][0]);

      graphCtrl.drawAxes(svg, x, y, {
        height: height,
        width: width
      });

      var g = graphCtrl.createDrawingArea(width, height);

      return {
        svg: svg,
        g: g,
        height: height,
        width: width,
        x: x,
        y: y,
        barWidth: barWidth
      };
    };

    /**
     * Draws new features, updates and removes features and rescales graph.
     * 
     * @param  {object} data  new data object
     * @param  {object} graph graph object
     */
    graphCtrl.drawFeatures = function (data, graph, legend) {
      var svg = graph.svg,
      g = graph.g,
      x = graph.x,
      y = graph.y,
      width = graph.width;

      var yN = graphCtrl.maxMin(data, '1');
      if (yN.max > y.max || yN.max < (0.5 * y.max)) {
        y = yN;
        y.scale = graphCtrl.scale(y.min, y.max, {
          range: [graph.height, 0]
        });
        graph.y = y;
      }

      var rescale = function () {
        var yAxis = graphCtrl.makeAxis(y.scale, {orientation: 'left'});
        svg.select('.y-axis')
          .transition()
          .duration(800)
          .ease("sin-in-out")
          .call(yAxis)
          .selectAll("text")
            .style("text-anchor", "end")
            .attr('class', 'graph-text');
      };

      if (legend.yLabel) {
        //Create Y axis label
        svg.select("#ylabel")
          .text(legend.yLabel);
      }

      // Create new scale since timeState might have changed
      x.scale = graphCtrl.scale(scope.timeState.start, scope.timeState.end, {
        range: [0, width],
        type: 'time'
      });

      // Update axis with new scale
      svg.select(".x.axis")
        .call(graphCtrl.makeAxis(x.scale, {orientation: "bottom"}))
        .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", function (d) {
              return "rotate(-45)";
            })
          .attr('class', 'graph-text');

      // Join new data with old elements, based on the timestamp.
      var bar = g.selectAll(".bar")
          .data(data, function  (d) { return d[0]; });

      var heightFn = function (d) {
        var height = y.scale(d[1]);
        var h;
        if (height < 200) {
          h = 200 - height;
        } else {
          h = 0;
        }
        return h;
      };
      
      var barWidth = x.scale(data[1][0]) - x.scale(data[0][0]);

      // UPDATE
      // Update old elements as needed.
      bar.transition()
        .duration(500)
        .attr("height", heightFn)
        .attr("x", function (d) { return x.scale(d[0]) - 0.5 * barWidth; })
        .attr('width', function (d) { return barWidth; })
        .attr("y", function (d) { return y.scale(d[1]); })
        .each("end", rescale);

      // ENTER
      // Create new elements as needed.
      bar.enter().append("rect")
          .attr("class", "bar")
          .attr("x", function (d) { return x.scale(d[0]) - 0.5 * barWidth; })
          .attr('width', function (d) { return barWidth; })
          .attr("y", function (d) { return y.scale(0); })
          .attr("height", 0)
          .transition()
          .duration(500)
          .attr("height", function (d) { return 200 - y.scale(d[1]); })
          .attr("y", function (d) { return y.scale(d[1]); });

      // Move now-indicator to the front
      var nowEl = g.select('.now-indicator').node();
      nowEl.parentNode.appendChild(nowEl);

      // EXIT
      // Remove old elements as needed.
      bar.exit()
        .remove();

      return graph;
    };
  };
  return {
    link: link,
    require: 'graph'
  };
});


angular.module('graph')
  .directive('pie', function () {
    var link =  function (scope, element, attrs, graphCtrl) {
      graphCtrl.callChart = function (data, element, legend) {
        legend.pie = true;
        var graph = graphCtrl.createCanvas(legend, element);
        var svg = graph.svg,
            height = graph.height,
            width = graph.width,
            margin = graph.margin,
            radius = Math.min(width, height) / 1.3;

        var total = 0;
        var pie = d3.layout.pie()
          .value(function (d) {
              total += d.data;
              return d.data;
            })
          .sort(function (a, b) {
            var ordFunction = function (x) {
              return x.label ? parseInt(x.label.split(' ')[0]) : 0;
            };
            return d3.ascending(ordFunction(a), ordFunction(b));
          });

        var arc = d3.svg.arc()
            .innerRadius(radius - radius / 1.75)
            .outerRadius(radius);

        d3.select(".graph-directive")
          .insert("div")
          .classed({
            "donut-underline": true,
            "donut-underline-top": true, 
            "fading": true
          });

        d3.select(".graph-directive")
          .insert("div")
          .classed({
            "donut-underline": true,
            "donut-underline-bottom": true, 
            "fading": true
          });

        d3.select(".graph-directive")
          .insert("div")
          .classed({"percentage-container": true, "fading": true});

        /** 
         * Removes the DOM elements (.percentage-container AND 
         * .donut-underline-top) according to the currently selected raster.
         */ 

        var rmRasterSpecificInfo = function () {

          svg.select("text")
            .transition()
            .duration(300)
            .attr("fill-opacity", 0.0);

          d3.selectAll(".fading")
            .transition()
            .duration(300)
            .style("opacity", 0.0);
        };

        /**
         * Formats a number (might be both Int and Float) to show a consistent
         * amount of decimals it the final string representation: e.g. 
         *
         * 25   ::= "25.00 %"
         * 25.1 ::= "25.10 %"
         * 3.14 ::=  "3.14 %"
         * 
         * @param {number} vloot - A number that is in need of formatting.
         * @return {string} - A string representation of the passed number.
         */
        var formatPercentage = function (vloot) {

          var splitted = ("" + vloot).split('.');
          var suffix = splitted.length > 1 && splitted[1];

          if (!suffix) {
            suffix = "00";
          } else if (suffix.length === 1) {
            suffix += "0";
          }

          return splitted[0] + "." + suffix;
        };

        /** 
         * Appends/fills/styles the DOM elements (.percentage-container, 
         * .donut-underline-top AND .donut-underline-bottom) according 
         * to the currently selected raster.
         *
         * @param {object} d - D3 datum object. 
         */ 
        var addRasterSpecificInfo = function (d) {

          // setting the plain text:

          d3.selectAll(".fading")
            .style("opacity", 0.0);
          svg.select('text')
            .attr('fill-opacity', 0.0);

          d3.select(".percentage-container")
            .text(formatPercentage(
              Math.round(d.data.data / total * 10000) / 100) + " %"
            )
            .transition()
            .duration(300)
            .style("opacity", 1.0);
          
          text = svg.select("text")
            .attr("transform", "translate(" + width / 2 +
              ", " + (20 + height) + ")")
            .attr("dx", radius - 10)
            .attr("dy", -(radius / 2 + 92))
            .style("text-anchor", "middle")
            .style("fill", "#555")
            .attr("class", "on")
            .style("font-weight", 700)
            .style("font-size", "16px")
            .text(function () {
              var text = "";
              try {
                text = d.data.label.split('-')[2];
                text = (text !== undefined) ? text : d.data.label;
              } catch (e) {
                text = d.data.label === 0 ? 'Geen data' : 'Overig';
              }
              return text;
            })
            .transition()
            .duration(300)
            .attr("fill-opacity", 1.0);

          /**
           * Fade in donut lines; the colored lines that are above and beneath
           * the big digits denoting the percentage of the currently selected
           * (hovered) slice of the pie chart.
           */
          var fadeInDonutlines = function () {
            this.transition()
            .duration(300)
            .style("background-color", d.data.color)
            .style("opacity", 1.0);
          };
          d3.select('.donut-underline-top').call(fadeInDonutlines);
          d3.select('.donut-underline-bottom').call(fadeInDonutlines);
        };

        var text = svg.append("text");
        var path = svg.datum(data).selectAll("path")
            .data(pie)
          .enter().append("path")
            .attr("fill", function (d) {return d.data.color; })
            .attr("d", arc)
            .attr("transform", "translate(" +
              ((width / 2) - 100) + ", " + ((height / 2) + 15) + ")")
            .on("mouseover", function (d) {
              d3.selectAll("path")
                .transition()
                .duration(200)
                .attr("fill-opacity", 0.2);
              d3.select(this)
                .transition()
                .duration(200)
                .attr("fill-opacity", 1.0);
              addRasterSpecificInfo(d);
            })
            .on("mouseout", function () {
              d3.selectAll("path")
                .transition()
                .duration(200)
                .attr("fill-opacity", 1.0);
              rmRasterSpecificInfo();
            })
            .on("click", addRasterSpecificInfo)
            .each(function (d) { this._current = d; });
      };
    };

    return {
      link: link,
      require: 'graph'
    };
  });

angular.module('graph')
  .directive('line', function () {
    var link  = function (scope, element, attrs, graphCtrl) {
      graphCtrl.callChart = function (timeseries, element, legend) {
        var graph = graphCtrl.createCanvas(legend, element);
        var svg = graph.svg,
            height = graph.height,
            width = graph.width,
            margin = graph.margin,
            data = {},
            header = {},
            keys = {};
        if (timeseries) {
          if (timeseries.hasOwnProperty('instants')) {
            // This to not break profiles etc
            data = timeseries.instants;
            header = timeseries.series;
            if (timeseries.series.length === 0) {
              return;
            }
            keys = {x: 1, y: 0};
          } else {
            data = timeseries;
            keys = {x: 0, y: 1};
            header = [{
              name: "distance",
              quantity: null,
              type: "float",
              unit: "m"
            }, {
              name: "height",
              quantity: null,
              type: "float",
              unit: "m"
            }];
          }
        }
        var y = graphCtrl.maxMin(data, keys.y);
        y.scale = graphCtrl.scale(y.min, y.max, {
          range: [height, 0]
        });

        var line = d3.svg.line().interpolate('basis')
          .y(function (d) {
            return y.scale(d[keys.y]);
          });
        line.defined(function (d) { return !isNaN(parseFloat(d[keys.y])); });

        var x = {};
        if (header[keys.x].quantity === 'time') {
          x = graphCtrl.maxMin(data, keys.x);
          x.scale = graphCtrl.scale(
            scope.timeState.start, scope.timeState.end, {
              range: [0, width],
              type: 'time'
            });
          x.tickFormat = "";
          line.x(function (d) {
              return x.scale(d[keys.x]);
            });
        } else {
          x = graphCtrl.maxMin(data, keys.x);
          x.scale = graphCtrl.scale(x.min, x.max, {
            range: [0, width]
          });
          x.tickFormat = "";
          line.x(function (d) {
            return x.scale(d[keys.x]);
          });
        }

        // prevent errors
        if (x === undefined) { return; }

        var xAxis = graphCtrl.makeAxis(x.scale, {
          orientation: "bottom",
          tickFormat: x.tickFormat
        });
        var yAxis = graphCtrl.makeAxis(y.scale, {
          orientation: "left"
        });

        var zoomed = function () {
          // circleTooltip();
          svg.select(".x.axis").call(graphCtrl.makeAxis(x.scale, {
            orientation: "bottom",
            tickFormat: x.tickFormat
          }));
          svg.select(".x.grid")
            .call(graphCtrl.makeAxis(x.scale,  {
              orientation: "bottom",
              tickFormat: x.tickFormat
            })
            .tickSize(-height, 0, 0)
            .tickFormat(""));
          svg.select(".y.axis").call(graphCtrl.makeAxis(y.scale, {orientation: "left"}));
          svg.select(".y.grid")
              .call(graphCtrl.makeAxis(y.scale, {orientation: "left"})
              .tickSize(-width, 0, 0)
              .tickFormat(""));

          svg.select(".line")
              .attr("class", "line")
              .attr("d", line);
          if (header[keys.x].quantity === 'time') {
            scope.$apply(function () {
              // NOTE: maybe with $parent
              scope.$parent.timeState.start = x.scale.domain()[0].getTime();
              scope.$parent.timeState.end = x.scale.domain()[1].getTime();
              scope.$parent.timeState.changeOrigin = 'lineChart';
              scope.$parent.timeState.changedZoom = !scope.timeState.changedZoom;
            });
          }
        };

        var zoom = d3.behavior.zoom()
          .x(x.scale)
          .on("zoom", zoomed);

        svg.call(zoom);

        graphCtrl.drawAxes(svg, x, y, {
          height: height,
          width: width,
          axes: {
            x: xAxis,
            y: yAxis
          }
        });

        var clip = svg.append("svg:clipPath")
          .attr("id", "clip")
          .append("svg:rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", 0)
          .attr("height", height);

        if (scope.$parent.box.type !== 'elevation') {
          clip
            .transition()
            .ease('linear')
            .duration(1000)
            .attr("width", width);
        } else {
          clip
            .attr("width", width);
        }

        var chartBody = svg.append("g")
          .attr("clip-path", "url(#clip)");

        chartBody.append("svg:path")
          .datum(data)
          .attr("class", "line")
          .attr("d", line);

        if (scope.tools.active === 'profile') {

          zoom = d3.behavior.zoom()
            .x(x.scale)
            .on("zoom", null);
          svg.call(zoom);

          // Events do not bubble when with d3.
          // Put listener on body and rect to move bolletje on the line
          // in profile directive
          chartBody.on('mousemove', function () {
            var pos = x.scale.invert(d3.mouse(this)[0]);
            scope.$apply(function () {
              scope.$parent.box.mouseLoc = pos;
            });
          });

          svg.select('rect').on('mousemove', function () {
            var pos = x.scale.invert(d3.mouse(this)[0]);
            scope.$apply(function () {
              scope.$parent.box.mouseLoc = pos;
            });
          });
          
          svg.select('rect').on('mouseout', function () {
            scope.$apply(function () {
              scope.$parent.box.mouseLoc = undefined;
            });
          });
        }
      };
    };

    return {
      require: 'graph',
      link: link
    };
  });
