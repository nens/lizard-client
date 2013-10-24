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
  

      d3.select(element[0])
        .html("")
        .append("html:div")
        .classed("bovenbalk", true)


      var svg = d3.select(element[0])
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
        // Bar Chart specific stuff
        // Draws bars
        svg.selectAll(".bar")
          .data(data)
          .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d) { return x.scale(d.date) - .5; })
            .attr("y", function(d) { return options.height - y.scale(d.value) - .5; })
            .attr("width", 10)
            .attr("height", function(d) { return y.scale(d.value); });
        svg.append("line")
          .attr("x1", 0)
          .attr("x2", options.width * data.length)
          .attr("y1", options.height - .5)
          .attr("y2", options.height - .5)
          .style("stroke", "#ccc");
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
    this.makeAxis = function (scale, options) {
      // Make an axis for d3 based on a scale
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
    }
  };
  
  var link = function (scope, element, attrs, timelineCtrl) {
    scope.timeline.width = element.width();
    scope.$watch('timeline.open', function () {
      if (scope.timeline.open){
        scope.timeline.height = 200;
        // start the shazazzz.
      } else {
        scope.timeline.height = 70;
      }
      drawChart();

    });

    var drawChart = function () {
      var graph = timelineCtrl.createCanvas(element, {
        start: scope.timeline.temporalExtent.start,
        stop: scope.timeline.temporalExtent.end,
        height: scope.timeline.height,
        width: scope.timeline.width
      });
      var x = timelineCtrl.maxMin(scope.timeline.data, 'date');
      var y = timelineCtrl.maxMin(scope.timeline.data, 'value');
      x.scale = timelineCtrl.scale(x.min, x.max, {
        type: 'time',
        range: [0, graph.width]
      });
      y.scale = timelineCtrl.scale(y.min, y.max, {range: [graph.height, 0]});
      timelineCtrl.drawBars(graph.svg, x, y, scope.timeline.data, {
        height: graph.height,
        width: graph.width
      });
      timelineCtrl.drawAxes(graph.svg, x, y, {
        height: graph.height, 
        width: graph.width
      });

      var svg = graph.svg;
        var zoomed = function () {
          svg.select(".x.axis").call(timelineCtrl.makeAxis(x.scale, {orientation:"bottom"}));
          svg.select(".y.axis").call(timelineCtrl.makeAxis(y.scale, {orientation:"left"}));
          svg.selectAll(".bar")
              .attr("x", function(d) { return x.scale(d.date) - .5; });
          scope.$apply(function () {
            scope.timeline.temporalExtent.start = x.scale.domain()[0].getTime();
            scope.timeline.temporalExtent.end = x.scale.domain()[1].getTime();
            scope.timeline.temporalExtent.changedZoom = !scope.timeline.temporalExtent.changedZoom;
          });
        };

        var zoom = d3.behavior.zoom()
          .x(x.scale)
          .on("zoom", zoomed);

        svg.call(zoom);
        var hoverLine = timelineCtrl.verticalReference({
          width: graph.width,
          height: graph.height,
          svg: graph.svg
        });
        angular.element(".plot-temporal")
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
        .on("mousemove", function(e){
          var offset = angular.element('.plot-temporal').offset(); 
          var mouseX = e.pageX-offset.left;
          timelineCtrl.drawReferenceAt({
            svg: graph.svg,
            mouseX: mouseX
          });
          scope.$apply(function () {
            scope.timeline.temporalExtent.at = x.scale.invert(mouseX).getTime();            
          })
        });


        scope.timeline.temporalExtent.at = timelineCtrl.halfwayTime(x.scale, graph.width);
        timelineCtrl.drawReferenceAt({
          width: graph.width,
          height: graph.height,
          svg: graph.svg
        });
    };
  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    controller: controller,
    template: '<div id="timeline"></div>'
  }
}]);
