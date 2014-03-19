//graph.js

angular.module('graph', []);

angular.module('graph')
.directive('timeseriesRain', function () {
  var link = function (scope, element, attrs) {

    var svg = element.append('<svg id="chart-combined"></svg>');
    var graph = new NxtD3(d3.select('#chart-combined'), {
      width: 400,
      height: 300,
      start: scope.start,
      end: scope.end
    });
    graph.charts = {};

    var tsid;
    //promises

    scope.$watch('enabled', function () {
      var watches = [];
      if (!scope.enabled)  {
        graph.charts = {};
        if (watches.length > 0) {
          for (var i in watches) {
            var fn = watches[i];
            fn();
          }
        }
      } else {
        graph.charts = {};

        graph.addZoom();

        var rainseries = scope.$watch('rainseries', function () {
          if (graph.charts === undefined) { return; }
          if ((!graph.charts.hasOwnProperty('rain'))
              && scope.rainseries !== undefined) {
            graph.initiate(scope.rainseries, 'rain');
            graph.drawBars('rain', scope.rainseries);
          }
          if (graph.charts.hasOwnProperty('rain')) {
            graph.updateBars('rain', scope.rainseries);
          }
        });
        watches.push(rainseries);

        var changedZoom = scope.$watch('changedZoom', function (newVal,
                                                                oldVal) {
          if (newVal === oldVal) { return; }
          if (scope.$parent.timeState.changeOrigin === 'timeseries') {
            return;
          }
          graph.updateTemporalExtent('rain', scope.start, scope.end);
          if (graph.charts.hasOwnProperty('rain')) {
            graph.updateBars('rain', scope.rainseries);
          }
          if (graph.charts.hasOwnProperty('timeseries')) {
            graph.updateLine('timeseries', scope.timeseries.data);
          } else {
            graph.initiate(scope.timeseries.data, 'timeseries');
            graph.drawLine('timeseries', scope.timeseries.data);
          }
          graph.addZoom();
        });
        watches.push(changedZoom);

        var timeseries = scope.$watch('timeseries.data', function (newVal,
                                                                   oldVal) {
          if ((newVal === oldVal) ||
            (scope.timeseries === null)) { return; }
          if (scope.timeseries.data !== null) {
            if (scope.timeseries.id !== tsid) {
              if (graph.charts.hasOwnProperty('timeseries')) {
                graph.clearLine('timeseries');
              }
              graph.charts.timeseries = null;
            }
            graph.initiate(scope.timeseries.data, 'timeseries');
            graph.drawLine('timeseries', scope.timeseries.data);
          }
          if (graph.charts.hasOwnProperty('timeseries')) {
            if (scope.timeseries.data === null) {
              graph.clearLine('timeseries');
              return;
            }
            if (scope.timeseries.data.length === 0) {
              graph.clearLine('timeseries');
              return;
            }
            graph.updateLine('timeseries', scope.timeseries.data);
          }
          tsid = scope.timeseries.id;

        });
        watches.push(timeseries);
      }
    });


  };

  return {
    link: link,
    scope: {
      // TODO: add extra options (e.g. width)? 
      title: '=',
      rainseries: '=',
      timeseries: '=',
      xlabel: '=',
      ylabel: '=',
      enabled: '=',
      start: '=',
      end: '=',
      changedZoom: '='
    },
    restrict: 'E',
    replace: true,
    template: '<div class="graph-directive"></div>'
  };
});

angular.module('graph')
.directive('graph', function () {

  var controller = function ($scope) {
    this.createCanvas =  function (legend, element) {
      var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 50
      },
      maxwidth = 350,
      maxheight = 250;

      if (legend.yLabel) {
        margin.left = 45;
      }

      if (legend.xLabel) {
        margin.bottom = 15;
      }
      var width = maxwidth - margin.left - margin.right,
        height = maxheight - margin.top - margin.bottom;

      var svg = d3.select(element[0])
        .html("")
        .append("svg:svg")
        .attr('width', maxwidth)
        .attr('height', maxheight + 25)
        .append("svg:g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      if (!legend.pie) {
        svg.append("svg:rect")
          .attr("width", width)
          .attr("height", height)
          .attr("class", "plot");
        //Create title
        svg.append("text")
          .attr("x", width / 2)
          .attr("y", -50 / 2 + margin.top)
          .attr("class", "title")
          .style("text-anchor", "middle")
          .text(legend.title);
          
      }
              
      if (legend.xLabel) {
         //Create X axis label   
        svg.append("text")
           .attr("x", width / 2)
           .attr("y",  height + margin.bottom * 2)
           .style("text-anchor", "middle")
           .text(legend.xLabel);
      }

      if (legend.yLabel) {
        //Create Y axis label
        svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 0 - margin.left)
          .attr("x", 0 - (height / 2))
          .attr("dy", "0.9em")
          .style("text-anchor", "middle")
          .text(legend.yLabel);
      }
      return {
        svg: svg,
        height: height,
        width: width,
        margin: margin
      };
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
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", function (d) {
            return "rotate(-45)";
          });

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

      svg.append("g")
        .attr("class", "x grid")
        .attr("transform", "translate(0, " + (options.height + 6) + ")")
        .call(xAxis
          .tickSize(-options.height, 0, 0)
        )
        .selectAll("text")
          .style("visibility", "hidden");

      svg.append("g")
        .attr("class", "y grid")
        .call(yAxis
          .tickSize(-options.width, 0, 0)
          .tickFormat("")
        );
    };
  };

  var link = function (scope, element, attrs, graphCtrl) {

    scope.$watch('data', function () {
      if (scope.data !== undefined && graphCtrl.callChart !== undefined) {
        var ymin = 0.0,
            ymax = 0.0,
            xmin = 0.0,
            xmax = 0.0;
        if (attrs.ymax) {
          ymax = parseFloat(attrs.ymax);
        }
        if (attrs.ymin) {
          ymin = parseFloat(attrs.ymin);
        }
        if (attrs.xmax) {
          xmax = parseFloat(attrs.xmax);
        }
        if (attrs.xmin) {
          xmin = parseFloat(attrs.xmin);
        }
        var legend = {
          title: scope.title,
          xLabel: scope.xlabel,
          yLabel: scope.ylabel,
          // maybe from scope so controller determines labels
          ymin: ymin,
          ymax: ymax,
          xmin: xmin,
          xmax: xmax,
          type: attrs.type
        };
        // clear the chart beforehand
        // NOTE: Still needs some good error handling. 
        // Such as not calling chart if data is malformed
        d3.select(element[0]).html("");
        graphCtrl.callChart(scope.data, element, legend);
      } else {
        // empty the mofo beforehand
        d3.select(element[0]).html("");
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
    graphCtrl.callChart = function (data, element, legend) {
        var graph = graphCtrl.createCanvas(legend, element);
        var svg = graph.svg,
            height = graph.height,
            width = graph.width,
            margin = graph.margin;


        var x = graphCtrl.maxMin(data, '1');
        var y = graphCtrl.maxMin(data, '0');

        x.scale = graphCtrl.scale(scope.timeState.start, scope.timeState.end, {
          range: [0, width],
          type: 'time'
        });
        y.scale = graphCtrl.scale(y.min, y.max, {
          range: [height, 0]
        });

        graphCtrl.drawAxes(svg, x, y, {
          height: height,
          width: width
        });

        var zoomed = function () {
          svg.select(".x.axis")
            .call(graphCtrl.makeAxis(x.scale, {orientation: "bottom"}))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function (d) {
                return "rotate(-45)";
              });

          // svg.select("g")
          svg.selectAll(".bar")
            .attr("x", function (d) { return x.scale(d[1]) - 0.5; })
            .attr("transform", "translate(" + "translate(" + d3.event.translate[0] + ",0)scale(" + d3.event.scale + ", 1)");
          scope.$apply(function () {
              // step out of isolate scope with $parent.
              scope.$parent.timeState.start = x.scale.domain()[0].getTime();
              scope.$parent.timeState.end = x.scale.domain()[1].getTime();
              scope.$parent.timeState.changeOrigin = 'barChart';
              scope.$parent.timeState.changedZoom = !scope.timeState.changedZoom;
            });
        };
        
        var zoom = d3.behavior.zoom()
          .x(x.scale)
          .y(y.scale)
          .on("zoom", zoomed);

        // Bar Chart specific stuff
        svg.selectAll(".bar")
          .data(data)
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function (d) { return x.scale(d[1]) - 0.5; })
            .attr("y", function (d) { return y.scale(d[0]) - 0.5; })
            .attr("width", 5)
            .attr("height", function (d) { return height - y.scale(d[0]); });

        svg.call(zoom);
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
            radius = Math.min(width, height) / 1.4;


        var total = 0;
        var pie = d3.layout.pie()
          .value(function (d) {
              total += d.data;
              return d.data;
            })
          .sort(null);
        var arc = d3.svg.arc()
            .innerRadius(radius - 80)
            .outerRadius(radius - 20);

        var text = svg.append("text");
        var path = svg.datum(data).selectAll("path")
            .data(pie)
          .enter().append("path")
            .attr("fill", function (d, i) {return d.data.color; })
            .attr("d", arc)
            .attr("transform", "translate(" +
              width / 2  + ", " + height / 2 + ")")
            .on("mouseenter", function (d) {
              text = svg.select("text")
                  .attr("transform", "translate(" + width / 2 +
                    ", " + (20 + height) + ")")
                  .attr("dy", "2em")
                  .style("text-anchor", "middle")
                  .style("fill", "#222")
                  .attr("class", "on")
                  .text(function () {
                    var text = "";
                    try {
                      text = d.data.label.split('-')[2];
                      text = (text !== undefined) ? text : d.data.label;
                    } catch (e) {
                      if (d.data.label === 0) {
                        text = 'Geen data';
                      } else {
                        text = 'Overig';
                      }
                    }
                    text += " - " +
                      Math.round(d.data.data / total * 10000) / 100 + " %";
                    return text;
                  });
            })
            .each(function (d) { this._current = d; });
      };
    };

    return {
      link: link,
      require: 'graph'
    };
  });

angular.module('graph')
  .directive('scatter', function () {
    var link  = function (scope, element, attrs, graphCtrl) {
      graphCtrl.callChart = function (data, element, legend) {
        var graph = graphCtrl.createCanvas(data, element, legend);
        var svg = graph.svg,
            height = graph.height,
            width = graph.width,
            margin = graph.margin;

        var x = graphCtrl.maxMin(data, 'x');
        var y = graphCtrl.maxMin(data, 'y');

        x.scale = graphCtrl.scale(scope.timeState.start, scope.timeState.end, {
          range: [0, width],
        });
        y.scale = graphCtrl.scale(y.min, y.max, {
          range: [height, 0]
        });
        var xdata = function (d) { return x.scale(d.x); };
        var ydata = function (d) { return y.scale(d.y); };

        var circles = svg.selectAll("circle")
                            .data(data)
                            .enter()
                              .append("circle")
                                .attr("cx", xdata)
                                .attr("cy", ydata)
                                .attr("r", 3)
                                .attr("opacity", 0.8)
                                .attr("fill", 'crimson')
                              .on("mouseover", function () {
                                d3.select(this).attr("r", 6);
                              })
                              .on("mouseout", function () {
                                d3.select(this).attr("r", 3);
                              });
        
        var zoomed = function () {
          svg.select(".x.axis").call(graphCtrl.makeAxis(x.scale,
                                     {orientation: "bottom"}))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function (d) {
              return "rotate(-45)";
            });
          svg.select(".x.grid")
              .call(graphCtrl.makeAxis(x.scale, {orientation: "bottom"})
              .tickSize(-height, 0, 0)
              .tickFormat(""));
          svg.select(".y.axis").call(graphCtrl.makeAxis(y.scale,
                                     {orientation: "left"}));
          svg.select(".y.grid")
              .call(graphCtrl.makeAxis(y.scale, {orientation: "left"})
              .tickSize(-width, 0, 0)
              .tickFormat(""));
          svg.selectAll("circle")
              .attr("cx", xdata)
              .attr("cy", ydata);
        };

        var zoom = d3.behavior.zoom()
          .x(x.scale)
          .y(y.scale)
          .on("zoom", zoomed);

        svg.call(zoom);

        graphCtrl.drawAxes(svg, x, y, {
          height: height,
          width: width
        });
      };
    };

    return {
      require: 'graph',
      link: link
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

        var line = d3.svg.line()
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
          .attr("width", width)
          .attr("height", height);


        var chartBody = svg.append("g")
          .attr("clip-path", "url(#clip)");

        chartBody.append("svg:path")
          .datum(data)
          .attr("class", "line")
          .attr("d", line);

        if (scope.tools.active === 'profile') {

          var zoom = d3.behavior.zoom()
            .x(x.scale)
            .on("zoom", null);
          svg.call(zoom);

          var rect = d3.select(graph.svg[0][0]).select('rect');
          rect.on('mousemove', function () {
            var pos = x.scale.invert(d3.mouse(this)[0]);
            scope.$apply(function () {
              scope.$parent.box.mouseLoc = pos;
            });
          });
          
          d3.select(graph.svg[0][0]).on('mouseout', function () {
            console.log('mouseout');
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


angular.module('graph')
.directive('multiline', function () {
  var link = function (scope, element, attrs, graphCtrl) {
    graphCtrl.defineChartType = function (y) {
      var d3graph =  d3.svg.line()
          .y(function (d) {
            return y(d.value);
          });

      return {
        cssClass: "line",
        d3graph: d3graph
      };
    };

    graphCtrl.callChart = function (data, element, legend) {
      var graph = graphCtrl.createCanvas(data, element, legend);
      var svg = graph.svg,
          height = graph.height,
          width = graph.width,
          margin = graph.margin;

      var x = {};
      

      var ymin = d3.min(data, function (d) {
              return Math.min(d.value, d.value2);
            });
      var ymax = d3.max(data, function (d) {
              return Math.max(d.value, d.value2);
            });
      var xmin = d3.min(data, function (d) {
              return Math.min(d.date, d.date2);
            });
      var xmax = d3.max(data, function (d) {
              return Math.max(d.date, d.date2);
            });

      var y = d3.scale.linear()
        .domain([ymin, ymax])
        .range([height, 0]);


       // check if data is time based or distance based
      var chartType = {},
          make_x_axis = {},
          make_y_axis = {},
          xAxis = {},
          yAxis = {},
          line2 = {};
      if (data[0].hasOwnProperty('date')) {
        x = d3.time.scale()
          .domain([xmin, xmax])
          .range([0, width]);

        chartType = graphCtrl.defineChartType(y);
        line2 =  d3.svg.line()
            .y(function (d) {
              return y(d.value2);
            })
            .x(function (d) {
            if (legend.type === "kpi") {
              return x(Date.parse(d.date2));
            } else {
              return x(d.date2);
            }
          });
        line2.defined(function (d) { return !isNaN(d.value2); });

        chartType.d3graph.x(function (d) {
            if (legend.type === "kpi") {
              return x(Date.parse(d.date));
            } else {
              return x(d.date);
            }
          });

        make_x_axis = function () {
          return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat("")
            .ticks(5);
        };

        xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(5);

      } else if (data[0].hasOwnProperty('distance')) {
        x = d3.scale.linear()
          .domain(d3.extent(data, function (d) {
            return d.distance;
          }))
          .range([0, width]);

        chartType.d3graph.x(function (d) {
          return x(d.distance);
        });

        make_x_axis = function () {
          return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.format(".2"))
            .ticks(5);
        };

        xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(5);
      }

      var zoomed = function () {
        svg.select(".x.axis").call(xAxis);
        svg.select(".x.grid")
            .call(make_x_axis()
            .tickSize(-height, 0, 0)
            .tickFormat(""));
        svg.select(".y.axis").call(yAxis);
        svg.select(".y.grid")
            .call(make_y_axis()
            .tickSize(-width, 0, 0)
            .tickFormat(""));
        svg.select("." + chartType.cssClass)
            .attr("class", chartType.cssClass)
            .attr("d", chartType.d3graph);
        svg.select(".line2")
            .attr("class", "line2")
            .attr("d", line2);
      };

      var zoom = d3.behavior.zoom()
        .x(x)
        .on("zoom", zoomed);

      svg.call(zoom);

      //TODO: Ticks hardcoded, make variable
      make_y_axis = function () {
        return d3.svg.axis()
          .scale(y)
          .orient("left")
          .ticks(5);
      };

      svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis);

      yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

      svg.append("g")
        .attr("class", "x grid")
        .attr("transform", "translate(0, " + (height + 6) + ")")
        .call(make_x_axis()
          .tickSize(-height, 0, 0)
        );

      svg.append("g")
        .attr("class", "y grid")
        .call(make_y_axis()
          .tickSize(-width, 0, 0)
          .tickFormat("")
        );

      //Create X axis label   
      svg.append("text")
        .attr("x", width / 2)
        .attr("y",  height + margin.bottom * 2)
        .style("text-anchor", "middle")
        .text(legend.xLabel);
            
      //Create Y axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "0.9em")
        .style("text-anchor", "middle")
        .text(legend.yLabel);

      var clip = svg.append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

      var chartBody = svg.append("g")
        .attr("clip-path", "url(#clip)");

      chartBody.append("svg:path")
        .datum(data)
        .attr("class", chartType.cssClass)
        .attr("d", chartType.d3graph);
      chartBody.append("svg:path")
        .datum(data)
        .attr("class", "line2")
        .style("stroke", "crimson")
        .attr("d", line2);
    };

    scope.$watch('data', function () {
      if (scope.data !== undefined) {
        var ymin = 0.0,
            ymax = 0.0,
            xmin = 0.0,
            xmax = 0.0;
        if (attrs.ymax) {
          ymax = parseFloat(attrs.ymax);
        }
        if (attrs.ymin) {
          ymin = parseFloat(attrs.ymin);
        }
        if (attrs.xmax) {
          xmax = parseFloat(attrs.xmax);
        }
        if (attrs.xmin) {
          xmin = parseFloat(attrs.xmin);
        }
        var legend = {
          title: scope.title,
          xLabel: scope.xlabel,
          yLabel: scope.ylabel,
          // maybe from scope so controller determines labels
          ymin: ymin,
          ymax: ymax,
          xmin: xmin,
          xmax: xmax,
          type: attrs.type
        };
        // clear the chart beforehand
        // NOTE: Still needs some good error handling. 
        // Such as not calling chart if data is malformed
        d3.select(element[0]).html("");
        graphCtrl.callChart(scope.data, element, legend);
      } else {
        // empty the mofo beforehand
        d3.select(element[0]).html("");
      }
    });
  };

  return {
    link: link,
    require: 'graph'
  };
});


angular.module('graph')
.directive('multitypeline', function () {
  var link = function (scope, element, attrs, graphCtrl) {
    graphCtrl.callChart = function (data, element, legend) {
      var graph = graphCtrl.createCanvas(data, element, legend);
      var svg = graph.svg,
          height = graph.height,
          width = graph.width,
          margin = graph.margin;

      var x = {};
    
      var xmin = d3.min(data, function (d) {
              return Math.min(d.date, d.date2);
            });
      var xmax = d3.max(data, function (d) {
              return Math.max(d.date, d.date2);
            });

      var y = d3.scale.linear()
          .domain(d3.extent(data, function (d) {
                        return d.value;
                      }))
          .range([height, 0]);

      var y1 = d3.scale.linear()
          .domain(d3.extent(data, function (d) {
            return d.value2;
          }))
          .range([height, 0]);


      // check if data is time based or distance based
      var line2 = {},
          line = {},
          make_x_axis = {},
          make_y_axis = {},
          xAxis = {};
      if (data[0].hasOwnProperty('date')) {
        x = d3.time.scale()
          .domain([xmin, xmax])
          .range([0, width]);

        line = d3.svg.line()
              .y(function (d) {
                return y(d.value);
              })
              .x(function (d) {
              if (legend.type === "kpi") {
                return x(Date.parse(d.date));
              } else {
                return x(d.date);
              }
            });
        line.defined(function (d) { return !isNaN(d.value); });

        line2 = d3.svg.line()
              .y(function (d) {
                return y1(d.value2);
              })
              .x(function (d) {
              if (legend.type === "kpi") {
                return x(Date.parse(d.date2));
              } else {
                return x(d.date2);
              }
            });
        line2.defined(function (d) { return !isNaN(d.value2); });

        make_x_axis = function () {
          return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat("")
            .ticks(5);
        };

        xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(5);

      } else if (data[0].hasOwnProperty('distance')) {
        x = d3.scale.linear()
          .domain(d3.extent(data, function (d) {
            return d.distance;
          }))
          .range([0, width]);

        line.x(function (d) {
          return x(d.distance);
        });

        make_x_axis = function () {
          return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.format(".2"))
            .ticks(5);
        };

        xAxis = d3.svg.axis()
          .scale(x)
          .orient("bottom")
          .ticks(5);
      }

      var zoomed = function () {
        svg.select(".x.axis").call(xAxis);
        svg.select(".x.grid")
            .call(make_x_axis()
            .tickSize(-height, 0, 0)
            .tickFormat(""));
        svg.select(".y.axis").call(yAxis);
        svg.select(".y1.axis").call(y1Axis);
        svg.select(".line")
            .attr("class", "line")
            .attr("d", line);
        svg.select(".line2")
            .attr("class", "line2")
            .attr("d", line2);
      };

      var zoom = d3.behavior.zoom()
        .x(x)
        .on("zoom", zoomed);

      svg.call(zoom);

      //TODO: Ticks hardcoded, make variable
      make_y_axis = function (y) {
        return d3.svg.axis()
          .scale(y)
          .orient("left")
          .ticks(5);
      };

      svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + height + ")")
        .call(xAxis);

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5);

      var y1Axis = d3.svg.axis()
        .scale(y1)
        .orient("right")
        .ticks(5);

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

      svg.append("g")
        .attr("class", "y1 axis")
        .attr("transform", "translate(" + width + " ,0)")
        .call(y1Axis);

      //Create X axis label   
      svg.append("text")
        .attr("x", width / 2)
        .attr("y",  height + margin.bottom * 2)
        .style("text-anchor", "middle")
        .text(legend.xLabel);
            
      //Create Y axis label
      svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "0.9em")
        .style("text-anchor", "middle")
        .text(legend.yLabel);

      var clip = svg.append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height);

      var chartBody = svg.append("g")
        .attr("clip-path", "url(#clip)");

      chartBody.append("svg:path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);
      chartBody.append("svg:path")
        .datum(data)
        .attr("class", "line2")
        .style("stroke", "crimson")
        .attr("d", line2);
    };

    scope.$watch('data', function () {
      if (scope.data !== undefined) {
        var ymin = 0.0,
            ymax = 0.0,
            xmin = 0.0,
            xmax = 0.0;
        if (attrs.ymax) {
          ymax = parseFloat(attrs.ymax);
        }
        if (attrs.ymin) {
          ymin = parseFloat(attrs.ymin);
        }
        if (attrs.xmax) {
          xmax = parseFloat(attrs.xmax);
        }
        if (attrs.xmin) {
          xmin = parseFloat(attrs.xmin);
        }
        var legend = {
          title: scope.title,
          xLabel: scope.xlabel,
          yLabel: scope.ylabel,
          // maybe from scope so controller determines labels
          ymin: ymin,
          ymax: ymax,
          xmin: xmin,
          xmax: xmax,
          type: attrs.type
        };
        // clear the chart beforehand
        // NOTE: Still needs some good error handling. 
        // Such as not calling chart if data is malformed
        d3.select(element[0]).html("");
        graphCtrl.callChart(scope.data, element, legend);
      } else {
        // empty the mofo beforehand
        d3.select(element[0]).html("");
      }
    });
  };

  return {
    link: link,
    require: 'graph'
  };
});
