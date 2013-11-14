// Timeline for lizard.
app.directive('timeline', [ function ($timeout) {

  var controller = function ($scope){
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
  

      // d3.select(element[0])
      //   .html("")
      //   .append("html:div")
      //   .classed("bovenbalk", true)


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
      }
    };
    this.drawAxes = function (svg, x, y, options){
      // Draws the axes, expects axes or 2 objects with scales
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

      // Not sure if we want grid
      // svg.append("g")
      //   .attr("class", "x grid")
      //   .attr("transform", "translate(0, " + (options.height + 6) + ")")
      //   .call(xAxis
      //     .tickSize(-options.height, 0, 0)
      //   );

      // svg.append("g")
      //   .attr("class", "y grid")
      //   .call(yAxis
      //     .tickSize(-options.width, 0, 0)
      //     .tickFormat("")
      //   );
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
            .attr("y", 5)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", yfunction);
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
          var yfunction = function(d) { return options.height - y.scale(d[options.yKey]) - .5; };
          var heightfunction = function(d) { return y.scale(d[options.yKey]); };
        }
        svg.selectAll("circle")
          .data(data)
          .enter().append("circle")
            .attr("class", "bar")
            .attr("cx", xfunction)
            .attr("cy", 20)
            .attr("r", 4)
            .attr("opacity", 0.8)
            .attr("fill", yfunction)
            .on('click', function (d) {
              var elclicked = $('#pumpstation_'+ d.value);
              var y = elclicked.offset().top;
              var x = elclicked.offset().left;
              var ev = document.createEvent("MouseEvent");
              ev.initMouseEvent("click", true, true, window, null, 
                0,0,0,0,
                false,false,false,false,
                0, 
                null);
              elclicked[0].dispatchEvent(ev);
            });
    };

    this.maxMin = function (data, options) {
      if (options.dateparser === 'isodate'){
        var domain = d3.extent(data, function (d) {
                return d3.time.format.iso.parse(d.properties[options.key])
              });
        var min = domain[0].getTime();
        var max = domain[1].getTime();
      //} else if (options.key === 'CATEGORIE') {
        //var min = "GRONDWATER";
        //var max = "PUT STUK";
      } else {
        var max = d3.max(data, function(d){
                return Number(d[options.key]);
              });

        var min = d3.min(data, function(d){
                return Number(d[options.key]);
              });
      }
      return {
        max: max, 
        min: min
      };
    };
    this.makeAxis = function (scale, options) {
      // Make an axis for d3 based on a scale
      if (options.tickFormat){
        var axis = d3.svg.axis()
                .scale(scale)
                .orient(options.orientation)
                .tickFormat(options.tickFormat)
                .ticks(5); 
      } else if (options.ticks){
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
      return axis
      };
    this.scale = function (min, max, options) {
      // Instantiate a d3 scale based on min max and 
      // width and height of plot
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
      } else if (options.scale === "color") {
        var scale = d3.scale.category20()
          .domain(function (d) {
            return d3.set(d.properties.CATEGORIE).values();
          });
      } else if (options.scale === "ordinal") {
        var scale = d3.scale.ordinal()
          //.range([options.range[0], options.range[1]])
          .range(colorbrewer.Set2[6])
          .domain(function (d) {
            return d3.set(d.properties.CATEGORIE).values();
          });
      } else if (options.scale === 'isodate'){
        var scale = d3.time.scale()
            .domain([min, max])
            .range([options.range[0], options.range[1]]);
      } else {
        var scale = d3.scale.linear()
            .domain([min, max])
            .range([options.range[0], options.range[1]]);
      }
      return scale;
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
            d3.selectAll(".bar")
              .classed("selected", function(d) { 
                var value = Date.parse(d.properties[xKey]);
                // console.log(s[0], value)?
                return s[0] <= value && value <= s[1]; 
              });

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
  };
  
  var link = function (scope, element, attrs, timelineCtrl) {
    var chart;
    scope.timeline.width = element.width();
    if (scope.timeline.width < 10){
      scope.timeline.width = window.outerWidth;    
    }
    scope.timeline.height = 70;

    scope.$watch('timeline.changed', function () {
      if (scope.timeline.data == scope.kpi[0].pi[0].data.features){
        chart = drawChart("INTAKEDATU", "CATEGORIE", {
          scale: "ordinal",
          chart: "circles",
          dateparser: 'isodate'
        });
      } else {
        chart = drawChart('date', 'value', {});
      }
      if (scope.tools.alerts.enabled || scope.tools.sewerage.enabled) {
        scope.timeline.enabled = true;
        console.log('hoi')
      } else {
        scope.timeline.enabled = false;
      }
    });

    // scope.$watch('tools.alerts.enabled', function (newVal, oldVal) {
    //   if (newVal){
    //     scope.timeline.data = scope.kpi[0].pi[0].data.features;
    //     chart = drawChart("INTAKEDATU", "CATEGORIE", {
    //       scale: "ordinal",
    //       chart: "circles",
    //       dateparser: 'isodate'
    //     });
    //   };
    // });

    var drawChart = function (xKey, yKey, options) {
      var graph = timelineCtrl.createCanvas(element, {
        start: scope.timeline.temporalExtent.start,
        stop: scope.timeline.temporalExtent.end,
        height: scope.timeline.height,
        width: scope.timeline.width
      });
      var x = timelineCtrl.maxMin(scope.timeline.data, {
        key: xKey,
        dateparser: options.dateparser
      });
      var y = timelineCtrl.maxMin(scope.timeline.data, {
        key: yKey
      });
      x.scale = timelineCtrl.scale(x.min, x.max, {
        type: 'time',
        range: [0, graph.width],
      });
      y.colorscale = timelineCtrl.scale(y.min, y.max, {
        range: [graph.height, 0],
        scale: (options.scale == 'ordinal') ? 'ordinal' : 'ordinal'
      });
      y.scale = timelineCtrl.scale(y.min, y.max, {
        range: [graph.height, 0],
        scale: (options.scale == 'ordinal') ? 'ordinal' : 'ordinal'
      });
      timelineCtrl.drawCircles(graph.svg, x, y, scope.timeline.data, {
        height: graph.height,
        width: graph.width,
        xKey: xKey,
        yKey: yKey
      });
      timelineCtrl.ticksInterval = timelineCtrl.determineInterval(scope.timeline.interval);
      var yAxis = timelineCtrl.makeAxis(y.scale, {
        orientation: "left"
      });
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

        if (xKey === "INTAKEDATU") {
        var xfunction = function(d) { 
          var value = x.scale(d3.time.format.iso.parse(d.properties[xKey]));
          if (value < 0){
            value = -300;
          } else if (value > graph.width){
            value = -300;
          }
          return value; };
        } else{
        var xfunction = function(d) {return x.scale(d[xKey])};
        }

      var svg = graph.svg;
        timelineCtrl.zoomed = function () {
          if (scope.timeline.tool === 'zoom'){
            svg.select(".x.axis").call(timelineCtrl.makeAxis(x.scale, {
              orientation: "bottom",
              ticks: timelineCtrl.ticksInterval
            }));
            svg.select(".y.axis").call(timelineCtrl.makeAxis(y.scale, {orientation:"left"}));
            svg.selectAll("circle")
                .attr("cx", xfunction);
            scope.$apply(function () {
              scope.timeline.temporalExtent.start = x.scale.domain()[0].getTime();
              scope.timeline.temporalExtent.end = x.scale.domain()[1].getTime();
              scope.timeline.temporalExtent.changedZoom = !scope.timeline.temporalExtent.changedZoom;
            });            
          } 
        };

        timelineCtrl.zoom = d3.behavior.zoom()
          .x(x.scale)
          .on("zoom", timelineCtrl.zoomed);


        svg.call(timelineCtrl.zoom)

        // angular.element(".plot-temporal")
        // .on("mousemove", function (e) {
        //   var offset = angular.element('.plot-temporal').offset(); 
        //   var mouseX = e.pageX-offset.left;
        //   var mouseY = e.pageY-offset.top;
        //   timelineCtrl.handleMouseOverGraph(e, hoverLine, {
        //     mouseX: mouseX,
        //     mouseY: mouseY,
        //     w: graph.width,
        //     h: graph.height
        //   });
        //   timelineCtrl.displayValueLabelsForPositionX(mouseX, x);
        // })
        // .on("mouseout", function (e) {
        //  timelineCtrl.handleMouseOutGraph(e, hoverLine); 
        // })
        // .on("mousemove", function(e){
        //   var offset = angular.element('.plot-temporal').offset(); 
        //   var mouseX = e.pageX-offset.left;
        //   timelineCtrl.drawReferenceAt({
        //     svg: graph.svg,
        //     mouseX: mouseX
        //   });
        //   scope.$apply(function () {
        //     scope.timeline.temporalExtent.at = x.scale.invert(mouseX).getTime();            
        //   })
        // });


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
            console.log(chart.svg)
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
      } else {
        chart = drawChart('date', 'value', {});
      }
    };
  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    controller: controller,
    templateUrl: 'templates/timeline.html'
  }
}]);
