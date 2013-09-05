app.controller("SearchCtrl",
    ["$scope", "$resource", "$rootScope", "Cabinet", "Omnibox",
        function($scope, $resource, $rootScope, Cabinet, Omnibox) {

    $scope.box = Omnibox;

    $scope.filter = function ($event) {
        if ($scope.box.query.length > 1) {

            var search = Cabinet.search.get({q:$scope.box.query}, function(data) {
                console.log(data.hits.hits);
                var sources = [];
                for(var i in data.hits.hits) {
                    sources.push(data.hits.hits[i]._source);
                }
                $scope.searchData = sources;
            });

            var geocode = Cabinet.geocode.query({q:$scope.box.query}, function(data) {
                console.log(data);
                $scope.box.content = data;
            });
            $scope.box.open("location");
            
        }

    };

    $scope.reset_query = function() {
        $scope.box.query = null;
        $scope.box.close();
    };



}]);




app.controller("CardsCtrl",
    ["$scope", "$resource", "$rootScope", "Cabinet", "Omnibox",
        function($scope, $resource, $rootScope, Cabinet, Omnibox) {


    $scope.box = Omnibox;




}]);



app.controller("ResultsCtrl", ["$scope","Omnibox",
    function($scope, Omnibox){
        $scope.box = Omnibox;

    }])