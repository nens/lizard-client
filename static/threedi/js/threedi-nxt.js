app.directive('threedi', function () {
	return {
		controller: function($scope) {
		    // var socket = io.connect(
		    // 	"http://localhost:9000/subgrid", 
		    // 	{'transports': ['xhr-polling', 'websocket']});
            //var socket = null;

            // TODO: how to connect to another server? Re-creating the socket
            // object does not work fine...

            var socket = io.connect("http://localhost:9000/subgrid");

            this.connect = function() {

    		    $scope.state = null;
    		    $scope.scenarios = null;
                //$scope.state_counter = 0;

    			console.log('threedi connect');

                socket.socket.reconnect();

    		    socket.on('state', function(sender_sessid, your_sessid, state) {
                    console.log('processing state from server: ', state);
                    $scope.state = state;
                    // scope.state_counter += 1;
                    // TODO: $watch instead of $broadcast
                    $scope.$broadcast('stateChange', '');
    		    });

    		    socket.on('scenarios', function(scenarios) {
    	            console.log('processing scenario list from server: ', scenarios);
    	            $scope.scenarios = scenarios;
    		        //$scope.state.setAvailableScenarios(scenarios);
    		    });

    		    socket.on('message', function(msg, msg_class) {
    	            console.log('Got a user message from server: ', msg);
    		        //showalert(msg, msg_class);
    		    });

            }

            this.disconnect = function() {
                // TODO: $watch instead of $broadcast
                $scope.$broadcast('shutdown', '');
                if (socket !== null) {
                    console.log('Disconnecting socket...');
                    socket.removeAllListeners();
                    socket.disconnect();

                    $scope.state = null;
                    $scope.scenarios = null;
                    //socket = null;
                }
            }

            this.toExtent = function() {
                // make the watch work. ugly
                $scope.toExtent = !$scope.toExtent; 
            }

		},
		link: function(scope, element, attrs) {
			console.log('threediNxt');

            // var socket = io.connect("http://localhost:9000/subgrid");
            // scope.state = null;
            // scope.scenarios = null;
            // // scope.state_counter = 0;

            // console.log('threediNxt controller');

            // socket.on('state', function(sender_sessid, your_sessid, state) {
            //     console.log('processing state from server: ', state);
            //     scope.state = state;
            //     // scope.state_counter += 1;
            //     scope.$broadcast('stateChange', '');
            //     //$scope.state.setState(state, your_sessid);
            // });

            // socket.on('scenarios', function(scenarios) {
            //     console.log('processing scenario list from server: ', scenarios);
            //     scope.scenarios = scenarios;
            //     //$scope.state.setAvailableScenarios(scenarios);
            // });

            // socket.on('message', function(msg, msg_class) {
            //     console.log('Got a user message from server: ', msg);
            //     //showalert(msg, msg_class);
            // });

		}
	}
});

app.directive('threediMap', function(AnimatedLayer) {
	return {
		require: ['^threedi', 'map'],
		link: function(scope, element, attrs, ctrl){            
			// scope.$watch('state_counter', function () {
			// 	console.log('Detected state change');
			// });
            // Draw a line and remove existing line (if exists).
            var scenario = {};
            // rainclouds and manholes that are received from the server.
            scenario.rainclouds = {};
            scenario.manholes = {};
            scenario.events = {};
            // temp rainclouds and manholes for quick user feedback.
            scenario.temp_objects = [];

            // Creates a red marker with the coffee icon
            var infoMarker = function(color) {
                if (color === undefined) {
                    color = 'green';
                }   
                return L.AwesomeMarkers.icon({
                    icon: 'icon-info', 
                    color: color
                });
            }

            var raincloudIcon = function(color) {
                if (color === undefined) {
                    color = 'red';
                }   
                return L.AwesomeMarkers.icon({
                    icon: 'icon-threedi-rain', 
                    color: color
                });
            }

            var dischargeIcon = function(color) {
                if (color === undefined) {
                    color = 'blue';
                }   
                return L.AwesomeMarkers.icon({
                    icon: 'icon-threedi-manhole', 
                    color: color
                });
            }

            var manholeIcon = function(color) {
                if (color === undefined) {
                    color = 'blue';
                }   
                return L.AwesomeMarkers.icon({
                    icon: 'icon-threedi-pump', 
                    color: color,
                    iconColor: '#000000'
                });
            }

            var drawLine = function(startpoint, endpoint) {
                var pointList = [startpoint, endpoint];
                var firstpolyline = L.polyline(pointList, {
                    color: 'green',
                    weight: 3,
                    opacity: 1,
                    smoothFactor: 1
                });        
                if (line_marker) {map.removeLayer(line_marker);}
                map.addLayer(firstpolyline);
                line_marker = firstpolyline;  // Remember what we've added
            }

            var drawTemp = function(lat, lng, icon) {
                var marker = L.marker(
                    [lat, lng],
                    {icon: icon, opacity: 0.5});
                scenario.temp_objects.push(marker);
                map.addLayer(marker);
            }

            var drawTempRect = function(lat, lng, size_m, color) {
                var size = size_m / 135 / 1000;  // a guess of the size, then somewhat smaller
                var poly = [
                    [lat-size*0.6, lng+size],
                    [lat-size*0.6, lng-size],
                    [lat+size*0.6, lng-size],
                    [lat+size*0.6, lng+size]];
                // console.log('draw temp poly');
                // console.log(poly);
                var marker = L.polygon(poly, {
                    stroke: false, fillColor: color, 
                    fillOpacity: 0.5, clickable: false});
                scenario.temp_objects.push(marker);
                map.addLayer(marker);
            }

            var clearTempObjects = function() {
                setTimeout(function() {
                    for (var i in scenario.temp_objects) {
                        map.removeLayer(scenario.temp_objects[i]);
                    }
                    scenario.temp_objects = []; 
                }, 5000);
            }

            var clearScenarioEvents = function() {
                var map = ctrl[1];
                for (var hash in scenario.events) {
                     map.removeLayer(scenario.events[hash].mapmarker);
                     if (scenario.events[hash].mapmarker2 !== null) {
                         map.removeLayer(scenario.events[hash].mapmarker2);
                     }
                }
                scenario.events = {};
            }

            var update_scenario_events = function(scenario_events) {
                // Uses directive's
                //console.log('scenario events!!', scenario_events.length);
                var scenario_events = scope.state.scenario_events;
                var map = ctrl[1];
                if (scenario_events.length === 0) {
                    // for (var hash in scenario.events) {
                    //      map.removeLayer(scenario.events[hash].mapmarker);
                    //      if (scenario.events[hash].mapmarker2 !== null) {
                    //          map.removeLayer(scenario.events[hash].mapmarker2);
                    //      }
                    // }
                    // scenario.events = {};
                    clearScenarioEvents();
                } else {
                    scenario_events.forEach(function(scenario_event){
                        // only show a marker once based on rain_cloud.hash
                        if (!scenario.events.hasOwnProperty(scenario_event.hash)){
                            // only draw a marker for non-ended items
                            if (((scenario_event.timestep_end === undefined) || 
                                (scenario_event.timestep_end === null)  || 
                                (scope.state.timestep <= scenario_event.timestep_end)) && 
                                (scope.state.timestep >= scenario_event.timestep_start)){

                                var map_marker2 = null;  // raincloud has 2 markers
                                if (scenario_event.type === 'raincloud') {
                                    var marker_color = 'red';
                                    if (scenario_event.amount > 20) {
                                        marker_color = 'darkred';
                                    }
                                    var map_marker = L.marker(
                                        [scenario_event.wgs84_y, scenario_event.wgs84_x],
                                        {icon: raincloudIcon(marker_color), 
                                         riseOnHover: true, bounceOnAdd: true});
                                    map_marker.on('click', function(){
                                        if (state.master){
                                            // Temporary show circle.
                                            var temp_rain_dia = L.circle(
                                                [scenario_event.wgs84_y, scenario_event.wgs84_x], 
                                                scenario_event.diameter/2, 
                                                {color: '#8888ff', stroke: false, 
                                                fillOpacity: 0.3, 
                                                clickable: false} );
                                            map.addLayer(temp_rain_dia);
                                            setTimeout(function() {
                                                map.removeLayer(temp_rain_dia);
                                            }, 2000);

                                            // Box
                                            var content = {
                                                type: 'raincloud',
                                                properties: scenario_event,
                                                marker: map_marker
                                            }
                                            $rootScope.$broadcast('open_box', content);
                                        }
                                    });
                                    map_marker2 = L.circle(
                                        [scenario_event.wgs84_y, scenario_event.wgs84_x], 
                                        scenario_event.diameter/2, 
                                        {color: '#8888ff', stroke: false, 
                                        fillOpacity: 0.3, 
                                        clickable: false} );
                                } else if (scenario_event.type === 'manhole') {
                                    var marker_color = 'blue';
                                    if (scenario_event.amount > 100) {
                                        marker_color = 'darkblue';
                                    }
                                    if (scenario_event.amount > 0) {
                                        var marker_icon = dischargeIcon(marker_color);
                                    } else {
                                        var marker_icon = manholeIcon();
                                    }
                                    var map_marker = L.marker(
                                        [scenario_event.wgs84_y, scenario_event.wgs84_x],
                                        {icon: marker_icon, 
                                         riseOnHover: true, 
                                        bounceOnAdd: true});
                                    map_marker.on('click', function(){
                                        if (state.master){
                                            var content = {
                                                type: 'manhole',
                                                properties: scenario_event,
                                                marker: map_marker
                                            }
                                            $rootScope.$broadcast('open_box', content);
                                        }
                                    });
                                } else if (scenario_event.type === 'twodee-edit') {
                                    var poly = [
                                        [parseFloat(scenario_event.wgs84_y0), parseFloat(scenario_event.wgs84_x1)],
                                        [parseFloat(scenario_event.wgs84_y0), parseFloat(scenario_event.wgs84_x0)],
                                        [parseFloat(scenario_event.wgs84_y1), parseFloat(scenario_event.wgs84_x0)],
                                        [parseFloat(scenario_event.wgs84_y1), parseFloat(scenario_event.wgs84_x1)]];
                                    var marker_color = scenario_event.color_value;
                                    var map_marker = L.polygon(poly, {
                                        stroke: false, fillColor: marker_color, 
                                        fillOpacity: 1, clickable: false});
                                    map_marker.on('click', function(){
                                        var content = {
                                            type: 'generic-info',
                                            properties: scenario_event,
                                            marker: map_marker
                                        }
                                        $rootScope.$broadcast('open_box', content);
                                    });
                                } else {
                                    console.log('Error: scenario_event type unknown [' + scenario_event.type + ']');
                                }
                                if (map_marker2 !== null) {
                                    map.addLayer(map_marker2);
                                    setTimeout(function() {
                                        map.removeLayer(map_marker2);
                                    }, 2000);
                                }
                                scenario.events[scenario_event.hash] = {
                                    'mapmarker': map_marker,
                                    'mapmarker2': null,  //map_marker2,
                                    'properties': scenario_event
                                };
                                map.addLayer(map_marker);
                            }
                        } else {
                            // Remove an old scenario event.
                            if ((scenario_event.timestep_end !== null) && 
                                (scope.state.timestep >= scenario_event.timestep_end)) {

                                if (scenario.events[scenario_event.hash] !== undefined) {
                                    map.removeLayer(scenario.events[scenario_event.hash].mapmarker);
                                    if (scenario.events[scenario_event.hash].mapmarker2 !== null) {
                                        map.removeLayer(scenario.events[scenario_event.hash].mapmarker2);
                                    }
                                }
                            }
                        }
                    });
                }
                // Remove temp objects: the server must have picked them up.
                clearTempObjects();
            };

            var setExtent = function() {
                var extent = $.parseJSON(scope.state.player_extent);
                var map = ctrl[1];
                //console.log(map);
                map.fitBounds([
                    [extent[0], extent[1]],
                    [extent[2], extent[3]]]);
            }


            var wms_ani_initialized = null;  // will be set to model_slug
            var wms_ani_layer = null;

            /* shut down the animation layer so it can be used for another model */
            var animation_shutdown = function() {
                console.log('shutting down existing wms ani layer');
                if ((wms_ani_layer !== null) && (wms_ani_layer !== undefined)) {
                    wms_ani_layer.shutdown();
                }
                wms_ani_initialized = null;
                wms_ani_layer = null;
            };

            // TODO: make the url not hard-coded
            var wms_server_url = 'http://10.90.20.55:5000/3di/wms'

            var setAnimation = function() {
                if (!(wms_ani_initialized == scope.state.loaded_model)) {
                    if (wms_ani_initialized !== null) {
                        animation_shutdown();
                    }

                    // Only call to a global function.
                    wms_ani_layer = AnimatedLayer.animation_init(
                        ctrl[1], scope.state.loaded_model, wms_server_url);
                    // wms_ani_layer = animation_init(value.model_slug, url);
                    wms_ani_initialized = scope.state.loaded_model;
                }
                if (wms_ani_layer !== undefined) {
                    wms_ani_layer.setTimestep(
                        scope.state.timestep, 
                        {hmax: 2.0});
                }
            }

            scope.$on('stateChange', function() {
                // React on scope.state change.
                update_scenario_events();
                if (scope.follow_3di) {
                    setExtent();
                }
                setAnimation();
            });

            scope.$on('shutdown', function() {
                // Remove all elements that are in the GUI.
                animation_shutdown();
                clearTempObjects();
                clearScenarioEvents();
            });

            // react on function call toExtent
            scope.$watch('toExtent', function() {
                if (scope.toExtent !== undefined) {
                    setExtent();
                }
            });
	    }
	}
});