// Timeline for lizard.
app.controller('TimelineDirCtrl', function ($scope) {
    this.createCanvas = function (options) {
      // Draws a blank canvas based on viewport
      var margin = {
        top: 3,
        right: 20,
        bottom: 20,
        left: 30
      };
  
      var width = options.width - margin.left - margin.right,
          height = options.height - margin.top - margin.bottom;

      var svg = d3.select("#timeline-svg-wrapper").select("svg");
      svg.attr('width', options.width)
        .attr('height', options.height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .style("transform", "translate3d(" + margin.left + "," + margin.top + ")")
        .attr("transform", "translate(0, " + height + ")")
        .append("rect")
        .attr("width", width)
        .attr("class", "plot-temporal");
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
        .duration(300)
        .attr('height', options.height)
        .select("g")
        .attr("transform", "translate(0, " + graph.height + ")")
        .select("rect")
        .attr("width", graph.width);

      return graph;
    };

    // this.numericalMinMax = function (data, options) {
    //   var max = d3.max(data, function (d) {
    //           return Number(d[options.key]);
    //         });
    //   var min = d3.min(data, function (d) {
    //           return Number(d[options.key]);
    //         });
    //   var maxDate = new Date(max); // The 0 there is the key, which sets the date to the epoch
    //   var minDate = new Date(min); // The 0 there is the key, which sets the date to the epoch
    //   return {
    //     min: minDate,
    //     max: maxDate
    //   };
    // };

    // this.dateStringMinMax = function (data, options) {
    //   var domain = d3.extent(data, function (d) {
    //           return d3.time.format.iso.parse(d.properties[options.key]);
    //         });
    //   var min = domain[0].getTime();
    //   var max = domain[1].getTime();
    //   return {
    //     min: min,
    //     max: max
    //   };
    // };

    // this.maxMin = function (data, options) {
    //   if (options.dateparser === 'isodate') {
    //     return this.dateStringMinMax(data, options);
    //   } else {
    //     return this.numericalMinMax(data, options);
    //   }
    // };


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
            .range(colorbrewer.Set2[6]);
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
    * Draws the given axis in the given svg
    */
    this.drawAxes = function (svg, xAxis) {
      svg.select("g")
        .attr("class", "x axis")
        .call(xAxis);
      };

    // this.drawBars = function (svg, x, y, data, options) {
    //   var xfunction = function (d) { return x.scale(d[options.xKey]) - 0.5; };
    //   var yfunction = function (d) { return options.height - y.scale(d[options.yKey]) - 0.5; };
    //   var heightfunction = function (d) { return y.scale(d[options.yKey]); };
    //   // Bar Chart specific stuff
    //   // Draws bars
    //   svg.selectAll(".bar")
    //     .data(data)
    //     .enter().append("rect")
    //       .attr("class", "bar")
    //       .attr("x", xfunction)
    //       .attr("y", yfunction)
    //       .attr("width", 10)
    //       .attr("height", 10)
    //       .attr("fill", "steelblue");
    //   svg.append("line")
    //     .attr("x1", 0)
    //     .attr("x2", options.width * data.length)
    //     .attr("y1", options.height - 0.5)
    //     .attr("y2", options.height - 0.5)
    //     .style("stroke", "#ccc");
    // };

    this.drawCircles = function (svg, xScale, yScale, colorScale, xKey, yKey, colorKey, data) {
    // //   // circle stuff
    // //   var xfunction = function (d) { return x.scale(d[options.xKey]); };
    // //   var yfunction = function (d) {
    // //     return y.colorscale(d[options.yKey]);
    // //   };
    // //   //var yfunction = function(d) { return options.height - y.scale(d[options.yKey]) - .5; };
    // //   var heightfunction = function (d) { return y.scale(d.event_type); };
    // //   console.log(svg);
    // //   svg.selectAll("circle")
    // //     .data(data)
    // //     .enter().append("circle")
    // //       // Initially hide all elements and unhide them when within bounds
    // //       .attr("class", "bar hidden")
    // //       .attr("cx", xfunction)
    // //       .attr("cy", heightfunction)
    // //       .attr("r", 5)
    // //       .attr("fill-opacity", 1)
    // //       .on('click', function (d) {
    // //         $scope.box.type = 'aggregate';
    // //         $scope.box.content.eventValue = d;
    // //         $scope.$apply();
    // //       });
    // // };

    // this.update = function (data) {
      var xFunction = function (d) { return xScale(d[xKey]); };
      var yFunction = function (d) { return yScale(d[yKey]); };
      var colorFunction = function (d) { return colorScale(d[colorKey]); };
      // DATA JOIN
      // Join new data with old elements, if any.
      var circles = svg.selectAll("circle")
          .data(data)
          .on('click', function (d) {
          $scope.box.type = 'aggregate';
          $scope.box.content.eventValue = d;
          $scope.$apply();
        });;

      // UPDATE
      // Update old elements as needed.
      circles.attr("class", "bar")
        .transition()
        .delay(0)
        .duration(300)
        .attr("cx", xFunction)
        .attr("cy", yFunction);

      // ENTER
      // Create new elements as needed.
      circles.enter().append("circle")
        .attr("cx", xFunction)
        .attr("cy", yFunction)
        .attr("fill", colorFunction)
        .attr("r", 5)
        .attr("fill-opacity", 0)
        .transition()
        .delay(0)
        .duration(300)
        .attr("fill-opacity", 1);

      // EXIT
      // Remove old elements as needed.
      circles.exit()
        .transition()
        .delay(0)
        .duration(300)
        .style("fill-opacity", 0)
        .remove();
    };

    // //NOTE: not optimal class switching 
    // this.drawEventsContainedInBounds = function (bounds) {
    //   var latLng = [];
    //   d3.selectAll("circle").classed("hidden", true);
    //   d3.selectAll("circle")
    //     .classed("selected", function (d) {
    //       latLng[0] = d.geometry.coordinates[1];
    //       latLng[1] = d.geometry.coordinates[0];
    //       var contained = bounds.contains(latLng);
    //       // Some book keeping to count
    //       d.inSpatExtent = contained;
    //       return contained;
    //     });
    //   var selected = d3.selectAll("circle.selected");
    //   selected.classed("hidden", false);
    // };

    // this.brushmove = function () {
    //   var s = brush.extent();
    //   var sSorted = [s[0].getTime(), s[1].getTime()].sort();
    //   $scope.timeState.animation.start = sSorted[0];
    //   $scope.timeState.animation.end = sSorted[1];
    //   $scope.timeState.at = (sSorted[0] + sSorted[1]) / 2;
    //   if (!$scope.timeState.animation.playing && !$scope.$$phase) {
    //     $scope.$apply();
    //   }
    // };

    // var brush = null;
    // this.createBrush = function (scope, svg, x, height, xKey) {
    //   brush = d3.svg.brush().x(x.scale)
    //     .on("brush", this.brushmove);
    //   this.brushg = svg.append("g")
    //     .attr("class", "brushed")
    //     .call(brush);
    //   this.brushg.selectAll("rect")
    //     .attr("height", height);
    //   return brush;
    // };

    // this.removeBrush = function (svg) {
    //   console.log("removing brush", this.brushg, svg);
    //   if (this.brushg) {
    //     this.brushg.remove();
    //   }
    //   svg.classed("selecting", false);
    //   d3.selectAll('.bar').classed("selected", false);
    // };

    // this.determineInterval = function (interval) {
    //   if (interval === 'week') {
    //     return (d3.time.week);
    //   } else if (interval === 'month') {
    //     return (d3.time.month);
    //   }
    // };

    return this;
  })
.directive('timeline', [ function ($timeout) {
  
  var link = function (scope, element, attrs, timelineCtrl) {

    /**
    * Draws an empty timeline
    */
    var createTimeline = function () {
      var canvasOptions = {width: element.width(), height: 45};
      var graph = timelineCtrl.createCanvas(canvasOptions);

      // Add x axis
      var x = {};
      x.min = new Date(scope.timeState.start);
      x.max = new Date(scope.timeState.end);
      var range = {};
      range.min = 0;
      range.max = graph.width;
      graph.xScale = timelineCtrl.scale(x, range, { type: 'time' });
      var xAxis = timelineCtrl.makeAxis(graph.xScale, {orientation: "bottom", ticks: 5});
      timelineCtrl.drawAxes(graph.svg, xAxis);

      // Add zoom functionality
      graph.svg.call(d3.behavior.zoom()
        .x(graph.xScale)
        .on("zoom", zoomed)
      );

      return graph;
    };


    /**
    * Updates the graph with new data
    */
    var updateTimeline = function (graph, data, nEventTypes) {
      var canvasOptions = {width: element.width(), height: 45 + nEventTypes * 35};
      var newGraph = timelineCtrl.updateCanvas(graph, canvasOptions);
      newGraph.svg.select(".x.axis").call(timelineCtrl.makeAxis(graph.xScale, {
        orientation: "bottom",
        ticks: 5
      }));
      // Create remaining scales
      var colorScale = timelineCtrl.scale(null, null, { scale: 'ordinal' });
      var yScale = timelineCtrl.scale({min: 1, max: nEventTypes}, { min: newGraph.height - 20, max: 20 }, {scale: 'linear'});
      // Update the svg with
      timelineCtrl.drawCircles(newGraph.svg, newGraph.xScale, yScale, colorScale, 'timestamp', 'event_type', 'event_subtype', data);
      return newGraph;
    };

    /** 
    * Formats data into long format
    **/
    var formatData = function () {
      var data = [];
      var typeCount = 0;
      for (var key in scope.timeState.timeline.data) {
        typeCount++;
        if (scope.timeState.timeline.data[key].active) {
          var iData = scope.timeState.timeline.data[key].features;
          angular.forEach(iData, function (feature) {
            feature.event_type = typeCount;
            data.push(feature);
          });
        }
      }
      return data;
    };

    var eventTypeLength = function () {
        var typeCount = 0;
        for (var key in scope.timeState.timeline.data) {
          console.log(scope.timeState.timeline.data[key].active);
          if (scope.timeState.timeline.data[key].active) {
            typeCount++;
          }
        }
        return typeCount;
    };

    scope.$watch('timeState.timeline.changed', function (n, o) {
      if (n === o) { return true; }
      var data = formatData();
      var nEventTypes = eventTypeLength();
      graph = updateTimeline(graph, data, nEventTypes);
    });

    var zoomed = function () {
      graph.svg.select(".x.axis").call(timelineCtrl.makeAxis(graph.xScale, {
        orientation: "bottom",
        ticks: 5
      }));
      graph.svg.selectAll("circle")
        .attr("cx", function (d) { return Math.round(graph.xScale(d[xKey])); });
      scope.$apply(function () {
        scope.timeState.start = graph.xScale.domain()[0].getTime();
        scope.timeState.end = graph.xScale.domain()[1].getTime();
        scope.timeState.changedZoom = !scope.timeState.changedZoom;
      });
    };

    // Get the timeline-graph
    var graph = createTimeline();




    // var chart;
    // var axisInitialized = false;

    // var drawTimeline = function (data) {
    //   scope.timeState.timeline.width = element[0].offsetWidth;
    //   if (scope.timeState.timeline.width < 10) {
    //     scope.timeState.timeline.width = window.outerWidth;
    //   }
    //   if (timelineKeys.length > 0) {
    //     scope.timeState.height = 45 + timelineKeys.length * 30;
    //   } else {
    //     // Give the timeline a minimal height when its empty to display brush for animation
    //     scope.timeState.height = 45;
    //   }
      
    //   chart = drawChart(data, 'timestamp', 'event_sub_type', {
    //     scale: 'ordinal',
    //     chart: 'circles',
    //     dateparser: 'epoch'
    //   });
    //   if (!axisInitialized) {
    //     var yAxis = function (d) { return d; };
    //     var xAxis = timelineCtrl.makeAxis(chart.x.scale, {
    //       orientation: "bottom",
    //       ticks: timelineCtrl.ticksInterval
    //     });
    //     timelineCtrl.drawAxes(chart.svg, chart.x, chart.y, {
    //       height: scope.timeState.height,
    //       width: scope.timeState.timeline.width,
    //       axes: {
    //         x: xAxis,
    //         y: yAxis
    //       }
    //     });
    //     axisInitialized = true;
    //   }

    //   timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
    //   scope.timeState.countCurrentEvents();

    //   //Set color based on event_subtype
    //   var scale = d3.scale.ordinal()
    //     .domain(function (d) {
    //       return d3.set(d.event_sub_type).values();
    //     })
    //     .range(colorbrewer.Set2[6]);
    //   d3.selectAll("circle")
    //     .attr('fill', function (d) {
    //       return scale(d.event_sub_type);
    //     });
    // };

    // scope.$watch('mapState.moved', function () {
    //   timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
    //   scope.timeState.countCurrentEvents();
    // });

    // var drawChart = function (data, xKey, yKey, options) {
    //   var graph = timelineCtrl.createCanvas(element, {
    //     start: scope.timeState.start,
    //     stop: scope.timeState.end,
    //     height: scope.timeState.height,
    //     width: scope.timeState.timeline.width
    //   });
    //   var x = {};
    //   x.min = new Date(scope.timeState.start);
    //   x.max = new Date(scope.timeState.end);
    //   var y = {max: timelineKeys.length - 1,
    //    min: 0};
    //   x.scale = timelineCtrl.scale(x, {
    //     type: 'time',
    //     range: [0, graph.width],
    //   });
    //   scope.timeState.xScale = x.scale;
    //   y.colorscale = timelineCtrl.scale(y, {
    //     range: [graph.height, 0],
    //     scale: (options.scale === 'ordinal') ? 'ordinal' : 'linear'
    //   });
    //   scope.timeState.colorScale = y.colorscale;
    //   y.scale = timelineCtrl.scale(y, {
    //     range: [graph.height - 20, 20],
    //     scale: 'linear'
    //   });
    //   timelineCtrl.drawCircles(graph.svg, x, y, data, {
    //     height: graph.height,
    //     width: graph.width,
    //     xKey: xKey,
    //     yKey: yKey
    //   });
    //   timelineCtrl.ticksInterval = timelineCtrl.determineInterval(scope.timeState.interval);

    //   var svg = graph.svg;
    //   timelineCtrl.zoomed = function () {
    //     svg.select(".x.axis").call(timelineCtrl.makeAxis(x.scale, {
    //       orientation: "bottom",
    //       ticks: timelineCtrl.ticksInterval
    //     }));
    //     svg.selectAll("circle")
    //       .attr("cx", function (d) { return Math.round(scope.timeState.xScale(d[xKey])); });
    //     scope.$apply(function () {
    //       scope.timeState.start = x.scale.domain()[0].getTime();
    //       scope.timeState.end = x.scale.domain()[1].getTime();
    //       scope.timeState.changedZoom = !scope.timeState.changedZoom;
    //     });
    //   };

    //   timelineCtrl.zoom = d3.behavior.zoom()
    //     .x(x.scale)
    //     .on("zoom", timelineCtrl.zoomed);

    //   svg.call(timelineCtrl.zoom);

    //   return {
    //     x: x,
    //     y: y,
    //     height: graph.height,
    //     svg: svg,
    //     xKey: xKey
    //   };
    // };

    // var timelineKeys = [];
    // scope.$watch('timeState.timeline.changed', function (n, o) {
    //   if (n === o) { return true; }
    //   scope.timeState.enableAnimation('off');
    //   var oldLength = timelineKeys.length;
    //   timelineKeys = [];
    //   for (var key in scope.timeState.timeline.data) {
    //     if (scope.timeState.timeline.data[key].active) {
    //       timelineKeys.push(key);
    //     }
    //   }
    //   var data = [];
    //   for (var i = 0; i < timelineKeys.length; i++) {
    //     var id = timelineKeys[i];
    //     if (scope.timeState.timeline.data[id].active) {
    //       var iData = scope.timeState.timeline.data[id].features;
    //       angular.forEach(iData, function (feature) {
    //         feature.event_type = i;
    //         data.push(feature);
    //       });
    //     }
    //   }
    //   drawTimeline(data);
    //   // Determine whether timeline should be hidden or resized
    //   var newLength = timelineKeys.length;
    //   if (newLength !== oldLength) {
    //     if (newLength > oldLength || (newLength > 0 && !scope.timeState.hidden)) {
    //       scope.timeState.hidden = false;
    //       scope.timeState.resizeTimeline();
    //     } else if (newLength === 0 && !scope.timeState.hidden) {
    //       scope.timeState.height = 0;
    //       scope.timeState.hidden = false;
    //       scope.timeState.resizeTimeline();
    //     } else if (newLength === 0) {
    //       scope.timeState.height = 0;
    //       scope.timeState.hidden = false;
    //     }
    //   }
    // });

    // var animationBrush;
    // scope.$watch('timeState.animation.enabled', function (newVal, oldVal) {
    //   if (newVal === oldVal) { return true; }
    //   if (scope.timeState.animation.enabled) {
    //     timelineCtrl.zoom = d3.behavior.zoom()
    //         .x(chart.x.scale)
    //         .on("zoom", null);
    //     chart.svg.on('.zoom', null);

    //     animationBrush = timelineCtrl.createBrush(scope, chart.svg, chart.x, chart.height, chart.xKey);
    //     if (scope.timeState.animation.start !== undefined 
    //       && scope.timeState.animation.end !== undefined 
    //       && scope.timeState.animation.start > scope.timeState.start
    //       && scope.timeState.animation.end < scope.timeState.end) {
    //       chart.svg.select(".brushed").call(animationBrush.extent([new Date(scope.timeState.animation.start), new Date(scope.timeState.animation.end)]));
    //     } else {
    //       var buffer = (scope.timeState.end - scope.timeState.start) / 100;
    //       chart.svg.select(".brushed").call(animationBrush.extent([new Date(scope.timeState.at), new Date(scope.timeState.at + buffer)]));
    //     }
    //     timelineCtrl.brushmove();
    //   }
    //   if (!scope.timeState.animation.enabled) {
    //     timelineCtrl.removeBrush(chart.svg);
    //     timelineCtrl.zoom = d3.behavior.zoom()
    //     .x(chart.x.scale)
    //     .on("zoom", timelineCtrl.zoomed);
    //     chart.svg.call(timelineCtrl.zoom);
    //   }
    // });
    
    // scope.$watch('timeState.at', function () {
    //   if (scope.timeState.animation.enabled) {
    //     chart.svg.select(".brushed").call(animationBrush.extent([new Date(scope.timeState.animation.start), new Date(scope.timeState.animation.end)]));
    //     timelineCtrl.brushmove();
    //   }
    // });

    // window.onresize = function () {
    //   scope.timeState.timeline.width = element.width();
    //   scope.timeState.changed = !scope.timeState.changed;
    // };

  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    controller: 'TimelineDirCtrl',
    templateUrl: 'templates/timeline.html'
  };

}]);
