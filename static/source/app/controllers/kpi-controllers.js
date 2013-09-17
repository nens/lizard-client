app.controller("ImpeachCandidate",
    ["$scope", "Omnibox",
        function($scope, Omnibox) {

	$scope.show = function() {
		Omnibox.open('kpi');
	};

}]);

app.controller("KpiCtrl",
  ["$scope", "$http", "KpiService", function ($scope, $http, KpiService)  {
  $scope.kpi = KpiService;
  $scope.d3kpi = {'dates': {name: 'Date', values: [], units: 'Year'},
                  'kpis': {name: '', values: [], units: ''}};
	 
  $scope.kpiLoader = function () {
    
    if ($scope.kpi.mapzoom > 12) {
      areadata = '/static/data/wijken.geojson';
    } else {
      areadata = '/static/data/wijken.geojson';
    }
    //NOTE: write a failure function
    $http.get(areadata)
        .success(function (data) {
          $scope.kpi.kpiData = data;
          // later als get categories from kpi source
          //$scope.categories = [];
          //NOTE: buttugly crap
          $scope.kpi.dates = $scope.kpi.kpiData.features[0].properties.planrealisatie.dates;
          $scope.kpi.areas = [];
          // get unique areas
          for (var j in $scope.kpi.kpiData.features) {
            var feature = $scope.kpi.kpiData.features[j];
            if ($scope.kpi.areas.join(" ").indexOf(feature.properties.name) === -1) {
              $scope.kpi.areas.push(feature.properties.name);
            }
          }
          $scope.kpi.slct_cat = $scope.kpi.categories[0];
          $scope.kpi.slct_area = $scope.kpi.areas[0];
          $scope.kpi.slct_date = $scope.kpi.dates[1];
        });
  };

  $scope.$watch('kpi.slct_area', function(){
  	if ($scope.kpi.slct_area !== undefined){
			$scope.activate($scope.kpi.slct_date, $scope.kpi.slct_area, $scope.kpi.slct_cat);
  	}
  })

	$scope.activate = function (date, area, category) {
      $scope.kpi.slct_cat = category;
      $scope.kpi.slct_area = area;
      $scope.kpi.slct_date = date;
      // doesn't have to be updated when date changes
      $scope.d3formatted(area, category);
      // flip the changed var
      $scope.kpi.kpichanged = !$scope.kpi.kpichanged;
    };

  // prepare data for graph and badge values
  $scope.d3formatted = function (area, category) {
    $scope.d3kpi.kpis.name = category;
    $scope.badgevalues = {};
    $scope.d3kpi.kpis.values = [];
    $scope.d3kpi.dates.values = $scope.kpi.dates;
    for (var i in $scope.kpi.kpiData.features) {
      var feature = $scope.kpi.kpiData.features[i];
      // skip this if, just put it in the cat
      if (feature.properties.name === area) {
        $scope.d3kpi.kpis.values = feature.properties[category].values;
        $scope.formatted_data = $scope.format_data($scope.d3kpi);
        // ugly crap, make nicer data model for this
        $scope.d3kpi.kpis[category] = feature.properties[category].values;
      }
    }
    return $scope.d3kpi;
  };


    $scope.format_data = function(d3kpi) {
      var formatted_data = [];
      for (var i=0; i< d3kpi.dates.values.length; i++){
        xyobject = {
          date: d3kpi.dates.values[i],
          value: d3kpi.kpis.values[i]
        };
        formatted_data.push(xyobject);
      }
      return formatted_data;
    };

  $scope.kpiLoader();
}]);

