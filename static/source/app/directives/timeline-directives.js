// Timeline for lizard.
app.controller('TimelineDirCtrl', function ($scope){
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

    this._numericalMinMax = function (data, options) {
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

    this._dateStringMinMax = function (data, options) {
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
        return this._dateStringMinMax(data, options);
      } else {
        return this._numericalMinMax(data, options);
      }
    };


    this.scale = function (minMax, options) {
      // Instantiate a d3 scale based on min max and 
      // width and height of plot
      if (options.type === 'time' || options.scale === 'isodate') {
        var scale = d3.time.scale()
            .domain([minMax.min, minMax.max])
            .range([options.range[0], options.range[1]]);
        console.log("scale: ", minMax.min, minMax.max);
      }
      else {
        if (options.scale === "ordinal") {
        var scale = d3.scale.ordinal()
            .domain(function (d) {
              return d3.set(d.event_sub_type).values();
            })
            .range(colorbrewer.Set2[6]);
        }
        else if (options.scale === "linear") {
        var scale = d3.scale.linear()
            .domain([minMax.min, minMax.max])
            .range([options.range[0], options.range[1]]);
        }
      }
      return scale;
    };

    this.makeAxis = function (scale, options) {
      // Make an axis for d3 based on a scale
      if (options.tickFormat) {
        var axis = d3.svg.axis()
                .scale(scale)
                .orient(options.orientation)
                .tickFormat(options.tickFormat)
                .ticks(5); 
      } else if (options.ticks) {
        var axis = d3.svg.axis()
                .scale(scale)
                .orient(options.orientation)
                .ticks(options.ticks); 
      } else {
        var axis = d3.svg.axis()
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
    };

    this.drawBars = function (svg, x, y, data, options) {
        if (options.xKey === "INTAKEDATU") {
          var xfunction = function(d) { 
            return x.scale(d3.time.format.iso.parse(d.properties[options.xKey])) - .5; };
          var yfunction = function(d) { 
            return y.scale(d.properties[options.yKey]) };
          var heightfunction = function(d) { 
            return y.scale(d.properties[options.yKey]); };
        } else {
          var xfunction = function(d) { return x.scale(d[options.xKey]) - .5; };
          var yfunction = function(d) { return options.height - y.scale(d[options.yKey]) - .5; };
          var heightfunction = function(d) { return y.scale(d[options.yKey]); };
        }
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
          .attr("y1", options.height - .5)
          .attr("y2", options.height - .5)
          .style("stroke", "#ccc");
    };
    this.drawCircles = function(svg, x, y, data, options){
      // circle stuff
      if (options.xKey === "INTAKEDATU") {
          var xfunction = function(d) { 
            return x.scale(d3.time.format.iso.parse(d.properties[options.xKey]));};
          var yfunction = function(d) { 
            return y.colorscale(d.properties[options.yKey]) };
          var heightfunction = function(d) { return y.scale(d.properties[options.yKey]); };
        } else {
          var xfunction = function(d) { return x.scale(d[options.xKey]); };
          var yfunction = function(d) { 
            return y.colorscale(d[options.yKey]) };
          //var yfunction = function(d) { return options.height - y.scale(d[options.yKey]) - .5; };
          var heightfunction = function(d) { return y.scale(d['event_type']); };
        }
        svg.selectAll("circle")
          .data(data)
          .enter().append("circle")
            // Initially hide all elements and unhide them when within bounds
            .attr("class", "bar hidden")
            .attr("cx", xfunction)
            .attr("cy", heightfunction)
            .attr("r", 5)
            .attr("opacity", 1)
            .on('click', function (d) {
              console.log("clicked: ", d, "Box content: ", $scope.box.content.event);
              $scope.box.content.event = d;
              $scope.$digest();
            });
    };


    this.verticalReference = function (options) {
      // NOTE: Not used anymore..
      // add a 'hover' line that we'll show as a user moves their mouse (or finger)
      // so we can use it to show detailed values of each line
      var hoverLineGroup = options.svg.append("svg:g")
                .attr("class", "hover-line");
      // add the line to the group
      var hoverLine = hoverLineGroup
        .append("svg:line")
          .attr("x1", 10).attr("x2", 10) // vertical line so same value on each
          .attr("y1", 0).attr("y2", options.height); // top to bottom  
          
      // hide it by default
      hoverLine.classed("hide", true);
      return hoverLine;
    };

    this.drawReferenceAt = function (options) {
      /* 
      * Reference line. This could be improved
      * Draws line and arrow either on Mouse Position or width
      */
      if (options.mouseX){
        options.svg.select(".reference-line")
              .select("line")
                   .attr("x1", options.mouseX).attr("x2", options.mouseX) 
                   // .attr("filter", "url(#dropshadow)");
         d3.select(".reference-line")
            .select("polygon")
             .attr("points", " " + (options.mouseX - 5).toString() + 
               " " + (0).toString() + " " + (options.mouseX + 5).toString() + 
               " " + (0).toString() + 
               " " + (options.mouseX).toString() + " " + (10).toString())
      } else {     
        options.svg.append("svg:g")
             .attr("class", "reference-line")
                 .append("svg:line")
                   .attr("x1", options.width/2).attr("x2", options.width/2) 
                   .attr("y1", 0).attr("y2", options.height)
                   // .attr("filter", "url(#dropshadow)");
         d3.select(".reference-line")
           .append("svg:polygon")
             .attr("points", " " + (options.width/2 - 5).toString() + 
               " " + (0).toString() + " " + (options.width/2 + 5).toString() + 
               " " + (0).toString() + 
               " " + (options.width/2).toString() + " " + (10).toString())
      }
    };

    //NOTE: not optimal class switching 
    this.drawEventsContainedInBounds = function (bounds) {
      var bounds = bounds;
      var latLng = [];
      d3.selectAll("circle").classed("hidden", true);
      d3.selectAll("circle")
        .classed("selected", function (d) {
          latLng[0] = d.geometry.coordinates[1];
          latLng[1] = d.geometry.coordinates[0];
          contained = bounds.contains(latLng);
          // Some book keeping to count
          d.inSpatExtent = contained;
          return contained;
        });
      var selected = d3.selectAll("circle.selected");
      selected.classed("hidden", false);
    };


    /**
   * Called when a user mouses over the graph.
   * Not used anymore
   */
    this.handleMouseOverGraph = function(e, hoverLine, options) {

      if(options.mouseX >= 0 && options.mouseX <= options.w && options.mouseY >= 0 && options.mouseY <= options.h) {
        // show the hover line
        hoverLine.classed("hide", false);

        // set position of hoverLine
        hoverLine.attr("x1", options.mouseX).attr("x2", options.mouseX)
        
      } else {
        // proactively act as if we've left the area since we're out of the bounds we want
        this.handleMouseOutGraph(e, hoverLine)
      }
    };
    
    this.displayValueLabelsForPositionX = function (mouseX, x) {
      // NOTE: tooltippie

    };
      
    this.handleMouseOutGraph = function(event, hoverLine) { 
      // hide the hover-line
      hoverLine.classed("hide", true);

    };
    this.halfwayTime = function (scale, width) {
      return scale.invert(width / 2).getTime();
    };
    this.createBrush = function (scope, svg, x, height, xKey) {
      var brush = null;    

      var brushmove = function () {
        var s = brush.extent();
            //NOTE: repair!
            //d3.selectAll(".bar")
              //.classed("selected", function(d) { 
                //console.log(d);
                //var value = Date.parse(d.properties[xKey]);
                 //console.log(s[0], value)?
                //return s[0] <= value && value <= s[1]; 
              //});

           if (brush.extent()[0].getTime() === brush.extent()[1].getTime()) {
            scope.$apply(function () {
              scope.timeline.temporalExtent.start = x.scale.domain()[0].getTime();
              scope.timeline.temporalExtent.end = x.scale.domain()[1].getTime();
              scope.timeline.temporalExtent.changedZoom = !scope.timeline.temporalExtent.changedZoom;
            });
          } else {
            scope.$apply(function () {
              s_sorted = [s[0].getTime(), s[1].getTime()].sort();
              scope.timeline.temporalExtent.start = s_sorted[0];
              scope.timeline.temporalExtent.end = s_sorted[1];
              scope.timeline.temporalExtent.changedZoom = !scope.timeline.temporalExtent.changedZoom;
            });
          }

        };
       var brushstart = function () {
        svg.classed("selecting", true);
      };
      var brushend = function () {

       svg.classed("selecting", !d3.event.target.empty());
      };    
      var brush = d3.svg.brush().x(x.scale)
        .on("brush", brushmove)
        .on("brushstart", brushstart)
        .on("brushend", brushend);
      this.brushg = svg.append("g")
        .attr("class", "brushed")
        .call(brush);
      this.brushg.selectAll("rect")
        .attr("height", height);    
    };
    this.removeBrush = function (svg) {
      if (this.brushg){
        this.brushg.remove();
      }
       svg.classed("selecting", false);
       d3.selectAll('.bar').classed("selected", false)
    };
    this.determineInterval = function (interval) {
       if (interval === 'week') {
          return (d3.time.week)
       } else if (interval === 'month') {
          return (d3.time.month)
       }
    };

  return $scope.TimelineDirCtrl = this;
})
.directive('timeline', [ function ($timeout) {
  
  var link = function (scope, element, attrs, timelineCtrl) {
    var chart;
    scope.timeline.width = element[0].offsetWidth;
    if (scope.timeline.width < 10){
      scope.timeline.width = window.outerWidth;    
    }

    var timelineKeys = [];

    scope.$watch('timeline.changed', function () {
      timelineKeys = [];
      for (var key in scope.timeline.data) {
        if (scope.timeline.data[key].active) {
          timelineKeys.push(key);
        }
      }
      //Empty the current timeline
      d3.select(element[0]).select("#timeline-svg-wrapper").select("svg").remove()
      scope.timeline.height = 30 + timelineKeys.length * 30;
      console.log("Heigh:", scope.timeline.height, "length: ", timelineKeys.length);
      var data = [];
      for (var i = 0; i < timelineKeys.length; i++) {
        var id = timelineKeys[i];
        if (scope.timeline.data[id].active) {
          var iData = scope.timeline.data[id].features;
          angular.forEach(iData, function (feature) {
            feature.event_type = i;
            data.push(feature);
          });  
        }
      }
      if (timelineKeys.length > 0) {
        chart = drawChart(data, 'timestamp', 'event_sub_type', {
          scale: 'ordinal',
          chart: 'circles',
          dateparser: 'epoch'
        });        
      }
     timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
     scope.timeline.countCurrentEvents();

     var scale = d3.scale.ordinal()
            .domain(function (d) {
              return d3.set(d.event_sub_type).values();
            })
            .range(colorbrewer.Set2[6]);

       d3.selectAll("circle")
            .attr('fill', function (d) {
            return scale(d.event_sub_type);
          });
    });

    scope.$watch('mapState.moved', function () {
      timelineCtrl.drawEventsContainedInBounds(scope.mapState.bounds);
      scope.timeline.countCurrentEvents();
    })

    var drawChart = function (data, xKey, yKey, options) {
      var graph = timelineCtrl.createCanvas(element, {
        start: scope.timeline.temporalExtent.start,
        stop: scope.timeline.temporalExtent.end,
        height: scope.timeline.height,
        width: scope.timeline.width
      });
      var x = {};
      x.min = new Date(scope.timeline.temporalExtent.start);
      x.max = new Date(scope.timeline.temporalExtent.end);
      var y = {max: timelineKeys.length -1,
       min: 0};
      if (scope.timeline.xScale) {
        x.scale = scope.timeline.xScale;  
      } else {
        x.scale = timelineCtrl.scale(x, {
          type: 'time',
          range: [0, graph.width],
          });
        scope.timeline.xScale = x.scale;
      }
      y.colorscale = timelineCtrl.scale(y, {
        range: [graph.height, 0],
        scale: (options.scale == 'ordinal') ? 'ordinal' : 'linear'
      });
      y.scale = timelineCtrl.scale(y, {
        range: [graph.height-20, 20],
        scale: 'linear'
      });
      timelineCtrl.drawCircles(graph.svg, x, y, data, {
        height: graph.height,
        width: graph.width,
        xKey: xKey,
        yKey: yKey
      });
      timelineCtrl.ticksInterval = timelineCtrl.determineInterval(scope.timeline.interval);
      if (options.scale === 'ordinal') {
        var yAxis = function (d) {return d};
      } else {
        var yAxis = timelineCtrl.makeAxis(y.scale, {
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
          if (scope.timeline.tool === 'zoom'){
            svg.select(".x.axis").call(timelineCtrl.makeAxis(x.scale, {
              orientation: "bottom",
              ticks: timelineCtrl.ticksInterval
              }));
            svg.selectAll("circle")
              .attr("cx", function(d) {return scope.timeline.xScale(d[xKey]);});
            scope.$apply(function () {
              scope.timeline.temporalExtent.start = x.scale.domain()[0].getTime();
              scope.timeline.temporalExtent.end = x.scale.domain()[1].getTime();
              scope.timeline.temporalExtent.changedZoom = !scope.timeline.temporalExtent.changedZoom;
            });
            svg.call(timelineCtrl.zoom)       
          } 
        };

        timelineCtrl.zoom = d3.behavior.zoom()
          .x(x.scale)
          .on("zoom", timelineCtrl.zoomed);

        svg.call(timelineCtrl.zoom)

        scope.timeline.temporalExtent.at = timelineCtrl.halfwayTime(x.scale, graph.width);
        return {
          x: x,
          height: graph.height,
          svg: svg,
          xKey: xKey
        }
    };
      scope.$watch('timeline.tool', function (newVal, oldVal) {
          if (newVal === oldVal) {
            // do nothing
          } else if (newVal === 'zoom') {
            //console.log(chart.svg)
            timelineCtrl.removeBrush(chart.svg);
            timelineCtrl.zoom = d3.behavior.zoom()
              .x(chart.x.scale)
              .on("zoom", timelineCtrl.zoomed);
            chart.svg.call(timelineCtrl.zoom);
          } else if (newVal === 'brush') {
            // chart.svg.call(timelineCtrl.zoom);
            timelineCtrl.zoom = d3.behavior.zoom()
              .x(chart.x.scale)
              .on("zoom", null);
            chart.svg.on('.zoom', null);
            timelineCtrl.createBrush(scope, chart.svg, chart.x, chart.height, chart.xKey);
          }
        });

      scope.$watch('timeline.zoom.changed', function (newVal, oldVal) {
        if (newVal !== oldVal) {
          // d3
          timelineCtrl.ticksInterval = timelineCtrl.determineInterval(newVal);
        }
      });

    window.onresize = function () {
      scope.timeline.width = element.width();
      if (scope.timeline.data === scope.kpi[0].pi[0].data.features){
        chart = drawChart("INTAKEDATU", "CATEGORIE", {
          scale: "ordinal",
          chart: "circles",
          dateparser: 'isodate'
        });
      } else if (scope.timeline.data !== undefined){
        chart = drawChart('date', 'value', {});
      }
    };
  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    controller: 'TimelineDirCtrl',
    templateUrl: 'templates/timeline.html'
  }
}]);
