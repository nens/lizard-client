var data = [
  { date: 1357714800000, value: Math.random()},
  { date: 1357714800000 + 100000, value: Math.random()},
  { date: 1357714800000 + 200000, value: Math.random()},
  { date: 1357714800000 + 300000, value: Math.random()},
  { date: 1357714800000 + 400000, value: Math.random()},
  { date: 1357714800000 + 500000, value: Math.random()},
  { date: 1357714800000 + 600000, value: Math.random()},
  { date: 1357714800000 + 700000, value: Math.random()},
  { date: 1357714800000 + 800000, value: Math.random()},
  { date: 1357714800000 + 900000, value: Math.random()},
  { date: 1357714800000 + 1000000, value: Math.random()},
  { date: 1357714800000 + 1100000, value: Math.random()},
  { date: 1357714800000 + 1200000, value: Math.random()},
  { date: 1357714800000 + 1300000, value: Math.random()},
  { date: 1357714800000 + 1400000, value: Math.random()},
  { date: 1357714800000 + 1500000, value: Math.random()},
  { date: 1357714800000 + 1600000, value: Math.random()},
  { date: 1357714800000 + 1700000, value: Math.random()},
];

// Timeline for lizard.
app.directive('timeline', [ function ($timeout) {

  var controller = function ($scope){
    this.createCanvas = function (element, options) {
      var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 30
      };
  
      var maxwidth = options.width,
          maxheight = options.height;
  
      var width = maxwidth - margin.left - margin.right,
        height = maxheight - margin.top - margin.bottom;
  
      var svg = d3.select(element[0])
        .html("")
        .append("svg:svg")
        .attr('width', maxwidth)
        .attr('height', maxheight)
        .append("svg:g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 
      svg.append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "plot");
      return {
        svg: svg,
        height: height,
        width: width,
        margin: margin
      }
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
      var x = timelineCtrl.maxMin(data, 'date');
      var y = timelineCtrl.maxMin(data, 'value');
      x.scale = timelineCtrl.scale(x.min, x.max, {
        type: 'time',
        range: [0, graph.width]
      });
      y.scale = timelineCtrl.scale(y.min, y.max, {range: [graph.height, 0]});
      timelineCtrl.drawBars(graph.svg, x, y, data, {
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
            scope.timeline.temporalExtent.changedZoom = Date.now();
          });

        };

        var zoom = d3.behavior.zoom()
          .x(x.scale)
          .on("zoom", zoomed);

        svg.call(zoom);
    };
    scope.$watch('timeline.temporalExtent.changed', function () {
      drawChart();
    });
  };

  return {
    replace: true,
    restrict: 'E',
    link: link,
    controller: controller,
    template: '<div id="timeline"><svg></svg>  </div>'
  }
}]);
