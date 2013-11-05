/* Do things on the map and keep track of those things */
app.service('leaflet', 
    function (clientstate, socket, state, AnimatedLayer, $rootScope) {
    var info_marker = null;  // remember my info marker
    var line_marker = null;  // remember my line marker
    var scenario = {};
    var wms_ani_layer = null;
    var wms_ani_initialized = null;  // will be set to model_slug
    var backgroundLayer = null;
    var me = this;

    // rainclouds and manholes that are received from the server.
    scenario.rainclouds = {};
    scenario.manholes = {};
    scenario.events = {};
    // temp rainclouds and manholes for quick user feedback.
    scenario.temp_objects = [];

    if (debug) {
        console.log('initializing leaflet...');
    }

    // Placed a few animation things in leaflet, because they interact with
    // the map.

    /* shut down the animation layer so it can be used for another model */
    var animation_shutdown = function() {
        if (debug){
            console.log('shutting down existing wms ani layer');
        }
        if ((wms_ani_layer !== null) && (wms_ani_layer !== undefined)) {
            wms_ani_layer.shutdown();
        }
        wms_ani_initialized = null;
    };

    $rootScope.$on('LayerSwitch', function(message, value){
        L.tileLayer(value, {
            fadeAnimation: false
        }).addTo(map);        
    });

    $rootScope.$on('animation-shutdown', animation_shutdown);

    // WMS server url as specified in index.html
    this.wms_server_url = function() {
        // TODO: get the url in a prettier way.
        var $layer = $(".workspace-wms-layer");  // there is only one
        var url = $layer.attr("data-workspace-wms-url");
        return url;
    }

    /* Set timestep of animation value.timestep, value.model_slug */
    $rootScope.$on('animation-timestep', function(message, value) {
        if (!(wms_ani_initialized == value.model_slug)) {
            if (wms_ani_initialized !== null) {
                animation_shutdown();
            }

            var url = me.wms_server_url();

            // Only call to a global function.
            wms_ani_layer = AnimatedLayer.animation_init(value.model_slug, url);
            // wms_ani_layer = animation_init(value.model_slug, url);
            wms_ani_initialized = value.model_slug;
        }
        if (wms_ani_layer !== undefined) {
            wms_ani_layer.setTimestep(
                value.timestep, 
                clientstate.scenario_event_defaults.wms_options);
        }
    });

    // Guess size of extent in meters, biggest axis. For things relative sized
    // to the screen.
    var extentSize = function() {
        var bounds = map.getBounds();
        // 2 * pi * r / 360 = 111 km per degrees, approximately
        var size = Math.max(
            Math.abs(bounds._southWest.lat - bounds._northEast.lat), 
            Math.abs(bounds._southWest.lng - bounds._northEast.lng)
            ) * 111000;
        return size;
    }

    var emitExtent = function () {
        var bounds = map.getBounds();
        var extent_list = [
            bounds._southWest.lat, bounds._southWest.lng,
            bounds._northEast.lat, bounds._northEast.lng
            ];
        socket.emit(
            'set_map_location', extent_list,
            function() {
                if (debug){
                    console.log('emit map location', extent_list);
                }
            });
    }

    // Draw a line and remove existing line (if exists).
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
        console.log('draw temp poly');
        console.log(poly);
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


    // mousedown/mouseup does not work on iPad!

    // var mouse_timer = null;
    // var mouse_down_event = null;

    // map.on('mousedown', function onMapClick(e) {
    //     //console.log("mouse down!!!");
    //     mouse_timer = new Date().getTime();
    //     mouse_down_event = e;
    // });

    // map.on('mouseup', function onMapClick(e) {
    //     var click_duration = new Date().getTime() - mouse_timer;
    //     // console.log("mouse up!!!");
    //     // console.log(mouse_down_event);
    //     // console.log(e);
    //     // console.log(click_duration);

    //     if ((mouse_down_event.originalEvent.clientX !== e.originalEvent.clientX) || 
    //         (mouse_down_event.originalEvent.clientY !== e.originalEvent.clientY)) {
    //         // ignore move
    //         //console.log("detect move");
    //     } else if (click_duration > 1000) {
    //         //console.log("detect click long");
    //         // Alpha function: choose some color by click-and-hold
    //         clientstate.scenario_event_defaults.edit_land_use_color = (
    //             clientstate.scenario_event_defaults.edit_land_use_color + 1) % 
    //             clientstate.scenario_event_defaults.edit_land_use_colors.length;
    //         clientstate.random += 1;  // manually trigger a $watch
    //         showalert('New land use chosen.');
    //     } else {
    //         //console.log("detect click short");
    //         handle_short_click(e);
    //     }
    // });

    map.on('click', function onMapClick(e) {
        handle_short_click(e);
    });

    var handle_short_click = function(e) {
        if (clientstate.program_mode === MODE_NAVIGATE) {
            if (debug){
                console.log("click in navigate mode");
                    };
            // Close any open box. Why doesn't this work right away?
            $rootScope.$broadcast('close_box', '');
        } else if ((clientstate.program_mode === MODE_MANHOLE) || 
                (clientstate.program_mode === MODE_DISCHARGE)) {
            var amount;
            if (clientstate.program_mode === MODE_MANHOLE) {
                amount = clientstate.scenario_event_defaults.manhole_amount;
            } else {
                amount = clientstate.scenario_event_defaults.discharge_amount;
            }

            if (debug){
                console.log("click in manhole/discharge mode: ", 
                    e.latlng.lng, e.latlng.lat,
                    amount);
            };
            // send data to server
            socket.emit('add_manhole', e.latlng.lng, e.latlng.lat, 
                amount,
                function() {
                    if (debug){
                        console.log('emit manhole/discharge placement');
                    };
                });
            // place temp manhole
            if (clientstate.program_mode === MODE_MANHOLE) {
                drawTemp(e.latlng.lat, e.latlng.lng, manholeIcon());
            } else {
                drawTemp(e.latlng.lat, e.latlng.lng, dischargeIcon());
            }
        } else if (clientstate.program_mode === MODE_RAIN) {
            var rain_diameter = extentSize() * 0.15;
            if (debug){
                console.log("click in rain mode: ", 
                    e.latlng.lng, e.latlng.lat, 
                    rain_diameter, 
                    clientstate.scenario_event_defaults.rain_amount);
            };
            socket.emit('add_rain', e.latlng.lng, e.latlng.lat, 
                rain_diameter, //500.0, 
                clientstate.scenario_event_defaults.rain_amount, //0.01,
                function() {
                    if (debug){
                        console.log('emit rain');
                    };
                });
            // place temp raincloud
            drawTemp(e.latlng.lat, e.latlng.lng, raincloudIcon());
        } else if (clientstate.program_mode === MODE_EDIT){
            if (debug){
                console.log("click in edit mode: ", 
                    e.latlng.lng, e.latlng.lat,
                    clientstate.scenario_event_defaults.bathy_value, //15.0, 
                    clientstate.scenario_event_defaults.bathy_mode //1,
                );
            };
            // size, value, mode
            // mode 0 = relative, mode 1 = absolute
            var size = extentSize() * 0.02 * clientstate.scenario_event_defaults.twodee_edit_size;
            var value = 0;
            var color_value = null;
            if (clientstate.edit_mode === 'edit-bathy') {
                value = clientstate.scenario_event_defaults.bathy_value;
                if (value >= 0) {
                    color_value = "#995522";  // default color
                } else {
                    color_value = "#663311";
                }
            } else if (clientstate.edit_mode === 'edit-land-use') {
                color_value = clientstate.scenario_event_defaults.edit_land_use_colors[
                    clientstate.scenario_event_defaults.edit_land_use_color];
            }

            // Add temporary for fast feedback
            drawTempRect(e.latlng.lat, e.latlng.lng, size, color_value);

            socket.emit('edit', clientstate.edit_mode,
                e.latlng.lng, e.latlng.lat, size, 
                value, //15.0, 
                clientstate.scenario_event_defaults.bathy_mode, //1,
                color_value,
                function() {
                    if (debug){
                        console.log('emit edit');
                    };
                });
        } else if (clientstate.program_mode === MODE_INFO_POINT){
            $rootScope.$broadcast('open_box', {
                type: 'infopoint',
                point: e.latlng,
                loaded_model: state.loaded_model,
                mode: clientstate.scenario_event_defaults.info_mode
            });
            if (info_marker !== null) {map.removeLayer(info_marker);}
            info_marker = L.marker(
                e.latlng, 
                {icon: infoMarker(), bounceOnAdd: true}).addTo(map);
        } else if (clientstate.program_mode === MODE_INFO_LINE){
            /*
http://localhost:5000/3di/data?request=getprofile&layers=DelflandiPad&srs=EPSG%3A900913&line=LINESTRING+(487690.73298813+6804234.0094661%2C488588.86807036+6803985.5891242)&time=28

            */
            if (clientstate.first_click === null) {
                clientstate.first_click = e.latlng;
                showalert("Now click a second time to draw a line.");
                return;
            }

            $rootScope.$broadcast('open_box', {
                type: 'infoline',
                firstpoint: clientstate.first_click,
                endpoint: e.latlng,
                loaded_model: state.loaded_model
            });

            drawLine(clientstate.first_click, e.latlng);

            clientstate.first_click = e.latlng;

        } else {
            if (debug) {
                console.log("click in unhandled mode: " + clientstate.program_mode);
            }
        }
    };

    map.on('moveend', function(e) {
        // console.log('move end!!!');
        // console.log(e);
        if (state.master) {
                emitExtent();
            }
    });

    // Draw all scenario event objects on map
    $rootScope.$on('scenario_events', function(message, scenario_events) {
        //console.log('scenario events!!', scenario_events.length);
        if (scenario_events.length === 0) {
            for (var hash in scenario.events) {
                 map.removeLayer(scenario.events[hash].mapmarker);
                 if (scenario.events[hash].mapmarker2 !== null) {
                     map.removeLayer(scenario.events[hash].mapmarker2);
                 }
            }
            scenario.events = {};
        } else {
            scenario_events.forEach(function(scenario_event){
                // only show a marker once based on rain_cloud.hash
                if (!scenario.events.hasOwnProperty(scenario_event.hash)){
                    // only draw a marker for non-ended items
                    if (((scenario_event.timestep_end === undefined) || 
                        (scenario_event.timestep_end === null)  || 
                        (state.time.at <= scenario_event.timestep_end)) && 
                        (state.time.at >= scenario_event.timestep_start)){

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
                        (state.time.at >= scenario_event.timestep_end)) {

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
    });


    $rootScope.$on('set-extent', function(message, extent) {
        if (debug){
            console.log('new extent: ', extent);
        }
        map.fitBounds([
            [extent[0], extent[1]],
            [extent[2], extent[3]]]);
    });

    /*$rootScope.$on('init-animation', function(message, extent) {
        this.wms_ani_layer = init_animation();
    }); */


    backgroundLayer = funcBackgroundLayer;

    this.updatebgLayers = function(layer) {
        if (backgroundLayer != layer){
            map.removeLayer(backgroundLayer);
            backgroundLayer = layer;
            map.addLayer(backgroundLayer, true);
            backgroundLayer.bringToBack();
        }
    };

    this.removeInfoMarker = function() {
            if (info_marker !== null) {
                map.removeLayer(info_marker);
                info_marker = null;
            }
        };

    this.removeLineMarker = function() {
            if (line_marker !== null) {
                map.removeLayer(line_marker);
                line_marker = null;
            }
        };

});
