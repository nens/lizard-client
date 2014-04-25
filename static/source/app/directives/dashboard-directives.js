'use strict';

app.controller('DashboardDirCtrl', function ($scope, $timeout, $http, $sce) {

	/*
	 * TODO: This should build the dashboard according to a JSON object
	 * which could come from a DashboardService or something, which in turn
	 * persists/keeps its configuration for this user/organisation using the API
	 * 
	 */

	$scope.tabs = [{
			title: "Streetview", 
			content: $sce.trustAsHtml("<h4>Streetview</h4>") // NOTE: Example of HTML escaping
		},
		{
			title:"Extra",
			content: $sce.trustAsHtml("Dynamic content 2"), 
			disabled: true
		}];

	$scope.alertMe = function() {
		// NOTE: Example of how a controller function can be called from the directive
		console.log('alertMe()');
	};
});

app.directive('dashboard', ['$location', '$timeout', '$compile', function ($location, $timeout, $compile) {

  var container =  '<div class="container"><div class="row">' + 
					  '<tabset justified="true" style="padding-top:5px;">' +

					    '<tab select="alertMe()">'+
					     '<tab-heading>'+
					      '<i class="fa fa-bell"></i>'+
					     '</tab-heading>'+
					      '<h4>Alarmen</h4>'+
					    '</tab>'+

					    '<tab select="alertMe()">'+
					     '<tab-heading>'+
					      '<i class="fa fa-bookmark"></i>'+
					     '</tab-heading>'+
					      '<h4>Gemarkeerde objecten</h4>'+
					    '</tab>'+

					    '<tab select="alertMe()">'+
					     '<tab-heading>'+
					      '<i class="fa fa-gear"></i>'+
					     '</tab-heading>'+
					      '<h4>Dashboard instellingen</h4>'+
					    '</tab>' +

						'<tab ng-repeat="tab in tabs" heading="<%tab.title%>" active="tab.active" disabled="tab.disabled">'+
							'<div ng-bind-html="tab.content"></div>'+
						'</tab>'+

					  '</tabset>' +
  				  '</div></div>';



  var link = function (scope, element, attrs, ctrl) {
	var newScope = scope.$new();
	element.append(container);
	$compile(element.contents())(newScope);
  };


  return {
      restrict: 'E',
      replace: true,
      controller: 'DashboardDirCtrl',
      link: link
    };
}]);