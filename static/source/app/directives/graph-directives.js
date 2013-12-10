//graph.js

angular.module('graph', []);

angular.module('graph')
.directive('graph', function () {

  var controller = function ($scope) {
    this.createCanvas =  function(legend, element) {
      var margin = {
        top: 20,
        right: 20,
        bottom: 10,
        left: 30
      },
      maxwidth = 350,
      maxheight = 200;

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
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

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
              
      if (legend.xLabel ){
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
      var max = d3.max(data, function(d){
              return Number(d[key]);
            });

      var min = d3.min(data, function(d){
              return Number(d[key]);
            });
      return {
        max: max, 
        min: min
      };
    };

    this.scale = function (min, max, options) {
      if (options.type === 'time'){
        var scale = d3.time.scale()
            .domain([min, max])
            .range([options.range[0], options.range[1]]);
      } else if (options.type === 'kpi') {
          var scale = d3.time.scale()
            .domain(d3.extent(options.data, function (d) {
                return Date.parse(d.date)
              }))
            .range([options.range[0], options.range[1]]);
      } else {
        var scale = d3.scale.linear()
            .domain([min, max])
            .range([options.range[0], options.range[1]]);
      }
      return scale;
    };

    this.makeAxis = function (scale, options) {
      if (options.tickFormat){
        var axis = d3.svg.axis()
                .scale(scale)
                .orient(options.orientation)
                .tickFormat(options.tickFormat)
                .ticks(5); 
      } else {
        var axis = d3.svg.axis()
              .scale(scale)
              .orient(options.orientation)
              .ticks(5);        
      }
      return axis
      };
    this.drawAxes = function (svg, x, y, options){
      if (options.axes) {
        var xAxis = options.axes.x;
        var yAxis = options.axes.y;
      } else {
        var xAxis = this.makeAxis(x.scale, {orientation: "bottom"});
        var yAxis = this.makeAxis(y.scale, {orientation: "left"});
      }
      svg.append("svg:g")
        .attr("class", "x axis")
        .attr("transform", "translate(0, " + options.height + ")")
        .call(xAxis);

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

      svg.append("g")
        .attr("class", "x grid")
        .attr("transform", "translate(0, " + (options.height + 6) + ")")
        .call(xAxis
          .tickSize(-options.height, 0, 0)
        );

      svg.append("g")
        .attr("class", "y grid")
        .call(yAxis
          .tickSize(-options.width, 0, 0)
          .tickFormat("")
        );
    };
  };

  var link = function (scope, element, attrs, graphCtrl){

    scope.$watch('data', function () {
      if (scope.data !== undefined && graphCtrl.callChart !== undefined) {
        if (attrs.ymax){
          var ymax = parseFloat(attrs.ymax);
        } 
        if (attrs.ymin){
          var ymin = parseFloat(attrs.ymin);
        };
        if (attrs.xmax){
          var xmax = parseFloat(attrs.xmax);
        } 
        if (attrs.xmin){
          var xmin = parseFloat(attrs.xmin);
        };
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
  }
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


        var x = graphCtrl.maxMin(data, 'date');
        var y = graphCtrl.maxMin(data, 'value');

        x.scale = graphCtrl.scale(x.min, x.max, {
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

        // Bar Chart specific stuff
        svg.selectAll(".bar")
          .data(data)
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x.scale(d.date) - .5; })
            .attr("y", function(d) { return height - y.scale(d.value) - .5; })
            .attr("width", 10)
            .attr("height", function(d) { return y.scale(d.value); });
        svg.append("line")
          .attr("x1", 0)
          .attr("x2", width * data.length)
          .attr("y1", height - .5)
          .attr("y2", height - .5)
          .style("stroke", "#ccc");
    };
  };
  return {
    link: link,
    require: 'graph'
  }
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


        var total=0;
        var pie = d3.layout.pie()
          .value(function (d) { 
              total += d.data
            return d.data})
          .sort(null);
        var arc = d3.svg.arc()
            .innerRadius(radius - 80)
            .outerRadius(radius - 20);

        var text = svg.append("text");
        var path = svg.datum(data).selectAll("path")
            .data(pie)
          .enter().append("path")
            .attr("fill", function(d, i) {return d.data.color; })
            .attr("d", arc)
            .attr("transform", "translate(" + width / 2  + ", " + height / 2 + ")")
            .on("mouseenter", function(d) {
              text = svg.select("text")
                  .attr("transform", "translate("+ width /2 + ", " + (20 + height) +")")
                  .attr("dy", ".5em")
                  .style("text-anchor", "middle")
                  .style("fill", "#222")
                  .attr("class", "on")
                  .text(function() {
                    try {
                      var text = d.data.label.split('-')[2];
                      text = (text !== undefined) ? text : d.data.label;
                    } catch (e) {
                      if (d.data.label === 0){
                        var text = 'Geen data';                      
                      } else {
                        var text = 'Overig';
                      }
                    }
                    text += " - " + Math.round(d.data.data/total * 10000)/100 + " %";
                    return text;
                  });
              })
            .each(function(d) { this._current = d; }); // store the initial angles


        // d3.selectAll("input")
        //     .on("change", change);

        //TODO: make watch do change.
        // function change() {
        //   var value = this.value;
        //   clearTimeout(timeout);
        //   pie.value(function(d) { return d[value]; }); // change the value function
        //   path = path.data(pie); // compute the new angles
        //   path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
        // };

        // function arcTween(a) {
        //   var i = d3.interpolate(this._current, a);
        //   this._current = i(0);
        //   return function(t) {
        //     return arc(i(t));
        //   };



      };

    };

    return {
      link: link,
      require: 'graph'
    }

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

        x.scale = graphCtrl.scale(x.min, x.max, {
          range: [0, width], 
        });
        y.scale = graphCtrl.scale(y.min, y.max, {
          range: [height, 0]
        });
        var xdata = function (d){ return x.scale(d.x)};
        var ydata = function (d){ return y.scale(d.y)};

        var circles = svg.selectAll("circle")
                            .data(data)
                            .enter()
                              .append("circle")
                                .attr("cx", xdata)
                                .attr("cy", ydata)
                                .attr("r", 3)
                                .attr("opacity", 0.8)
                                .attr("fill", 'crimson')
                              .on("mouseover", function() { d3.select(this).attr("r", 6) })
                              .on("mouseout", function() { d3.select(this).attr("r", 3) });
        
        var zoomed = function () {
          svg.select(".x.axis").call(graphCtrl.makeAxis(x.scale, {orientation:"bottom"}));
          svg.select(".x.grid")
              .call(graphCtrl.makeAxis(x.scale, {orientation:"bottom"})
              .tickSize(-height, 0, 0)
              .tickFormat(""));
          svg.select(".y.axis").call(graphCtrl.makeAxis(y.scale, {orientation:"left"}));
          svg.select(".y.grid")
              .call(graphCtrl.makeAxis(y.scale, {orientation:"left"})
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
      }
  });



angular.module('graph')
  .directive('line', function () {
    var link  = function (scope, element, attrs, graphCtrl) {

       graphCtrl.callChart = function (data, element, legend) {
        var graph = graphCtrl.createCanvas(legend, element);
        var svg = graph.svg,
            height = graph.height,
            width = graph.width,
            margin = graph.margin;

        var y = graphCtrl.maxMin(data, 'value');

        y.scale = graphCtrl.scale(y.min, y.max, {
          range: [height, 0]
        });

        var line = d3.svg.line()
          .y(function (d) {
            return y.scale(d.value);
          });
        line.defined(function(d) { return !isNaN(d.value); });

        if (data[0].hasOwnProperty('date')) {
          var x = graphCtrl.maxMin(data, 'date');
          if (legend.type === "kpi") {
            x.scale = graphCtrl.scale(x.min, x.max, {
              range: [0, width],
              type: 'kpi',
              data: data
            });
            line.x(function (d) {
              return x.scale(Date.parse(d.date));
            }); 
          } else {
            x.scale = graphCtrl.scale(x.min, x.max, {
              range: [0, width],
              type: 'time'
            });
            x.tickFormat = "";
            line.x(function (d) {
              return x.scale(d.date);
            });            
          }
        } else if (data[0].hasOwnProperty('distance')) {
          var x = graphCtrl.maxMin(data, 'distance');
          x.scale = graphCtrl.scale(x.min, x.max, {
            range: [0, width],
          });
          x.tickFormat = d3.format(".2");
          line.x(function (d) {
            return x.scale(d.distance);
          });

        }

        // prevent errors
        if (x === undefined) { return; }

        var xAxis = graphCtrl.makeAxis(x.scale, {
          orientation:"bottom",
          tickFormat: x.tickFormat
        });
        var yAxis = graphCtrl.makeAxis(y.scale, {
          orientation:"left"
        });

        var zoomed = function () {
          // circleTooltip();
          svg.select(".x.axis").call(graphCtrl.makeAxis(x.scale, {
            orientation:"bottom",
            tickFormat: x.tickFormat
          }));
          svg.select(".x.grid")
              .call(graphCtrl.makeAxis(x.scale,  {
                orientation:"bottom",
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
          .attr("class","line")
          .attr("d", line)


      // var circleTooltip = function () {
      //   svg.selectAll("circle").remove();
      //   svg.selectAll("text.d3tooltip").remove();
      //   svg.selectAll("circle")
      //     .data(data)
      //     .enter()
      //     .append("circle")
      //       .attr("class","tipcircle")
      //       .attr("cx", function(d,i){return x(d.date)})
      //       .attr("cy",function(d,i){return y(d.value)})
      //       .attr("r",12)
      //       .style("stroke", "rgba(255,255,255,0)")//1e-6
      //       .style("fill", "rgba(255,255,255,0)")//1e-6
      //       .on("mouseenter", function(d){
      //         var format = d3.format(".2f")
      //         d3.select(this.parentElement)
      //           .append("text")
      //           .attr("x", x(d.date))
      //           .attr("y", y(d.value))
      //           .attr("class", "d3tooltip")
      //           .text(format(d.value))
      //       })
      //       .on("mouseout", function (d) {
      //         d3.select(this.parentElement).select("text.d3tooltip").remove();
      //       });
      // };
      // circleTooltip();
            
      };

    };

    return {
      require: 'graph',
      link: link
      }
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
          }
        };

       graphCtrl.callChart = function (data, element, legend) {
        var graph = graphCtrl.createCanvas(data, element, legend);
        var svg = graph.svg,
            height = graph.height,
            width = graph.width,
            margin = graph.margin;

         var x = {};
        

        var ymin = d3.min(data, function(d){
                return Math.min(d.value, d.value2)
              });
        var ymax = d3.max(data, function(d){
                return Math.max(d.value, d.value2)
              });
        var xmin = d3.min(data, function(d){
                return Math.min(d.date, d.date2)
              });
        var xmax = d3.max(data, function(d){
                return Math.max(d.date, d.date2)
              });

         var y = d3.scale.linear()
            .domain([ymin, ymax])
            .range([height, 0]);


       // check if data is time based or distance based
        if (data[0].hasOwnProperty('date')) {
          x = d3.time.scale()
            .domain([xmin, xmax])
            .range([0, width]);

        var chartType = graphCtrl.defineChartType(y);
        var line2 =  d3.svg.line()
              .y(function (d) {
                return y(d.value2);
              })
              .x(function (d) {
              if (legend.type === "kpi"){
                return x(Date.parse(d.date2));
              } else {
                return x(d.date2);
              }
          });
          line2.defined(function(d) { return !isNaN(d.value2); });

          chartType.d3graph.x(function (d) {
              if (legend.type === "kpi"){
                return x(Date.parse(d.date));
              } else {
                return x(d.date);
              }
          });

          var make_x_axis = function () {
            return d3.svg.axis()
              .scale(x)
              .orient("bottom")
              .tickFormat("")
              .ticks(5);
          };

          var xAxis = d3.svg.axis()
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

          var make_x_axis = function () {
            return d3.svg.axis()
              .scale(x)
              .orient("bottom")
              .tickFormat(d3.format(".2"))
              .ticks(5);
          };

          var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(5);
        };

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
              .attr("d", chartType.d3graph)
          svg.select(".line2")
              .attr("class", "line2")
              .attr("d", line2);
        };

        var zoom = d3.behavior.zoom()
          .x(x)
          .on("zoom", zoomed);

        svg.call(zoom);

        //TODO: Ticks hardcoded, make variable
        var make_y_axis = function () {
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
          if (attrs.ymax){
            var ymax = parseFloat(attrs.ymax);
          } 
          if (attrs.ymin){
            var ymin = parseFloat(attrs.ymin);
          };
          if (attrs.xmax){
            var xmax = parseFloat(attrs.xmax);
          } 
          if (attrs.xmin){
            var xmin = parseFloat(attrs.xmin);
          };
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
// };
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
      
        var xmin = d3.min(data, function(d){
                return Math.min(d.date, d.date2)
              });
        var xmax = d3.max(data, function(d){
                return Math.max(d.date, d.date2)
              });

        var y = d3.scale.linear()
            .domain(d3.extent(data, function (d) {
                          return d.value
                        }))
            .range([height, 0]);

        var y1 = d3.scale.linear()
            .domain(d3.extent(data, function (d) {
              return d.value2
            }))
            .range([height, 0]);


       // check if data is time based or distance based
        if (data[0].hasOwnProperty('date')) {
          x = d3.time.scale()
            .domain([xmin, xmax])
            .range([0, width]);

        var line = d3.svg.line()
              .y(function (d) {
                return y(d.value);
              })
              .x(function (d) {
              if (legend.type === "kpi"){
                return x(Date.parse(d.date));
              } else {
                return x(d.date);
              }
          });
        line.defined(function(d) { return !isNaN(d.value); });

        var line2 = d3.svg.line()
              .y(function (d) {
                return y1(d.value2);
              })
              .x(function (d) {
              if (legend.type === "kpi"){
                return x(Date.parse(d.date2));
              } else {
                return x(d.date2);
              }
          });
        line2.defined(function(d) { return !isNaN(d.value2); });

          var make_x_axis = function () {
            return d3.svg.axis()
              .scale(x)
              .orient("bottom")
              .tickFormat("")
              .ticks(5);
          };

          var xAxis = d3.svg.axis()
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

          var make_x_axis = function () {
            return d3.svg.axis()
              .scale(x)
              .orient("bottom")
              .tickFormat(d3.format(".2"))
              .ticks(5);
          };

          var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .ticks(5);
        };

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
              .attr("d", line)
          svg.select(".line2")
              .attr("class", "line2")
              .attr("d", line2);
        };

        var zoom = d3.behavior.zoom()
          .x(x)
          .on("zoom", zoomed);

        svg.call(zoom);

        //TODO: Ticks hardcoded, make variable
        var make_y_axis = function (y) {
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

        // svg.append("g")
        //   .attr("class", "x grid")
        //   .attr("transform", "translate(0, " + (height + 6) + ")")
        //   .call(make_x_axis()
        //     .tickSize(-height, 0, 0)
        //   );

        // svg.append("g")
        //   .attr("class", "y grid")
        //   .call(make_y_axis(y)
        //     .tickSize(-width, 0, 0)
        //     .tickFormat("")
        //   );


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
          if (attrs.ymax){
            var ymax = parseFloat(attrs.ymax);
          } 
          if (attrs.ymin){
            var ymin = parseFloat(attrs.ymin);
          };
          if (attrs.xmax){
            var xmax = parseFloat(attrs.xmax);
          } 
          if (attrs.xmin){
            var xmin = parseFloat(attrs.xmin);
          };
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
// };
  return {
    link: link,
    require: 'graph'
  };
});



angular.module('graph')
.directive('nxtLineGraph', function () {
  var chart = function (data, element, legend) {
      var margin = {
          top: 20,
          right: 20,
          bottom: 10,
          left: 30
        },
        maxwidth = 350,
        maxheight = 200;

      if (legend.yLabel) {
        margin.left = 45;
      }

      if (legend.xLabel) {
        margin.bottom = 15;
      }

      var width = maxwidth - margin.left - margin.right,
        height = maxheight - margin.top - margin.bottom;

      if (legend.ymax == undefined){
        legend.ymax = d3.max(data, function(d){
              return d.value
            });
      }
      if (legend.ymin == undefined){
        legend.ymin = d3.min(data, function(d){
              return d.value
            });
      }

      var y = d3.scale.linear()
          .domain([legend.ymin, legend.ymax])
          .range([height, 0]);

      var line = d3.svg.line()
          .y(function (d) {
            return y(d.value);
          });
      line.defined(function(d) { return !isNaN(d.value); });

      var x = {};
      
      // check if data is time based or distance based
      if (data[0].hasOwnProperty('date')) {
        x = d3.time.scale()
          .domain(d3.extent(data, function (d) {
            if (legend.type === "kpi"){
              return Date.parse(d.date);            
            } else {
              return d.date;
            }
          }))
          .range([0, width]);

        line.x(function (d) {
            if (legend.type === "kpi"){
              return x(Date.parse(d.date));
            } else {
              return x(d.date);
            }
        });

        var make_x_axis = function () {
          return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat("")
            .ticks(5);
        };

        var xAxis = d3.svg.axis()
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

        var make_x_axis = function () {
          return d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.format(".2"))
            .ticks(5);
        };

        var xAxis = d3.svg.axis()
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
        svg.select(".line")
            .attr("class", "line")
            .attr("d", line);
      };

      var zoom = d3.behavior.zoom()
        .x(x)
        .on("zoom", zoomed);
      
      // Make sure your context as an id or so...
      var svg = d3.select('#chart')
        .html("")
        .append("svg:svg")
        .attr('width', maxwidth)
        .attr('height', maxheight + 25)
        .append("svg:g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(zoom);

      svg.append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "plot");


      //TODO: Ticks hardcoded, make variable
      var make_y_axis = function () {
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
          
     //Create title
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -50 / 2 + margin.top)
        .attr("class", "title")
        .style("text-anchor", "middle")
        .text(legend.title);
         
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

    };

  return {
    restrict: 'E',
    template: '<div id="chart"></div>',
    // scope: {
    //   // TODO: add extra options (e.g. width)? 
    //   title: '=',
    //   data: '=',
    //   xlabel: '=',
    //   ylabel: '=',
    //   xmin: '=',
    //   xmax: '=',
    //   ymin: '=',
    //   ymax: '=',
    //   type: '='
    // },
    link: function (scope, element, attrs) {
      scope.$watch('data', function () {
        if (scope.data !== undefined) {
          if (attrs.ymax){
            var ymax = parseFloat(attrs.ymax);
          } 
          if (attrs.ymin){
            var ymin = parseFloat(attrs.ymin);
          };
          if (attrs.xmax){
            var xmax = parseFloat(attrs.xmax);
          } 
          if (attrs.xmin){
            var xmin = parseFloat(attrs.xmin);
          };
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
          d3.select("#chart").html("");
          console.log(scope)
          chart(scope.data, element, legend);
        } else {
          // empty the mofo beforehand
          d3.select("#chart").html("");
        }
      });
    }
  };
});

angular.module('graph')
    .directive('nxtCrossSection', function($http) {
        var busy = false;
        return {
            restrict: 'E',
            replace: true,
            scope: {
                'url': '@'
            },
            template: '<svg></svg>',
            link: function(scope, element, attrs) {
                var getData = function(url, fn){
                    $.ajax({
                            url: url,
                            success: function(data) {
                                var formatted = [{
                                  "key": "land", 
                                  "values": data.bathymetry,
                                  "color": "#2C9331"
                                },{
                                  "key": "water", 
                                  "values": data.depth,
                                  "color": "LightSkyBlue"
                                }];
                                //console.log('formatte 1', formatted, data);
                                fn(formatted);
                                setTimeout(function() {
                                    busy = false;
                                }, 600);
                            },
                            error: function (data) {
                                var empty = [{
                                    "key": "land",
                                    "values": [[0, 0], [1/111, 0]],
                                    "color": "#2C9331"
                                },{
                                  "key": "water", 
                                  "values": [[0,0], [1/111, 0]],
                                  "color": "LightSkyBlue"
                                }];
                                fn(empty);
                                setTimeout(function() {
                                    busy = false;
                                }, 600);
                            }
                    });  // $.ajax
                }
                var addGraph = function(formatted) {
                    nv.addGraph(function() {
                        //console.log('scope.url2 ', scope.url, '-', scope_url);
                        //console.log('formatted 2', formatted);
                        
                        //console.log("dataaa", data, formatted);
                        // 2 * pi * r / 360 = 111 km per degrees, approximately
                        var chart = nv.models.stackedAreaChart()
                        //var chart = nv.models.lineChart()
                                      .x(function(d) { return 111*d[0] })
                                      .y(function(d) { return d[1] })
                                      .clipEdge(true);

                        chart.xAxis
                            .axisLabel('Distance (km)')
                            .tickFormat(d3.format(',.2f'));

                        chart.yAxis
                            .axisLabel('Depth (m)')
                            .tickFormat(d3.format(',.2f'));

                        chart.showControls(false);
                        chart.yDomain([0, 3]);

                        //console.log('element', $(element).attr('id'), element);
                        // Make sure your context as an id or so...
                        d3.select(element.context)
                          .datum(formatted)
                            .transition().duration(500).call(chart);

                        nv.utils.windowResize(chart.update);
                        return chart;

                    });  // nv.addGraph
                };

                scope.$watch('url', function (url) {
                    //console.log('profile url update');
                    if (busy) {
                        // Only update if an old request is already finished
                        //console.log("profile: busy!!"); 
                        return;
                    }
                    if (url !== '') {
                        //console.log('updating profile graph...');
                        busy = true;
                        getData(url, addGraph);
                    }
                    //setTimeout(function(){busy = false;}, 5000);
                });  // scope.watch
            }
        }
    });



// create the directives as re-usable components
angular.module('graph')
    .directive('nxtTimeseries', function($http) {
        var busy = false;
        var readyForNext = null;
        return {
            restrict: 'E',
            replace: true,
            scope: {
                'url': '@'
            },
            template: '<svg></svg>',
            link: function(scope, element, attrs) {
                var getData = function(url, fn){
                    console.log(url);
                    $.ajax({
                            url: url,
                            type: 'GET',
                            dataType: 'json',
                            success: function(data) {
                                console.log('data!!!', data);
                                var formatted = [{
                                            "key": "timeseries", 
                                            "values": data['timeseries']
                                        }];
                                console.log('formatted 1', formatted, data);
                                fn(formatted);
                                // TODO: possibly a user does not see the very
                                // latest graph...

                                // if (readyForNext !== null) {
                                //     console.log("ReadyForNext!!");
                                //     getData(readyForNext, addGraph);
                                //     readyForNext = null;
                                // } 
                                setTimeout(function() {
                                    busy = false;
                                }, 600);  // wait a while before accepting new
                            },
                            error: function (data) {
                                console.log('error!!!', data);
                                var empty = [{"key": "timeseries",
                                            "values": [[0, 0]]}];
                                fn(empty);
                                setTimeout(function() {
                                    busy = false;
                                }, 600);  // wait a while before accepting new
                            }
                    });  // $.ajax
                }
                var addGraph = function(formatted) {
                    nv.addGraph(function() {
                        //console.log('scope.url2 ', scope.url, '-', scope_url);
                        //console.log('formatted 2', formatted);                    

                        //console.log("dataaa", data, formatted);
                        var chart = nv.models.lineChart()
                                      .x(function(d) { return Date.parse(d[0]) })
                                      .y(function(d) { return d[1] })
                                      .clipEdge(true);
                        var epoch = 0;
                        try {
                            // try to get the startdate.
                            epoch = +Date.parse(formatted[0].values[0][0]);
                        } catch(err) {
                        }
                        //console.log('epoch for this graph is ', epoch);
                        chart.xAxis
                            .axisLabel('Time (hours)')
                            .tickFormat(function(d) {
                                //var hours = +(d- new Date("2012-01-01")) / 1000 / 60 / 60;
                                //console.log('debug ', ((+d) - epoch));
                                var hours = ((+d) - epoch)  / 1000 / 60 / 60;
                             return Math.round(hours*10)/10;
                             //return d3.time.format('%X')(new Date(d)) 
                           });

                        chart.yAxis
                             .axisLabel('Depth (m)')
                             .tickFormat(d3.format(',.2f'));

                        //console.log('element', $(element).attr('id'), element);
                        // Make sure your context as an id or so...
                        d3.select(element.context)
                          .datum(formatted)
                            .transition().duration(500).call(chart);

                        nv.utils.windowResize(chart.update);
                        //console.log('busy? ', busy);
                        return chart;

                    });  // nv.addGraph
                };

                scope.$watch('url', function (url) {
                    //if ((url !== '') && (!busy)) {
                    if ((url !== '') ) {
                        //console.log("time series whahaha", url);
                        if (busy) {
                            // We don't have time for it now, but later you want
                            // the latest available graph.
                            //console.log("timeseries: busy!!"); 
                            readyForNext = url;
                            //showalert("Skipped ", url);
                            return;
                        }
                        // console.log('Get ready for the graph update');
                        busy = true;
                        //console.log('busy', busy);
                        getData(url, addGraph);
                    }
                });  // scope.watch
            }
        }
    });
