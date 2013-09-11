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

    $scope.$on('kpiclick', function(data) {
        $scope.box.open("kpi");
    });


    $scope.$on('mapclick', function(){
        // why this needs to go into an apply.. beats me
            $scope.$apply(function(){
                $scope.box.open("graph");
            });
        });

}]);



app.controller("ResultsCtrl",
    ["$scope", "Omnibox",
        function($scope, Omnibox){

    $scope.box = Omnibox;
    $scope.currentObject = false;

    $scope.showDetails = function(obj) {
        $scope.currentObject = obj;
        if($scope.currentObject.lat && $scope.currentObject.lon) {
            // A lat and lon are present, instruct the map to pan/zoom to it
            console.log('Location given, take us there');
            
        }
    };

}]);

app.controller("GraphCtrl", ["$scope",
    function($scope){
      var data = [{
                  type: 'x',
                  name: 'Debiet',
                  values: [0.13, 0.3, 0.5],
                  unit: "m/s"
                },
                {
                  type: 'y',
                  name: 'Time',
                  values: [1357714800000, 1357914800000, 1358014800000],
                  unit: "hr:min"
                }];

      $scope.format_data = function() {
        $scope.formatted_data = [];
        for (var i=0; i<data[0].values.length; i++){
          xyobject = {
            date: data[1].values[i],
            value: data[0].values[i]
          };
          $scope.formatted_data.push(xyobject);
        }
        return $scope.formatted_data;
      };

}]);

