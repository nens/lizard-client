app.controller("OmniboxCtrl",
    ["$scope", "$resource",
        function($scope, $resource){

    $scope.box = {
        Search: $resource('/api/v1/search/'),
        Geocode: $resource('/api/v1/geocode/'),
        query: ' ',
        disabled: false,
        showCards: true,
        content: 'empty'
	};

    $scope.filter = function ($event) {
      $scope.box.showCards = true;
      if ($scope.box.query.length > 1)
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
    };

    $scope.close_box = function(){
        // $scope.box.showCards = false;
        console.log('close_box');
        $scope.box.showCards = false;
    };

    $scope.open_box = function() {
        $scope.box.showCards = true;
    };

    $scope.$on('open_box', function(message, content) {
        console.log('entering');
        $scope.open_box();
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