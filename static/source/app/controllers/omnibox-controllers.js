app.controller("SearchCtrl",
  ["$scope", "$resource", "CabinetService", "Omnibox",
        function ($scope, $resource, CabinetService, Omnibox) {

    $scope.box = Omnibox;

    $scope.filter = function ($event) {
      if ($scope.box.query.length > 1) {
        var search = CabinetService.search.get({q: $scope.box.query}, function (data) {
            console.log(data.hits.hits);
            var sources = [];
            for (var i in data.hits.hits) {
              sources.push(data.hits.hits[i]._source);
            }
            $scope.searchData = sources;
          });

        var geocode = CabinetService.geocode.query({q: $scope.box.query}, function (data) {
                console.log(data);
                $scope.box.content = data;
              });
        $scope.box.open("location");
      }
    };

    $scope.reset_query = function () {
        // clean stuff.. 
        // Search Ctrl is the parent of omnibox cards
        // therefore no need to call $rootScope. 
        $scope.$broadcast('clean');
        $scope.box.query = null;
        $scope.box.type= 'empty';
    };
}]);

app.controller("CardsCtrl",
    ["$scope", "$resource", "CabinetService", "Omnibox",
        function ($scope, $resource, CabinetService, Omnibox) {
    $scope.box = Omnibox;

    // NOTE: behaviour should go in the directive, not in a controller
    // don't manipulate the DOM with a controller
    $scope.$on('kpiclick', function (data) {
        $scope.box.open("kpi");
    });

    $scope.$on('mapclick', function () {
        // why this needs to go into an apply.. beats me
            $scope.$apply(function () {
                $scope.box.open("graph");
            });
        });

}]);

app.controller("ResultsCtrl",
    ["$scope", "$rootScope", "Omnibox",
        function ($scope, $rootScope, Omnibox) {

    $scope.box = Omnibox;
    $scope.currentObject = false;

    $scope.showDetails = function (obj) {
        $scope.currentObject = obj;
        if ($scope.currentObject.lat && $scope.currentObject.lon) {
            // A lat and lon are present, instruct the map to pan/zoom to it
            console.log('Location given, take us there');
            var latlng = {'lat': $scope.currentObject.lat, 'lon': $scope.currentObject.lon};
            $scope.panZoom = {
              lat: $scope.currentObject.lat,
              lng: $scope.currentObject.lon,
              zoom: 14
            };
            // NOTE: get rid of rootScope
            $rootScope.$broadcast('PanZoomeroom', $scope.panZoom);
        }
    };

}]);


app.controller("GraphCtrl", ["$scope", "Omnibox",
    function ($scope, Omnibox) {
      var unformat_data = function () {
        var array_data =  [{
          type: 'x',
          name: 'Debiet',
          values: [0.13 * Math.random() * 100, 0.3 * Math.random() * 100, 0.5 * Math.random() * 100],
          unit: "m/s"
        },
        {
          type: 'y',
          name: 'Time',
          values: [1357714800000, 1357914800000, 1358014800000],
          unit: "hr:min"
        }];
        return array_data;
      };

      $scope.format_data = function (data) {
        $scope.formatted_data = [];
        for (var i = 0; i < data[0].values.length; i++) {
          var xyobject = {
            date: data[1].values[i],
            value: data[0].values[i]
          };
          $scope.formatted_data.push(xyobject);
        }
        return $scope.formatted_data;
      };

      $scope.data = $scope.format_data(unformat_data());

      $scope.$on('Omnibox_change', function () {
        var new_data = unformat_data();
        $scope.data = $scope.format_data(new_data);
      });
}]);


app.controller("ObjectIdGraphCtrl", ["$scope", "Omnibox", "CabinetService",
    function($scope, Omnibox, CabinetService){
      $scope.box = Omnibox;
      $scope.metadata = {
        title: null,
        leidinglengte: $scope.box.content.data.lei_len,
        profiel_hoogte: $scope.box.content.data.pro_hgt,
        profiel_breedte: $scope.box.content.data.pro_bre,
        type: $scope.box.content.data.entity_type
      };

      $scope.$watch('box.content', function () {
        var new_data_get = CabinetService.timeseriesLocationObject.get({
          object_type: $scope.box.content.object_type,
          id: $scope.box.content.id,
        }, function(response){
          $scope.timeseries = response.results;
          if ($scope.timeseries.length > 0){
            $scope.selected_timeseries = response.results[0];      
          } else {
            $scope.selected_timeseries = undefined;
          }
        });
      });

      $scope.$watch('selected_timeseries', function () {
        if ($scope.selected_timeseries !== undefined){
          $scope.data = $scope.format_data($scope.selected_timeseries.events);
          // dit kan zeker nog mooier
          $scope.metadata.title = $scope.selected_timeseries.location.name;
          $scope.metadata.ylabel = $scope.selected_timeseries.parameter.description + ' (' + 
          $scope.selected_timeseries.unit.code +')' ;
          $scope.metadata.xlabel = "Tijd";
        } else {
          $scope.data = null;
        }
      });

      $scope.format_data = function (data) {
        if (data[0]){
        $scope.formatted_data = [];
          for (var i=0; i<data[0].values.length; i++){
            xyobject = {
              date: data[1].values[i],
              value: data[0].values[i]
            };
            $scope.formatted_data.push(xyobject);
          }
        } else {
          $scope.formatted_data = undefined;
        }
        return $scope.formatted_data;
      };

    }]);
