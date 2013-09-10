//nxt-graph.js

// create the directives as re-usable components
app
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


app
.directive('nxtLineGraph', function(Cabinet, $timeout) {  
  return {
    restrict: 'E',
    template: '<div id="chart"></div>',
    scope: {
      data: '='
    }
    link: function(scope, element, attrs) {
      var data = scope.data,
      margin = {
          top: 20,
          right: 20,
          bottom: 20,
          left: 45
      }, 
      width = 400 - margin.left - margin.right, 
      height = 200 - margin.top - margin.bottom,
      chart = function(){
            var x = d3.time.scale()
                .domain(d3.extent(data, function (d) {
                return d.date;
            }))
                .range([0, width]);

            var y = d3.scale.linear()
                .domain(d3.extent(data, function (d) {
                return d.value;
            }))
            .range([height, 0]);


        var line = d3.svg.line()
            .x(function (d) {
            return x(d.date);
        })
            .y(function (d) {
            return y(d.value);
        });

        var zoom = d3.behavior.zoom()
          .x(x)
          .y(y)
          .on("zoom", zoomed);
        
          // Make sure your context as an id or so...
          console.log(element.context)
          var svg = d3.select(element.context)
            .append("svg:svg")
            .attr('width', 500)
            .attr('height', 300)
            .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom);

            svg.append("svg:rect")
              .attr("width", width)
              .attr("height", height)
              .attr("class", "plot");

          var make_x_axis = function () {
              return d3.svg.axis()
                  .scale(x)
                  .orient("bottom")
                  .ticks(5);
          };

          var make_y_axis = function () {
              return d3.svg.axis()
                  .scale(y)
                  .orient("left")
                  .ticks(5);
          };

          var xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom")
              .ticks(5);

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
              .attr("transform", "translate(0," + height + ")")
              .call(make_x_axis()
              .tickSize(-height, 0, 0)
              .tickFormat(""));

          svg.append("g")
              .attr("class", "y grid")
              .call(make_y_axis()
              .tickSize(-width, 0, 0)
              .tickFormat(""));

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

          function zoomed() {
              svg.select(".x.axis").call(xAxis);
              svg.select(".y.axis").call(yAxis);
              svg.select(".x.grid")
                  .call(make_x_axis()
                  .tickSize(-height, 0, 0)
                  .tickFormat(""));
              svg.select(".y.grid")
                  .call(make_y_axis()
                  .tickSize(-width, 0, 0)
                  .tickFormat(""));
              svg.select(".line")
                  .attr("class", "line")
                  .attr("d", line);
          }
      };
      chart()
    }
  }
});

app
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
