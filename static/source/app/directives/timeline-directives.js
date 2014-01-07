// Timeline for lizard.
app.controller('TimelineDirCtrl', function ($scope) {
    this.createCanvas = function (element, options) {
      // Draws a blank canvas based on viewport
      var margin = {
        top: 3,
        right: 20,
        bottom: 20,
        left: 30
      };
  
      var maxwidth = options.width,
          maxheight = options.height;
  
      var width = maxwidth - margin.left - margin.right,
        height = maxheight - margin.top - margin.bottom;

      var svg = d3.select(element[0])
        .select("#timeline-svg-wrapper")
        .html("")
        .append("svg:svg")
        .attr('width', maxwidth)
        .attr('height', maxheight)
        .append("svg:g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      svg.append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "plot-temporal");
      return {
        svg: svg,
        height: height,
        width: width,
        margin: margin
      };
    };

    this.numericalMinMax = function (data, options) {
      var max = d3.max(data, function (d) {
              return Number(d[options.key]);
            });
      var min = d3.min(data, function (d) {
              return Number(d[options.key]);
            });
      var maxDate = new Date(max); // The 0 there is the key, which sets the date to the epoch
      var minDate = new Date(min); // The 0 there is the key, which sets the date to the epoch
      return {
        min: minDate,
        max: maxDate
      };
    };

    this.dateStringMinMax = function (data, options) {
      var domain = d3.extent(data, function (d) {
              return d3.time.format.iso.parse(d.properties[options.key]);
            });
      var min = domain[0].getTime();
      var max = domain[1].getTime();
      return {
        min: min,
        max: max
      };
    };

    this.maxMin = function (data, options) {
      if (options.dateparser === 'isodate') {
        return this.dateStringMinMax(data, options);
      } else {
        return this.numericalMinMax(data, options);
      }
    };


    this.scale = function (minMax, options) {
      // Instantiate a d3 scale based on min max and 
      // width and height of plot
      var scale;
      if (options.type === 'time' || options.scale === 'isodate') {
        scale = d3.time.scale()
          .domain([minMax.min, minMax.max])
          .range([options.range[0], options.range[1]]);
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
            .range([options.range[0], options.range[1]]);
        }
      }
      return scale;
    };

    this.makeAxis = function (scale, options) {
      // Make an axis for d3 based on a scale
      var axis;
      if (options.tickFormat) {
        axis = d3.svg.axis()
                .scale(scale)
                .orient(options.orientation)
                .tickFormat(options.tickFormat)
                .ticks(5);
      } else if (options.ticks) {
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
    * Draws the axes, expects axes or 2 objects with scales
    * Options can contain axes, not mandatory.
    */
    this.drawAxes = function (svg, x, y, options) {
      var xAxis, yAxis;

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
        .call(xAxis);
      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    };

    this.drawBars = function (svg, x, y, data, options) {
      var xfunction = function (d) { return x.scale(d[options.xKey]) - 0.5; };
      var yfunction = function (d) { return options.height - y.scale(d[options.yKey]) - 0.5; };
      var heightfunction = function (d) { return y.scale(d[options.yKey]); };
      // Bar Chart specific stuff
      // Draws bars
      svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", xfunction)
          .attr("y", yfunction)
          .attr("width", 10)
          .attr("height", 10)
          .attr("fill", "steelblue");
      svg.append("line")
        .attr("x1", 0)
        .attr("x2", options.width * data.length)
        .attr("y1", options.height - 0.5)
        .attr("y2", options.height - 0.5)
        .style("stroke", "#ccc");
    };

    this.drawCircles = function (svg, x, y, data, options) {
      // circle stuff
      var xfunction = function (d) { return x.scale(d[options.xKey]); };
      var yfunction = function (d) {
        return y.colorscale(d[options.yKey]);
      };
      //var yfunction = function(d) { return options.height - y.scale(d[options.yKey]) - .5; };
      var heightfunction = function (d) { return y.scale(d.event_type); };
      svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
          // Initially hide all elements and unhide them when within bounds
          .attr("class", "bar hidden")
          .attr("cx", xfunction)
          .attr("cy", heightfunction)
          .attr("r", 5)
          .attr("fill-opacity", 1)
          .on('click', function (d) {
            $scope.box.type = 'aggregate';
            $scope.box.content.eventValue = d;
            $scope.$apply();
          });
    };

    //NOTE: not optimal class switching 
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

    this.brushmove = function () {
      var s = brush.extent();
      var sSorted = [s[0].getTime(), s[1].getTime()].sort();
      $scope.timeState.animation.start = sSorted[0];
      $scope.timeState.animation.end = sSorted[1];
      $scope.timeState.at = (sSorted[0] + sSorted[1]) / 2;
      if (!$scope.timeState.animation.playing && !$scope.$$phase) {
        $scope.$apply();
      }
    };

    var brush = null;
    this.createBrush = function (scope, svg, x, height, xKey) {
      brush = d3.svg.brush().x(x.scale)
        .on("brush", this.brushmove);
      this.brushg = svg.append("g")
        .attr("class", "brushed")
        .call(brush);
      this.brushg.selectAll("rect")
        .attr("height", height);
      return brush;
    };

    this.removeBrush = function (svg) {
      if (this.brushg) {
        this.brushg.remove();
      }
      svg.classed("selecting", false);
      d3.selectAll('.bar').classed("selected", false);
    };

    this.determineInterval = function (interval) {
      if (interval === 'week') {
        return (d3.time.week);
      } else if (interval === 'month') {
        return (d3.time.month);
      }
    };

    return this;
  })
.directive('timeline', [ function ($timeout) {
  
  var link = function (scope, element, attrs, timelineCtrl) {
    var chart;

    scope.timeState.timeline.width = element[0].offsetWidth;
    if (scope.timeState.timeline.width < 10) {
      scope.timeState.timeline.width = window.outerWidth;
    }
    
    var drawTimeline = function (data) {
      //Empty the current timeline
      d3.select(element[0]).select("#timeline-svg-wrapper").select("svg").remove();
      if (timelineKeys.length > 0) {
        scope.timeState.height = 35 + timelineKeys.length * 30;
      } else {
        // Give the timeline a minimal height when its empty to display brush for animation
        scope.timeState.height = 45;
      }
      chart = drawChart(data, 'timestamp', 'event_sub_type', {
        scale: 'ordinal',
        chart: 'circles',
        dateparser: 'epoch'
      });
      timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
      scope.timeState.countCurrentEvents();

      //Set color based on event_subtype
      var scale = d3.scale.ordinal()
        .domain(function (d) {
          return d3.set(d.event_sub_type).values();
        })
        .range(colorbrewer.Set2[6]);
      d3.selectAll("circle")
        .attr('fill', function (d) {
          return scale(d.event_sub_type);
        });
    };

    scope.$watch('mapState.moved', function () {
      timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
      scope.timeState.countCurrentEvents();
    });

    var drawChart = function (data, xKey, yKey, options) {
      var graph = timelineCtrl.createCanvas(element, {
        start: scope.timeState.start,
        stop: scope.timeState.end,
        height: scope.timeState.height,
        width: scope.timeState.timeline.width
      });
      var x = {};
      x.min = new Date(scope.timeState.start);
      x.max = new Date(scope.timeState.end);
      var y = {max: timelineKeys.length - 1,
       min: 0};
      x.scale = timelineCtrl.scale(x, {
        type: 'time',
        range: [0, graph.width],
      });
      scope.timeState.xScale = x.scale;
      y.colorscale = timelineCtrl.scale(y, {
        range: [graph.height, 0],
        scale: (options.scale === 'ordinal') ? 'ordinal' : 'linear'
      });
      scope.timeState.colorScale = y.colorscale;
      y.scale = timelineCtrl.scale(y, {
        range: [graph.height - 20, 20],
        scale: 'linear'
      });
      timelineCtrl.drawCircles(graph.svg, x, y, data, {
        height: graph.height,
        width: graph.width,
        xKey: xKey,
        yKey: yKey
      });
      timelineCtrl.ticksInterval = timelineCtrl.determineInterval(scope.timeState.interval);
      var yAxis;
      if (options.scale === 'ordinal') {
        yAxis = function (d) { return d; };
      } else {
        yAxis = timelineCtrl.makeAxis(y.scale, {
          orientation: "left"
        });
      }
      var xAxis = timelineCtrl.makeAxis(x.scale, {
        orientation: "bottom",
        ticks: timelineCtrl.ticksInterval
      });
      timelineCtrl.drawAxes(graph.svg, x, y, {
        height: graph.height,
        width: graph.width,
        axes: {
          x: xAxis,
          y: yAxis
        }
      });

      var svg = graph.svg;
      timelineCtrl.zoomed = function () {
        svg.select(".x.axis").call(timelineCtrl.makeAxis(x.scale, {
          orientation: "bottom",
          ticks: timelineCtrl.ticksInterval
        }));
        svg.selectAll("circle")
          .attr("cx", function (d) { Math.round(scope.timeline.xScale(d[xKey])); });
        scope.$apply(function () {
          scope.timeState.start = x.scale.domain()[0].getTime();
          scope.timeState.end = x.scale.domain()[1].getTime();
          scope.timeState.changedZoom = !scope.timeState.changedZoom;
        });
      };

      timelineCtrl.zoom = d3.behavior.zoom()
        .x(x.scale)
        .on("zoom", timelineCtrl.zoomed);

      svg.call(timelineCtrl.zoom);

      return {
        x: x,
        height: graph.height,
        svg: svg,
        xKey: xKey
      };
    };

    var timelineKeys = [];
    scope.$watch('timeState.timeline.changed', function (n, o) {
      if (n === o) { return true; }
      scope.timeState.enableAnimation('off');
      var oldLength = timelineKeys.length;
      timelineKeys = [];
      for (var key in scope.timeState.timeline.data) {
        if (scope.timeState.timeline.data[key].active) {
          timelineKeys.push(key);
        }
      }
      var data = [];
      for (var i = 0; i < timelineKeys.length; i++) {
        var id = timelineKeys[i];
        if (scope.timeState.timeline.data[id].active) {
          var iData = scope.timeState.timeline.data[id].features;
          angular.forEach(iData, function (feature) {
            feature.event_type = i;
            data.push(feature);
          });
        }
      }
      drawTimeline(data);
      // Determine whether timeline should be hidden or resized
      var newLength = timelineKeys.length;
      if (newLength !== oldLength) {
        if (newLength > oldLength || (newLength > 0 && !scope.timeState.hidden)) {
          scope.timeState.hidden = false;
          scope.timeState.resizeTimeline();
        } else if (newLength === 0 && !scope.timeState.hidden) {
          scope.timeState.height = 0;
          scope.timeState.hidden = false;
          scope.timeState.resizeTimeline();
        } else if (newLength === 0) {
          scope.timeState.height = 0;
          scope.timeState.hidden = false;
        }
      }
    });

    var animationBrush;
    scope.$watch('timeState.animation.enabled', function (newVal, oldVal) {
      if (newVal === oldVal) { return true; }
      if (scope.timeState.animation.enabled) {
        timelineCtrl.zoom = d3.behavior.zoom()
            .x(chart.x.scale)
            .on("zoom", null);
        chart.svg.on('.zoom', null);

        animationBrush = timelineCtrl.createBrush(scope, chart.svg, chart.x, chart.height, chart.xKey);
        if (scope.timeState.animation.start !== undefined && scope.timeState.animation.end !== undefined) {
          chart.svg.select(".brushed").call(animationBrush.extent([new Date(scope.timeState.animation.start), new Date(scope.timeState.animation.end)]));
        } else {
          var buffer = (scope.timeState.end - scope.timeState.start) / 100;
          chart.svg.select(".brushed").call(animationBrush.extent([new Date(scope.timeState.at), new Date(scope.timeState.at + buffer)]));
        }
        timelineCtrl.brushmove();
      }
      if (!scope.timeState.animation.enabled) {
        timelineCtrl.removeBrush(chart.svg);
        timelineCtrl.zoom = d3.behavior.zoom()
        .x(chart.x.scale)
        .on("zoom", timelineCtrl.zoomed);
        chart.svg.call(timelineCtrl.zoom);
      }
    });
    
    scope.$watch('timeState.at', function () {
      if (scope.timeState.animation.enabled) {
        chart.svg.select(".brushed").call(animationBrush.extent([new Date(scope.timeState.animation.start), new Date(scope.timeState.animation.end)]));
        timelineCtrl.brushmove();
      }
    });

    window.onresize = function () {
      scope.timeState.timeline.width = element.width();
      scope.timeState.changed = !scope.timeState.changed;
    };

  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    controller: 'TimelineDirCtrl',
    templateUrl: 'templates/timeline.html'
  };

}]);
