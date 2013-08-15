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
    });

    $scope.$on('featureclick', function(message, content) {
        console.log('feature was clicked!', content);
        $scope.featureData = content;
        $scope.$apply();
    });


    $scope.$on('mapclick', function(message, content) {
        console.log('map was clicked!!!', content.lat);

        var reversegeocode = $scope.box.ReverseGeocode.get({
            lat:content.lat,
            lon:content.lng
        }, function(data) {
            console.log(data);
            // show card for data!
        });

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