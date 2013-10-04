'use strict';

angular.module('omnibox', [])
	.directive('omnibox', ["$compile", "$http", "$templateCache",
		function($compile, $http, $templateCache) {

      var getTemplate = function(contentType) {
          if (contentType === undefined) contentType = 'empty';

          var templateLoader,
          baseUrl = '/static/source/app/templates/',
          templateUrl = baseUrl + contentType + '.html';

          templateLoader = $http.get(templateUrl, {cache: $templateCache});

          return templateLoader;

      };

      var linker = function(scope, element, attrs) {

        var replaceTemplate = function(){
          var loader = getTemplate(scope.box.type);

          var promise = loader.success(function(html) {
            // we don't want the dynamic template to overwrite the search box.
              element.find("#cards").html(html);
          }).then(function (response) {
              $compile(element.contents())(scope);
          });
        };

        scope.$watch('box.type', function () {
          replaceTemplate();
          if ('scope.box.type' !== 'empty'){
            scope.box.showCards = true;
          } else {
            scope.box.showCards = false;
          }
        });

        replaceTemplate();

        scope.$watch('selected_timeseries', function () {
          if (scope.selected_timeseries !== undefined){

            scope.data = scope.format_data(scope.selected_timeseries.events);
            // dit kan zeker nog mooier
            scope.metadata.title = scope.selected_timeseries.location.name;
            scope.metadata.ylabel = 'Aciditeit (%)' ; //scope.selected_timeseries.parameter + scope.selected_timeseries.unit.code
            scope.metadata.xlabel = "Tijd";
          } else {
            scope.data = undefined;
          }
        });

      };

      return {
          restrict: 'E',
          link: linker,
          templateUrl: '/static/source/app/templates/omnibox-search.html'
      };
  }]);
