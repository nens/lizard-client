app.controller("KpiCtrl",
    ["$scope", "$resource", "$rootScope", "$http", "CabinetService", "Omnibox",
        function($scope, $resource, $rootScope, $http, CabinetService, Omnibox) {

	console.log('kpi controllers');

	$scope.kpiData = {};
	var kpiLoader = $http.get('/static/data/wijken.geojson');
	var promise = kpiLoader.success(function(data) {
		console.log('response:', data);
		$scope.kpiData = data;
	});


	
	$scope.show = function() {
		console.log('Showing KPI layer...', $scope.kpiData);
		$rootScope.$broadcast('kpiclick', $scope.kpiData);
	};

}]);