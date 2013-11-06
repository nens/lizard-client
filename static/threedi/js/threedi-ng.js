'use strict';

var MODE_NAVIGATE = 'navigate',
    MODE_FLOODFILL = 'floodfill',
    MODE_DISCHARGE = 'discharge',
    MODE_MANHOLE = 'manhole',
    MODE_RAIN = 'rain',
    MODE_EDIT = 'edit',
    MODE_INFO_POINT = 'infopoint',
    MODE_INFO_LINE = 'infoline';

// In MODE_EDIT we use these subdivisions
var EDIT_MODE_DEFAULT = 'edit-bathy',
    EDIT_MODE_BATHY = 'edit-bathy',  // bathymetry
    EDIT_MODE_LAND_USE = 'edit-land-use';  // landgebruik, testing

//var app = angular.module("3di-ipad", ['ui.directives']);

/* Prevent tags collapsing with Django template tags */
/*app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
});*/


/* The ClientState controller controls and watches the state. In every child you
 can use setMode(mode) to set a mode and let the buttons react on it.*/
app.controller("ClientState",
    ["$scope", "clientstate", 
    function($scope, clientstate){

    $scope.clientstate = clientstate;
    //$scope.advanced = true;  // advanced mode reveals some more features
    // $scope.edit_info = '';

    // $scope.$watch('clientstate', function(newvalue, oldvalue){
    //     console.log('client state watch:');
    //     console.log(newvalue);
    //     //console.log(oldvalue);
    //     // if (newvalue !== undefined) {
    //     //    $scope.mode = newvalue.program_mode;  // Triggers blue buttons
    //     // }
    //     if (newvalue.program_mode == 'edit') {
    //         if (newvalue.edit_mode == 'edit-bathy') {
    //             $scope.edit_info = 'DEM';  // indicates that you edit the DEM
    //         } else if (newvalue.edit_mode == 'edit-land-use') {
    //             $scope.edit_info = 'Land use ' + 
    //                 newvalue.scenario_event_defaults.edit_land_use_names[
    //                     newvalue.scenario_event_defaults.edit_land_use_color];
    //         }
    //     }
    // }, true);  // true means that the object is watched recursively.

    $scope.setMode = function(mode) {
        if (clientstate.program_mode !== mode) {
            // turn button on
            console.log("Setting program mode " + mode);
            clientstate.setMode(mode);
        } else {
            // turn off
            clientstate.setMode(MODE_NAVIGATE);
        }
    };

    // this message comes from "state"
    $scope.$on('isMaster', function(message, value){
        $scope.isMaster = value;
    });

    // Remember: the buttons info-point, info-line, etc are part of
    // ClientState. The controllers are bound to the popup.
    $scope.$on('keypress-info-point', function(message, value) {
        $scope.setMode(MODE_INFO_POINT);
    });

    $scope.$on('keypress-info-line', function(message, value) {
        $scope.setMode(MODE_INFO_LINE);
    });

    $scope.$on('keypress-navigate', function(message, value) {
        $scope.setMode(MODE_NAVIGATE);
    });

    // $scope.$on('keypress-grave-accent', function(message, value) {
    //     $scope.advanced = !$scope.advanced;
    //     console.log("Advanced mode is now: ", $scope.advanced);
    // });

    // Set InfoPoint mode
    $scope.$on('keypress-1', function(message, value) {clientstate.setInfoMode('s1');});
    $scope.$on('keypress-2', function(message, value) {clientstate.setInfoMode('su');});
    $scope.$on('keypress-3', function(message, value) {clientstate.setInfoMode('vol');});
    $scope.$on('keypress-4', function(message, value) {clientstate.setInfoMode('dep');});
    $scope.$on('keypress-5', function(message, value) {clientstate.setInfoMode('ucx');});
    $scope.$on('keypress-6', function(message, value) {clientstate.setInfoMode('ucy');});
    $scope.$on('keypress-7', function(message, value) {clientstate.setInfoMode('interception');});
    $scope.$on('keypress-8', function(message, value) {clientstate.setInfoMode('rain');});
    $scope.$on('keypress-9', function(message, value) {clientstate.setInfoMode('evap');});
}]);


/* Edit the current simulation. Must be in scope of ClientState */
app.controller("Simulator", ["$scope", "$rootScope", "socket", "state", "clientstate",
               function($scope, $rootScope, socket, state, clientstate){

    $scope.$on('keypress-rain', function(message, value) {
        if ($scope.isMaster) {
            $scope.setMode(MODE_RAIN);
        }
    });

    $scope.$on('keypress-discharge', function(message, value) {
        if ($scope.isMaster) {
            $scope.setMode(MODE_DISCHARGE);
        }
    });

    $scope.$on('keypress-w', function(message, value) {
        if ($scope.isMaster) {
            $scope.setMode(MODE_MANHOLE);
        }
    });

    $scope.$on('keypress-edit', function(message, value) {
        if ($scope.isMaster) {
            $scope.setMode(MODE_EDIT);
        }
    });

}]);


/* Time */
app.controller("Timeline", ["$scope", "state", function ($scope, state){
    $scope.slider = state.time;

}]);


/* BackgroundLayer with Leaflet */
app.controller("BackgroundLayer", ["$scope", "$rootScope", "leaflet", "state", "clientstate",
    function ($scope, $rootScope, leaflet, state, clientstate){
    $scope.layers = [
        {
            name: "Open Street Map", 
            layer: L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png"), 
            edit_mode: EDIT_MODE_DEFAULT
        },
        {
            name: "DEM",
            layer: null,  // see $scope.switch function
            edit_mode: EDIT_MODE_BATHY
        },
        {
            name: "3Di Grid",
            layer: null,  // see $scope.switch function
            edit_mode: EDIT_MODE_DEFAULT
        },
        {
            name: "Google Maps", 
            layer: L.tileLayer('http://mt{s}.google.com/vt/v=w2.106&x={x}&y={y}&z={z}&s=',{
                subdomains:'0123', attribution:'&copy; Google 2012' 
            }),
            edit_mode: EDIT_MODE_DEFAULT
        },
        {
            name: "Google Satellite", 
            layer: L.tileLayer('http://khms{s}.google.com/kh/v=134&x={x}&y={y}&z={z}&s=',{
                subdomains:'0123', attribution:'&copy; Google 2012' 
            }),
            edit_mode: EDIT_MODE_DEFAULT
        },
        {
            name: "Land use", 
            layer: L.tileLayer.wms(
                'http://geoserver1-3di.lizard.net/geoserver/gwc/service/wms',
                {
                    layers: "ThreeDi:Landgebruik_NL",
                    format: "image/png",
                    transparent: false
            }),
            edit_mode: EDIT_MODE_LAND_USE
        },
        {
            name: "Watercolor",
            layer: L.tileLayer("http://tile.stamen.com/watercolor/{z}/{x}/{y}.jpg"),
            edit_mode: EDIT_MODE_DEFAULT
        },
        {
            name: "Toner",
            layer: L.tileLayer("http://tile.stamen.com/toner/{z}/{x}/{y}.jpg"),
            edit_mode: EDIT_MODE_DEFAULT
        }];

    // Dirty way to define which one is initially active.
    $scope.active_layer = $scope.layers[3];

    $scope.switch = function(layer) {
        $scope.active_layer = layer;
        if (layer.name == 'DEM') {
            layer.layer = L.tileLayer.wms(leaflet.wms_server_url(), {
                layers: state.active_model + ':bathymetry',
                format: 'image/png',
                transparent: true,
                //limits: '-8.649999618530273,26.58262551890865',
                //limits: '-8.649999618530273,26.58262551890865',
                // vecht
                limits: '-2.8719162469945894,7.9269422467304818',
                attribution: "© 2013 Nelen & Schuurmans"
            });
        } else if (layer.name == '3Di Grid') {
            layer.layer = L.tileLayer.wms(leaflet.wms_server_url(), {
                layers: state.active_model + ':grid',
                format: 'image/png',
                transparent: true,
                //limits: '-8.649999618530273,26.58262551890865',
                limits: '-8.649999618530273,26.58262551890865',
                attribution: "© 2013 Nelen & Schuurmans"
            });
        }
        clientstate.edit_mode = layer.edit_mode;
        //console.log('Background layer: ' + layer.layer);
        //console.log('Edit mode: ' + clientstate.edit_mode);
        leaflet.updatebgLayers(layer.layer);
    };

}]);



/* Blinking status led */
app.controller("Status", ["$scope", "state", function ($scope, state){
    //$scope.state = state;
    //$scope.isPlaying = false;
    $scope.serverState = 'wait';
    $scope.label = 'Wait for instructions';
    // $scope.status = 'waiting';

    $scope.$on('serverState', function(message, value){
        console.log('server state ', value);
        $scope.serverState = value;
        if (value === 'standby'){
            $scope.label = 'Standby (no model loaded)';
        } else if (value === 'wait') {
            $scope.label = 'Wait for instructions';
        } else if (value === 'sim') {
            $scope.label = 'Simulation running';
        } else if (value === 'prepare-wms') {
            $scope.label = 'Preparing wms before loading model';
        } else if (value === 'load-model') {
            $scope.label = 'Loading model';
        } else if (value === 'loaded-model') {
            $scope.label = 'Inspecting model';
        } else if (value === 'stopping') {
            $scope.label = 'Stopping simulation';
        }
    });

}]);


/* The star on the lower left corner */
app.controller("Director", ["$scope", "state", "socket", function ($scope, state, socket){
    $scope.$on('isMaster', function(message, value){
        console.log('ismaster event');
        $scope.isMaster = value;
        $scope.have_master = state.have_master;
        if ($scope.have_master) {
            $scope.master_name = state.master_name;
        } else {
            $scope.master_name = '';  // there is no master, but the name is still there
        }
    });

    $scope.requestMaster = function(){
        if (debug){
            if ($scope.isMaster) {
                console.log('giving up master');
            } else {
                console.log('trying to set master...');
            }
        };
        socket.emit('set_master', !$scope.isMaster, function() {});
    }

}]);


/* Root controller: things that may not be bound to physical html objects */
app.controller("Root", ["$scope", "state", "socket", 
    function($scope, state, socket) {
    $scope.state = state;

    socket.on('state', function(sender_sessid, your_sessid, state) {
        if (debug){
            console.log('processing state from server: ', state);
        }

        $scope.state.setState(state, your_sessid);
    });

    socket.on('scenarios', function(scenarios) {
        if (debug){
            console.log('processing scenario list from server: ', scenarios);
        }

        $scope.state.setAvailableScenarios(scenarios);
    });

    socket.on('message', function(msg, msg_class) {
        if (debug){
            console.log('Got a user message from server: ', msg);
        }
        showalert(msg, msg_class);
    });
}]);


/* Play, stop, reset */
app.controller("RemoteControl",
    ["$scope", "$rootScope", "socket", "state", "leaflet",
    function($scope, $rootScope, socket, state, leaflet){

    $scope.wait_for_server_response = true;

    $scope.$on('isPlaying', function(message, value){
        //console.log('isplaying', value)
        $scope.isPlaying = value;
        $scope.wait_for_server_response = false;
    });

	$scope.play = function(){
        $scope.wait_for_server_response = true;
		if ($scope.isPlaying){
            $scope.stop();
        } else{
            $scope.isPlaying = true;
            socket.emit(
                'run_simulation',
                function() {
                    if (debug){
                        console.log('emit simulation run');
                    }
                });
        }
	};

	$scope.stop = function(){
        $scope.wait_for_server_response = true;
        $scope.isPlaying = false;
		socket.emit(
            'stop_simulation',
            function() {
                if (debug){
                    console.log('emit simulation stop');
                }
            });
	};

	$scope.reset = function(){
        $scope.wait_for_server_response = true;
        $scope.isPlaying = false;
		socket.emit(
            'reset_simulation',
            function() {
                if (debug){
                    console.log('emit simulation reset');
                }
            });
        $rootScope.$broadcast("reset");
	};

    $scope.has_future_events = false;

    $scope.$on('has-future-events', function(message, value) {
        $scope.has_future_events = value;
    });

    $scope.$on('keypress-start-stop', function(message, value) {
        if ($scope.isMaster) {
            if ($scope.isPlaying) {
                $scope.stop();
            } else {
                $scope.play();
            }
        }
    });

    $scope.$on('keypress-reset', function(message, value) {
        if ($scope.isMaster) {
            $scope.reset();
        }
    });

}]);


/* The load model button */
app.controller("ModelChooserButton", ["$scope", "state", "$rootScope",
    function($scope, state, $rootScope){

    // Button handling
    $scope.state = state;
    $scope.$on('isMaster', function(message, value){
        $scope.isMaster = value;
    });

    $scope.modal = function() {
        if ($scope.isMaster) {
            $rootScope.$broadcast('close_box', '');
            $("#modelChooserModal").modal();
        }
    }

    $scope.$on('keypress-choose-model', function(message, value) {
        if ($scope.isMaster) {
            $scope.modal();
        }
    });

    // $scope.$on('new-loaded-model', function(message) {
    //     state.loaded_model
    // });
}]);


/* Content of model popup */
app.controller("ModelChooser", ["$scope", "socket", "state", function($scope, socket, state){
    $scope.is_loading = false;
    $scope.load_text = 'hallo';

    $scope.choose = function(model_name, model_display_name){
        if (state.master) {
            if (debug){
                console.log('emit change_model ', model_name);
            }
            socket.emit('change_model', model_name, function() {});
            // Put the chooser screen in "in progress" state.
            var modelChooserModal = $("#modelChooserModal");
            modelChooserModal.find('.modal-footer').hide();  // hide the footer with the cancel button
            modelChooserModal.find('.modal-header').find('.close').hide();  // hide the close button (x) in the header
            // show a progress
            $scope.is_loading = true;
            $scope.load_text = 'Loading ' + model_display_name + ' ...';
        } else {
            if (debug) {
                console.log("cannot change model as slave");
            }
        }
    };

    $scope.$on('new-loaded-model', function(message) {
        // Close and reset model chooser
        var modelChooserModal = $("#modelChooserModal");
        modelChooserModal.find('.modal-footer').show();
        modelChooserModal.find('.modal-header').find('.close').show();

        modelChooserModal.modal('hide');
        $scope.load_text = '';
        $scope.is_loading = false;
    });
}]);


app.controller("AdvancedPanelSwitcher", 
    ["$scope", "$rootScope", function($scope, $rootScope) {

    $scope.is_opened = false;

    $scope.open_close = function() {
        $scope.is_opened = !$scope.is_opened;
        $rootScope.keypress_enabled = !$scope.is_opened;  // Disable when panel is opened.
        if ($scope.is_opened) {
            console.log("Show side bar");
            $('#off-canvas').addClass("show");
        } else {
            console.log("Hide side bar");
            $('#off-canvas').removeClass("show");
        }
    }
}]);

app.controller("DefaultSettings",
    ["$scope", "clientstate", "state", "$rootScope",
    function($scope, clientstate, state, $rootScope) {
        $scope.scenario_event_defaults = clientstate.scenario_event_defaults;
        // Values in input fields
        $scope.discharge_amount = $scope.scenario_event_defaults.discharge_amount;
        $scope.manhole_amount = -$scope.scenario_event_defaults.manhole_amount;
        $scope.rain_amount = $scope.scenario_event_defaults.rain_amount;
        $scope.bathy_mode = $scope.scenario_event_defaults.bathy_mode;
        $scope.bathy_value = $scope.scenario_event_defaults.bathy_value;
        $scope.land_use_value = $scope.scenario_event_defaults.land_use_color;
        $scope.wms_options_hmax = $scope.scenario_event_defaults.wms_options['hmax'];
        $scope.twodee_edit_size = $scope.scenario_event_defaults.twodee_edit_size;

        $scope.save_discharge = function() {
            if ($scope.defaultSettings.discharge.$valid) {
                clientstate.scenario_event_defaults.discharge_amount = parseFloat(
                    $scope.discharge_amount);
            }
        };

        $scope.save_manhole = function() {
            if ($scope.defaultSettings.manhole.$valid) {
                clientstate.scenario_event_defaults.manhole_amount = -parseFloat(
                    $scope.manhole_amount);
            }
        };

        $scope.save_rain = function() {
            if ($scope.defaultSettings.rain.$valid) {
                clientstate.scenario_event_defaults.rain_amount = parseFloat(
                    $scope.rain_amount);
            }
        };

        $scope.save_bathy_mode = function() {
            if ($scope.defaultSettings.bathy_mode.$valid) {
                clientstate.scenario_event_defaults.bathy_mode = parseInt(
                    $scope.bathy_mode);
            }
        };

        $scope.save_bathy_value = function() {
            if ($scope.defaultSettings.bathy_value.$valid) {
                clientstate.scenario_event_defaults.bathy_value = parseFloat(
                    $scope.bathy_value);
            }
        };

        $scope.save_land_use_value = function() {
            console.log("Save land use value");
            if ($scope.defaultSettings.land_use_value.$valid) {
                clientstate.scenario_event_defaults.edit_land_use_color = parseInt(
                    $scope.land_use_value);
            }
        };

        $scope.save_twodee_edit_size = function() {
            console.log("Save 2D edit size");
            if ($scope.defaultSettings.twodee_edit_size.$valid) {
                clientstate.scenario_event_defaults.twodee_edit_size = parseFloat(
                    $scope.twodee_edit_size);
            }
        };

        // Kinda dirty: requires $rootScope and state
        $scope.save_wms_options_hmax = function() {
            if (!$scope.defaultSettings.wms_options_hmax.$valid) {
                return;
            };
            clientstate.scenario_event_defaults.wms_options['hmax'] = parseFloat(
                $scope.wms_options_hmax);
            // Without this the same timestep results in no action.
            $rootScope.$broadcast('animation-timestep', {
                model_slug: state.loaded_model,
                timestep: 0
            });
            $rootScope.$broadcast('animation-timestep', {
                model_slug: state.loaded_model,
                timestep: state.time.at
            });
        }
}]);


app.controller("LoadSave", ["$scope", "socket", "state", 
    function($scope, socket, state){
        $scope.scenario_name = "my_scenario";
        $scope.available_scenarios = [];
        $scope.save_success = false;

        $scope.save_scenario = function() {
            if ($scope.isMaster) { // adding class "disabled" only makes it grey
                console.log("Save scenario");
                socket.emit("save_scenario", $scope.scenario_name, function() {});
            }
            $scope.save_success = true;
            // Let the message disappear again.
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.save_success = false;
                });
            }, 2000);
        };

        $scope.$on("available-scenarios", function(message, scenarios) {
            $scope.available_scenarios = scenarios;
        });
}]);

app.controller("LoadScenario", ["$scope", "socket", 
    function($scope, socket) {
        $scope.load_scenario = function() {
            console.log("Load scenario ")
            console.log($scope.scenario);
            socket.emit("load_scenario", $scope.scenario.id, function() {});
        };
}]);

app.controller("ScenarioInfo", ["$scope", "$rootScope",
    function($scope, $rootScope) {

        $rootScope.$on('scenario_events', function(message, scenario_events) {
            $scope.stats_road_m2 = 0;
            $scope.stats_housing_m2 = 0;
            $scope.stats_unpaved_m2 = 0;
            $scope.stats_water_m2 = 0;

            $scope.stats_earth_m2 = 0;
            $scope.stats_earth_m3 = 0;
            scenario_events.forEach(function(scenario_event){
                // ['#888888', '#52ff00', '#f73959', '#1285cd'],
                // quick and dirty stats. They do not represent correct values.
                if (scenario_event.type === 'twodee-edit') {
                    if (scenario_event.edit_mode === 'edit-land-use') {
                        if (scenario_event.color_value == '#888888') {
                            $scope.stats_road_m2 += scenario_event.size * scenario_event.size;
                        }
                        if (scenario_event.color_value == '#52ff00') {
                            $scope.stats_unpaved_m2 += scenario_event.size * scenario_event.size;
                        }
                        if (scenario_event.color_value == '#f73959') {
                            $scope.stats_housing_m2 += scenario_event.size * scenario_event.size;
                        }
                        if (scenario_event.color_value == '#1285cd') {
                            $scope.stats_water_m2 += scenario_event.size * scenario_event.size;
                        }
                    } else if (scenario_event.edit_mode === 'edit-bathy') {
                        // bathy-edit
                        $scope.stats_earth_m2 += scenario_event.size * scenario_event.size;

                        $scope.stats_earth_m3 += scenario_event.size * scenario_event.size * scenario_event.value;
                    }
                }
            });

            // Round everything
            $scope.stats_earth_m2 = Math.round($scope.stats_earth_m2 / 100) * 100;
            $scope.stats_earth_m3 = Math.round($scope.stats_earth_m3 / 100) * 100;
            $scope.stats_road_m2 = Math.round($scope.stats_road_m2 / 100) * 100;
            $scope.stats_unpaved_m2 = Math.round($scope.stats_unpaved_m2 / 100) * 100;
            $scope.stats_housing_m2 = Math.round($scope.stats_housing_m2 / 100) * 100;
            $scope.stats_water_m2 = Math.round($scope.stats_water_m2 / 100) * 100;
        })
}]);


/* Services */
app.service('socket', function ($rootScope) {
    var socket = io.connect("http://localhost:9000/subgrid", {'transports': ['xhr-polling', 'websocket']});
    //var socket = io.connect("/subgrid");
    /* xhr-polling by default for now because the server doesn't support websockets. */
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function () {
    	if (arguments.length > 2){
	    	var callback = arguments[arguments.length - 1]
    	}
        // TODO: check if last argument is function
        // otherwise consider it a 'normal' argument
    	// slightly more complex than the usual example
    	// because it should took any length of arguments

        // to prevent error '$apply already in progress'
        // from: https://coderwall.com/p/ngisma
        // TODO: if this error occurs elsewhere, monkeypatch $rootScope where
        // it comes from
        $rootScope.safeApply = function(fn) {
            var phase = this.$root.$$phase;
            if(phase == '$apply' || phase == '$digest') {
                if(fn && (typeof(fn) === 'function')) {
                    fn();
                }
            } else {
                this.$apply(fn);
            }
        };

    	var ngcallback = function () {
	        var args = arguments;
            if (debug) {
                // Is always 0 ??
                console.log("ng callback: " + args.length);
            }
	        $rootScope.safeApply(function () {
	          if (callback) {
                try {
	              callback.apply(socket, args);
                } catch (error) {
                    console.log('error applying to callback', error);
                }
	          }
	        });
	      };

        var args = arguments;
        Array.prototype.splice.call(arguments, arguments.length -1 ,1);
        Array.prototype.push.call(args, ngcallback);
        // because the ngcallback is already in the args the socket.emit.apply
        // below will execute the callback
        socket.emit.apply(socket, args);
    }
  };
});

/* Client state: current program mode (rain, info, infoline) */
app.service('clientstate', function ($rootScope) {
    return {
        program_mode: MODE_NAVIGATE,
        edit_mode: EDIT_MODE_DEFAULT,
        first_click: null,  // testing for infoline
        random: 0,  // for manually triggering some watches
        scenario_event_defaults: {
            discharge_amount: 50,  // m3/s
            manhole_amount: -1,  // m3/s, is technically the same as discharge
            rain_amount: 10,  // mm/h
            bathy_value: 15,  // meters
            bathy_mode: 1,  // 1=absolute, 0=relative
            edit_land_use_color: 2,  // This part is hacky/for demo purposes.
            edit_land_use_colors: ['#888888', '#52ff00', '#f73959', '#1285cd'],
            edit_land_use_names: ['road', 'unpaved', 'housing', 'water'],
            info_mode: 's1',  // s1=depth
            wms_options: {hmax: 2.0},  // options that will be added to the animation wms url
            twodee_edit_size: 0.8  // 1 is about 1x1 cm
        },
        setMode: function(mode) {
            //console.log('Set program mode: ' + mode);
            this.program_mode = mode;
            this.first_click = null;
            // setting mouse cursor for modes
            if (mode === MODE_NAVIGATE) {
                $(".leaflet-tile").removeClass("map-crosshair");
            } else if ((mode === MODE_RAIN) || (mode === MODE_MANHOLE)
                || (mode === MODE_INFO_POINT) || (mode === MODE_INFO_LINE)) {
                $(".leaflet-tile").addClass("map-crosshair");
            }
        },
        setInfoMode: function(mode) {
            // What to see in the InfoPoint box?
            this.scenario_event_defaults.info_mode = mode;
            showalert('Info mode is now ' + mode);
        }
    }
});

app.service('state', function ($rootScope) {
  return {
    active_model: null,
    player: "STOP",
    master: false,
    time: {
        at: '0',
        //max_timestep: '0',
        human_at: '00:00'
    },
    //rain_cloud_markers: {},
    //manhole_markers: {},
    use_server_extent_as_master: false,
    loaded_model: '',
    last_server_state: null,
    extent: [
        parseFloat(575168.82356533), parseFloat(6932035.5908734),
        parseFloat(600016.71630765), parseFloat(6934844.6516624)
    ],
    //available_scenarios: [5,4,3,2],
    setMaster: function(state, sessid){
        this.master_name = state.player_master_name;
        this.have_master = (state.player_master_sessid !== undefined);
        // Check if you're the master
        if (state.player_master_sessid == sessid) {
            if (!this.master) {
                // If you're becoming master right now
                // TODO L
                //emitExtent();
                if (debug){
                    console.log('You just became master');
                }
            }
            // you're master, tell everyone who needs to know
            $rootScope.$broadcast('isMaster', true);
            this.master = true;
        } else {
            if (this.master) {
                if (debug){
                    console.log('You just became slave');
                }
                // if (state.player_master_name === undefined) {
                //     showalert('You are not Director anymore.');
                // } else {
                //     showalert(state.player_master_name + 'took your Director status.');
                // }
            }
            $rootScope.$broadcast('isMaster', false);
            this.master = false;
        }
    },
    setExtent: function(state) {
        this.extent = $.parseJSON(state.player_extent); // event comes in as string
        $rootScope.$broadcast('set-extent', this.extent);
    },
    setExtentIfSlave: function(state){
        // If you're not the master, go to extent
        if ((!this.master) && (state.player_extent))
        {
            this.setExtent(state);
        }
    },
    timeFormat: function(seconds) {
        // format time in HH:MM from seconds
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds - (hours * 3600)) / 60);

        if (hours < 10) {hours = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        var time = hours + ':' + minutes;
        return time;
    },
    setTimeline: function(state) {
        if (state.time_seconds){
            this.time.human_at = this.timeFormat(state.time_seconds);
            this.time.at = state.timestep;
            //this.time.max_timestep = state.max_timestep;
        } else {
            this.time.at = 0;
            this.time.max_timestep = 0;
            //this.time.human_at = '0 00:00';
        }
    },
    setPlayerstate: function(state){
        if ((state.player_mode === 'sim') || (state.player_mode === 'play')) {
            if (state.loaded_model === undefined) {
                console.log('Debug:::: no loaded model');
                this.active_model = null;  // reset
            }

            if ((state.loaded_model !== undefined) && (state.loaded_model !== 'None') && (this.active_model !== state.loaded_model)) {
                if (debug){
                    console.log('new model detected, deleting old one');
                }
                $rootScope.$broadcast('animation-shutdown', '');
                this.use_server_extent_as_master = true;
                this.loaded_model = state.loaded_model;
                // Close AwesomeBox if open.
                $rootScope.$broadcast('close_box', '');
                showalert('Using model ' + this.loaded_model + '.');
            }

            if (this.active_model !== state.loaded_model) {
                this.active_model = state.loaded_model;
            }

            /*if (this.active_model !== undefined) {
                $rootScope.$broadcast('animation-init', this.active_model); 
            }*/

            $rootScope.$broadcast('animation-timestep', {
                model_slug: state.loaded_model,
                timestep: parseInt(state.timestep)
            });
        } else if ((state.player_mode === 'wait') || (state.player_mode === 'stopping')){
            // this.player = "STOP"
        }
        if (state.running_sim === "0"){
            $rootScope.$broadcast('isPlaying', false);
        } else {
            $rootScope.$broadcast('isPlaying', true);
        }
        if (this.last_server_state !== state.state) {
            // prevent broadcasting too much
            $rootScope.$broadcast('serverState', state.state);
            this.last_server_state = state.state;
        }
    },
    setScenarioEvents: function(state) {
        if (typeof state.scenario_events != 'undefined') {
            $rootScope.$broadcast('scenario_events', state.scenario_events);
        }
        // determine if there are future events
        if (state.has_future_events === '1') {
            console.log('Has future events!');
            $rootScope.$broadcast('has-future-events', true);
        } else {
            $rootScope.$broadcast('has-future-events', false);
        }
    },
    setAfterModelChange: function(state){
        // Set extent (also for master), after a model change and the state is
        // back to 'wait'
        if (this.use_server_extent_as_master && state.state === 'wait')
        {
            this.setExtent(state);
            //console.log('use server extent as master: ', this.use_server_extent_as_master);
            this.use_server_extent_as_master = false;  // Only after a model change

            $rootScope.$broadcast('new-loaded-model');

            // Button title
        }
    },
    showAlertIfAny: function(state){
        if (typeof state.message != 'undefined') {
            showalert(state.message, 'alert-' + state.message_type);
        }
    },
    setState: function(state, sessid){
        console.log("DEBUG_state: " + state.state);
        // this function is performs all the
        // different steps involved with the state
        this.setMaster(state, sessid);
        this.setExtentIfSlave(state);
        this.setTimeline(state);
        this.setPlayerstate(state);
        //this.setRainClouds(state);
        //this.setManholes(state);
        //this.setBathyEdits(state);
        this.setScenarioEvents(state);
        this.setAfterModelChange(state);
        this.showAlertIfAny(state);
        if (state.timestep === '0') {
            $rootScope.$broadcast('close_box', '');
            console.log('detected a reset/load model -> cleanup wms ani layer');
            $rootScope.$broadcast('animation-shutdown', '');
        }
    },
    setAvailableScenarios: function(scenarios) {
        // process a new list of available scenarios
        //this.available_scenarios = scenarios;
        $rootScope.$broadcast('available-scenarios', scenarios);
    }
  }
});


/* Keyboard controller 

Usage: 

-1) Add javascript ui-utils.

0) Add ui.directives.

var app = angular.module("3di-ipad", ['Components', 'ui.directives']);

1) Place key and function mapping in <body>:

<body ng-controller="NxtKeypress" ui-keypress="{32: 'trigger(\'start-
stop\')', 113: 'trigger(\'reset\')', 109: 'trigger(\'choose-model\')', 105:
'trigger(\'info-point\')', 108: 'trigger(\'info-line\')', 114:
'trigger(\'rain\')', 100: 'trigger(\'discharge\')', 110:
'trigger(\'navigate\')', 115: 'trigger(\'info-point\')', 97: 'trigger(\'info-
line\')', enter: 'trigger(\'enter\')', 102: 'trigger(\'navigate\')', 48:
'trigger(\'0\')', 49: 'trigger(\'1\')', 50: 'trigger(\'2\')', 51:
'trigger(\'3\')', 52: 'trigger(\'4\')', 53: 'trigger(\'5\')', 54:
'trigger(\'6\')', 55: 'trigger(\'7\')', 56: 'trigger(\'8\')', 57:
'trigger(\'9\')'}" ui-keyup="{'esc': 'trigger(\'esc\')', 37:
'trigger(\'left\')', 38: 'trigger(\'up\')', 39: 'trigger(\'right\')', 40:
'trigger(\'down\')'}">

2) "keypress-<action>" will be broadcast. Place a $scope.$on on this the
   broadcast where needed. Remember to include $rootScope in your controller.

$scope.$on('keypress-1', function(message, value) {$scope.small();});
$scope.$on('keypress-2', function(message, value) {$scope.big();});

*/
app.controller("NxtKeypress",
    ["$rootScope", "$scope",
    function($rootScope, $scope){
        $rootScope.keypress_enabled = true;  // kinda dirty
        $scope.trigger = function (action) {
            if ($rootScope.keypress_enabled) {
                console.log('keyboard trigger: ', "keypress-" + action);
                $rootScope.$broadcast("keypress-" + action);
            } else {
                console.log('(disabled) keyboard trigger: ', "keypress-" + action);
            }
        };
}]);