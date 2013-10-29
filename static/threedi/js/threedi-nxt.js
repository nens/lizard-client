app.controller('Threedi', ['$scope', function($scope) {
    // TODO: make the urls not hard-coded
    var socket = io.connect(window.threedi_subgrid_url);  //"http://localhost:9000/subgrid"
    $scope.wms_server_url = window.threedi_wms_server_url; //'http://10.90.20.55:5000/3di/wms';

    $scope.have_master = false;
    $scope.is_master = false;
    $scope.wait_for_server_response = false;  // you can disable buttons after pressing

    $scope.threedi_active = false;
    $scope.program_mode = null;

    $scope.connect = function() {
	    $scope.state = null;
	    $scope.scenarios = null;
        $scope.threedi_active = true;

		console.log('threedi connect');

        socket.socket.reconnect();

	    socket.on('state', function(sender_sessid, your_sessid, state) {
            console.log('processing state from server: ', state);

            $scope.$apply(function() {
                $scope.your_sessid = your_sessid;

                if (state.player_master_sessid !== undefined) {
                    $scope.have_master = true;
                } else {
                    $scope.have_master = false;
                }
                if ($scope.your_sessid == state.player_master_sessid) {
                    $scope.is_master = true;
                } else {
                    $scope.is_master = false;
                }
                // $scope.$apply(function() {
                //     $scope.state = state;
                // });

                // the broadcast is received instantaneous, the watch is slower
                $scope.state = state;
                // (re)enable all affected buttons
                $scope.wait_for_server_response = false;
            });
            $scope.$broadcast('state', '');  

	    });

	    socket.on('scenarios', function(scenarios) {
            console.log('processing scenario list from server: ', scenarios);
            $scope.scenarios = scenarios;
	    });

	    socket.on('message', function(msg, msg_class) {
            console.log('Got a user message from server: ', msg);
	    });
    }

    $scope.disconnect = function() {
        // TODO: $watch instead of $broadcast
        $scope.threedi_active = false;
        $scope.$broadcast('threedi_active_shutdown', '');  // is received instantaneous
        if (socket !== null) {
            console.log('Disconnecting socket...');
            socket.removeAllListeners();
            socket.disconnect();

            $scope.state = null;
            $scope.scenarios = null;
        }
    }

    $scope.requestMaster = function() {
        console.log('Request master');
        socket.emit('set_master', !$scope.is_master, function() {});
    }

    $scope.reset = function() {
        console.log('Reset');
        $scope.wait_for_server_response = true;
        socket.emit(
            'reset_simulation',
            function() {
                if (debug){
                    console.log('emit simulation reset');
                }
            });
    }

    $scope.play_stop = function() {
        $scope.wait_for_server_response = true;
        if ($scope.state.running_sim === "1"){
            console.log('Stop');
            socket.emit(
                'stop_simulation',
                function() {
                    console.log('emit simulation stop');
                });
        } else{
            console.log('Play');
            socket.emit(
                'run_simulation',
                function() {
                    console.log('emit simulation run');
                });
        }
    }

    $scope.setMode = function(mode) {
        // One of the 3Di tools: raincloud, discharge, pump, edit 2D.
        console.log('Set mode :' + mode);
        if (mode == $scope.program_mode) {
            $scope.program_mode = null;  // Disable specific program mode
        } else {
            $scope.program_mode = mode;
        }
    }

    $scope.emitExtent = function(extent) {
        // Emit this extent to the server
        socket.emit(
            'set_map_location', extent,
            function() {
                console.log('emit extent', extent);
            });
    }

}]);


app.directive('threediBox', function() {
    return {
        link: function(scope, element, attrs, ctrl) {
            scope.$watch('state', function() {
                console.log('state change from 3di omnibox');
            });

            // scope.$on('shutdown', function() {
            //     // Remove all elements that are in the GUI.
            //     console.log('shutdown from 3di omnibox');
            // });
        }
    }
});

app.directive('threediMap', function(AnimatedLayer) {
	return {
		require: 'map',
		link: function(scope, element, attrs, MapCtrl){            
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
                if (line_marker) {MapCtrl.removeLayer(line_marker);}
                MapCtrl.addLayer(firstpolyline);
                line_marker = firstpolyline;  // Remember what we've added
            }

            var drawTemp = function(lat, lng, icon) {
                var marker = L.marker(
                    [lat, lng],
                    {icon: icon, opacity: 0.5});
                scenario.temp_objects.push(marker);
                MapCtrl.addLayer(marker);
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
                MapCtrl.addLayer(marker);
            }

            var clearTempObjects = function() {
                setTimeout(function() {
                    for (var i in scenario.temp_objects) {
                        MapCtrl.removeLayer(scenario.temp_objects[i]);
                    }
                    scenario.temp_objects = []; 
                }, 5000);
            }

            var clearScenarioEvents = function() {
                for (var hash in scenario.events) {
                     map.removeLayer(scenario.events[hash].mapmarker);
                     if (scenario.events[hash].mapmarker2 !== null) {
                         MapCtrl.removeLayer(scenario.events[hash].mapmarker2);
                     }
                }
                scenario.events = {};
            }

            var update_scenario_events = function(scenario_events) {
                // Uses directive's
                //console.log('scenario events!!', scenario_events.length);
                var scenario_events = scope.state.scenario_events;
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
                                            MapCtrl.addLayer(temp_rain_dia);
                                            setTimeout(function() {
                                                MapCtrl.removeLayer(temp_rain_dia);
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
                                    MapCtrl.addLayer(map_marker2);
                                    setTimeout(function() {
                                        MapCtrl.removeLayer(map_marker2);
                                    }, 2000);
                                }
                                scenario.events[scenario_event.hash] = {
                                    'mapmarker': map_marker,
                                    'mapmarker2': null,  //map_marker2,
                                    'properties': scenario_event
                                };
                                MapCtrl.addLayer(map_marker);
                            }
                        } else {
                            // Remove an old scenario event.
                            if ((scenario_event.timestep_end !== null) && 
                                (scope.state.timestep >= scenario_event.timestep_end)) {

                                if (scenario.events[scenario_event.hash] !== undefined) {
                                    MapCtrl.removeLayer(scenario.events[scenario_event.hash].mapmarker);
                                    if (scenario.events[scenario_event.hash].mapmarker2 !== null) {
                                        MapCtrl.removeLayer(scenario.events[scenario_event.hash].mapmarker2);
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
                //console.log('setExtent scope is:');
                //console.log(scope);
                // if (scope.state === null) {
                //     return;
                // } 
                var extent = $.parseJSON(scope.state.player_extent);
                //console.log(map);
                MapCtrl.fitBounds([
                    [extent[0], extent[1]],
                    [extent[2], extent[3]]]);
            }

            var emitExtent = function () {
                var bounds = MapCtrl.map().getBounds();
                var extent_list = [
                    bounds._southWest.lat, bounds._southWest.lng,
                    bounds._northEast.lat, bounds._northEast.lng
                    ];
                scope.emitExtent(extent_list);
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

            var setAnimation = function() {
                if (!(wms_ani_initialized == scope.state.loaded_model)) {
                    if (wms_ani_initialized !== null) {
                        animation_shutdown();
                    }

                    // Only call to a global function.
                    wms_ani_layer = AnimatedLayer.animation_init(
                        MapCtrl.map(), scope.state.loaded_model, scope.wms_server_url);
                    // wms_ani_layer = animation_init(value.model_slug, url);
                    wms_ani_initialized = scope.state.loaded_model;
                }
                if (wms_ani_layer !== undefined) {
                    wms_ani_layer.setTimestep(
                        scope.state.timestep, 
                        {hmax: 2.0});
                }
            }

            scope.$watch('follow_3di', function() {
                console.log('Watch follow_3di');
                if (scope.follow_3di) {
                    setExtent();
                }
            });

            // scope.$watch('state', function() {
            //     // React on scope.state change.
            //     console.log('state change');
            //     if (scope.threedi_active) {
            //         update_scenario_events();
            //         if (scope.follow_3di) {
            //             setExtent();
            //         }
            //         setAnimation();
            //     }
            // });

            scope.$on('state', function() {
                // React on scope.state change.
                console.log('state change');
                if (scope.threedi_active) {
                    update_scenario_events();
                    if (scope.follow_3di) {
                        setExtent();
                    }
                    setAnimation();
                }
            });

            // scope.$watch('threedi_active', function() {
            //     if (!scope.threedi_active) {
            //         // Remove all elements that are in the GUI.
            //         animation_shutdown();
            //         clearTempObjects();
            //         clearScenarioEvents();
            //     }
            // });

            scope.$on('threedi_active_shutdown', function() {
                if (!scope.threedi_active) {
                    // Remove all elements that are in the GUI.
                    animation_shutdown();
                    clearTempObjects();
                    clearScenarioEvents();
                }
            });

            MapCtrl.map().on('moveend', function() {
                if (scope.threedi_active && scope.is_master) {
                    emitExtent();
                }
            });

            // console.log(map);
            // map.on('moveend', function(e) {
            // });
	    }
	}
});