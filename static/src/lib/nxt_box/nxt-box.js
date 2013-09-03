app.controller("OmniboxCtrl",
    ["$scope", "$resource", "$rootScope",
        function($scope, $resource, $rootScope){

    $scope.box = {
        Search: $resource('/api/v1/search/'),
        Geocode: $resource('/api/v1/geocode/'),
        ReverseGeocode: $resource('/api/v1/reversegeocode/'),
        query: null,
        disabled: false,
        showCards: false,
        content: 'empty'
	};

    $scope.filter = function ($event) {
        $scope.box.showCards = true;
        if ($scope.box.query.length > 1) {
            var search = $scope.box.Search.get({q:$scope.box.query}, function(data) {
                console.log(data.hits.hits);
                var sources = [];
                for(var i in data.hits.hits) {
                    sources.push(data.hits.hits[i]._source);
                }
                $scope.searchData = sources;
            });

            var geocode = $scope.box.Geocode.query({q:$scope.box.query}, function(data) {
                console.log(data);
                $scope.geocodeData = data;
            });
        }
    };

    $scope.saveAsFavorite = function(data) {
        console.log("debug:", data);
        alert('Opslaan kan nog niet...');
    };

    $scope.shareFeature = function(data) {
        console.log("debug:", data);
        alert('Delen kan nog niet...');
    };


    $scope.reset_query = function() {
        $scope.box.query = null;
    };

    $scope.close_box = function(){
        $scope.box.showCards = false;
    };

    $scope.open_box = function() {
        $scope.box.showCards = true;
    };

    $scope.panzoom = function(lat,lon) {
        // getting pan/zoom request, tell map to pan zoom to location
        $rootScope.$broadcast('panzoom', lat, lon);
    };


    $scope.$on('open_box', function(message, content) {
        console.log('entering');
        $scope.open_box();
        if (content){
            var timeseries = $resource("/api/v1/timeseries/?location__object_type__name=:entityName&location__object_id=:dataId", {
                entityName : "@entityName",
                dataId: "@id"
            });
            timeseries.get({
                entityName: content.entity_name,
                dataId: content.id
            })
            console.log(timeseries)
                    /* implementation heavily influenced by http://bl.ocks.org/1166403 */
        
        // define dimensions of graph
        var m = [80, 80, 80, 80]; // margins
        var w = 1000 - m[1] - m[3]; // width
        var h = 400 - m[0] - m[2]; // height
        
        // create a simple data array that we'll plot with a line (this array represents only the Y values, X will just be the index location)
        var data = [3, 6, 2, 7, 5, 2, 0, 3, 8, 9, 2, 5, 9, 3, 6, 3, 6, 2, 7, 5, 2, 1, 3, 8, 9, 2, 5, 9, 2, 7].map(function(x) { return  x * Math.random() *10; });;
        
        console.log(data)

        // X scale will fit all values from data[] within pixels 0-w
        var x = d3.scale.linear().domain([0, data.length]).range([0, w]);
        // Y scale will fit values from 0-10 within pixels h-0 (Note the inverted domain for the y-scale: bigger is up!)
        var y = d3.scale.linear().domain([0, 40]).range([h, 0]);
            // automatically determining max range can work something like this
            // var y = d3.scale.linear().domain([0, d3.max(data)]).range([h, 0]);

        // create a line function that can convert data[] into x and y points
        var line = d3.svg.line()
            // assign the X function to plot our line as we wish
            .x(function(d,i) { 
                // verbose logging to show what's actually being done
                console.log('Plotting X value for data point: ' + d + ' using index: ' + i + ' to be at: ' + x(i) + ' using our xScale.');
                // return the X coordinate where we want to plot this datapoint
                return x(i); 
            })
            .y(function(d) { 
                // verbose logging to show what's actually being done
                console.log('Plotting Y value for data point: ' + d + ' to be at: ' + y(d) + " using our yScale.");
                // return the Y coordinate where we want to plot this datapoint
                return y(d); 
            })

            // Add an SVG element with the desired dimensions and margin.
            var graph = d3.select("#graph").append("svg:svg")
                  .attr("width", w + m[1] + m[3])
                  .attr("height", h + m[0] + m[2])
                .append("svg:g")
                  .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

            // create yAxis
            var xAxis = d3.svg.axis().scale(x).tickSize(-h).tickSubdivide(true);
            // Add the x-axis.
            graph.append("svg:g")
                  .attr("class", "x axis")
                  .attr("transform", "translate(0," + h + ")")
                  .call(xAxis);


            // create left yAxis
            var yAxisLeft = d3.svg.axis().scale(y).ticks(4).orient("left");
            // Add the y-axis to the left
            graph.append("svg:g")
                  .attr("class", "y axis")
                  .attr("transform", "translate(-25,0)")
                  .call(yAxisLeft);
            
            // Add the line by appending an svg:path element with the data line we created above
            // do this AFTER the axes above so that the line is above the tick-lines
            graph.append("svg:path").attr("d", line(data));
            
        }
        $scope.content = content;
    });

    $scope.$on('featureclick', function(message, content) {
        console.log('feature was clicked!', content);
        $scope.featureData = content;
        $scope.$apply();
        // this should be done differently
    });


    $scope.$on('mapclick', function(message, content) {
        // console.log('map was clicked!!!', content.lat);

        // var reversegeocode = $scope.box.ReverseGeocode.get({
        //     lat:content.lat,
        //     lon:content.lng
        // }, function(data) {
        //     console.log(data);
        //     // show card for data!
        // });

    });


    // $scope.$on('open_box', function(message, content) {
    //     // Somewhat hacky: selected icon lights up

    //     if ($scope.box.content.marker !== undefined){
    //         $scope.box.content.marker._icon.classList.remove('selected-icon');
    //     }
    //     if ($scope.box.content !== 'empty') {
    //         $scope.close_box();  // close box and clean stuff up.
    //     }
    //     $scope.$apply(function() {
    //         $scope.box.content = content;
    //         $scope.box.disabled = false;
    //     });
    //     // If you have dynamic content, you should listen to this broadcast.
    //     $scope.$broadcast(content.type, content);
    // });

    // Close the box from another scope using $rootScope.$broadcast
    $scope.$on('close_box', function(message, content) {
        $scope.close_box();
    });

    $scope.$on('keypress-esc', function(message, content) {
        $scope.close_box();
    });
}]);