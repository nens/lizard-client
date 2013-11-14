/* threedi-boxes.js */

app.controller("RainCloud", 
    ["$scope", "socket", "$rootScope", 
    function($scope, socket, $rootScope){

    $scope.$on('raincloud', function(message, content){
        $scope.properties = content.properties
    });

    $scope.set_amount = function(amount) {
        $scope.properties.amount = amount;
    }

    $scope.set_diameter = function(diameter) {
        $scope.properties.diameter = diameter;
    }

    $scope.save = function(){
        socket.emit('change_rain',
            $scope.properties.x,
            $scope.properties.y,
            $scope.properties.diameter,
            $scope.properties.amount,
            $scope.properties.hash,
            function(){
                if (debug){
                    console.log('emit change cloud');
                }
        });
        $scope.close_box();
    };

    $scope.stop = function(){
        socket.emit('stop_disturbance', $scope.box.content.type,
            $scope.box.content.properties.hash,
            function(){
                if (debug){
                    console.log('stopped disturbance' );
                }
            });
        $scope.close_box();
    };

    $scope.$on('keypress-1', function(message, value) {$scope.small();});
    $scope.$on('keypress-2', function(message, value) {$scope.big();});
    $scope.$on('keypress-3', function(message, value) {$scope.little();});
    $scope.$on('keypress-4', function(message, value) {$scope.much();});
    $scope.$on('keypress-enter', function(message, value) {$scope.save();});
}]);


/* Manholes AND discharges */
app.controller("Manhole", ["$scope", "socket", function($scope, socket){
    $scope.$on('manhole', function(message, content){
        $scope.properties = content.properties;
    });

    $scope.set_amount = function(amount){
        $scope.properties.amount = amount;
    }

    $scope.save = function(){
        socket.emit('change_discharge',
            $scope.properties.amount,
            $scope.properties.hash,
            function(){
                if (debug){
                    console.log('emit change manhole');
                }
        });
        $scope.close_box();
    };

    $scope.stop = function(){
        socket.emit('stop_disturbance', $scope.box.content.type,
            $scope.box.content.properties.hash,
            function(){
                if (debug){
                    console.log('stopped disturbance' );
                }
            });
        $scope.close_box();
    };

    $scope.$on('keypress-1', function(message, value) {$scope.little();});
    $scope.$on('keypress-2', function(message, value) {$scope.much();});
    $scope.$on('keypress-enter', function(message, value) {$scope.save();});
}]);


app.controller("GenericInfo", ["$scope", "socket", function($scope, socket){
    $scope.$on('generic-info', function(message, content) {
        console.log('generic info popup!');
        $scope.content = content;
        $scope.testcontent = 'Hello, World!';
    });
}]);


app.controller("InfoPoint", ["$scope", "state", "$rootScope", "leaflet",
    function($scope, state, $rootScope, leaflet) {

    $scope.content = null;
    $scope.state = state;
    $scope.counter = 0;
    $scope.title = null;

    var infoPoint = function(content) {
        // content must have properties .loaded_model and .point.
        var lonlat = content.point;
        if (content.mode == 's1') {
            $scope.title = 'Depth';
        } else {
            $scope.title = 'Info ' + content.mode;
        }
        var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
        $scope.infourl = $layer.dataset['workspaceWmsUrl'].split('/wms')[0] + 
            '/data?' + "REQUEST=gettimeseries&LAYERS=" + content.loaded_model + ':' + content.mode + 
            "&SRS=EPSG:4326&POINT=" + lonlat.lng.toString() + ',' + lonlat.lat.toString() + 
            '&random=' + $scope.counter;
    }

    // Popup
    $scope.$on("infopoint", function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            console.log("open box infopoint");
            infoPoint(content);
            // var lonlat = content.point;
            // var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
            // $scope.infourl = $layer.dataset['workspaceWmsUrl'].split('/wms')[0] + '/data?' + "REQUEST=gettimeseries&LAYERS=" + content.loaded_model + "&SRS=EPSG:4326&POINT="+lonlat.lng.toString() + ',' + lonlat.lat.toString();
        });
    });

    $scope.$on('infopoint-close', function(message, value) {
        leaflet.removeInfoMarker();
    });

    $scope.$watch('state', function(newvalue, oldvalue) {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}
        //$scope.counter += 1;
        $scope.counter = newvalue.time.at;

        console.log("open box infopoint yeah", newvalue.time.at);
        infoPoint($scope.content);
    }, true);
}]);


app.controller("InfoLine", ["$scope", "state", "leaflet", function($scope, state, leaflet) {
    $scope.content = null;
    $scope.state = state;

    var infoLine = function(content) {
        var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
        var url = $layer.dataset['workspaceWmsUrl'].split('/wms')[0] + '/data';
        var linestring = 'LINESTRING+(' + content.firstpoint.lng.toString() + '+' + content.firstpoint.lat.toString() + '%2C' +
                    content.endpoint.lng.toString() + '+' + content.endpoint.lat.toString() + ')';
        var requestData = 'request=getprofile&srs=epsg:4326&layers=' + content.loaded_model + '&line=' + linestring + '&time=' + state.time.at;
        $scope.infourl = url +'?' + requestData;
    }

    $scope.$on("infoline", function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            infoLine(content);
        });
    });

    $scope.$on('infoline-close', function(message, value) {
        leaflet.removeLineMarker();
    });

    $scope.$watch('state', function(newvalue, oldvalue) {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}

        //console.log("open box infoline yeah");
        infoLine($scope.content);
    }, true);
}]);

