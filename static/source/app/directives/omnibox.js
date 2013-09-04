angular.module('omnibox', [])
	.directive('boxContent', ["$compile", "$http", "$templateCache",
		function($compile, $http, $templateCache) {

      var getTemplate = function(contentType) {
          var templateLoader,
          baseUrl = '/static/src/app/templates/',
          templateUrl = baseUrl + contentType + '.html';
          
          templateLoader = $http.get(templateUrl, {cache: $templateCache});

          return templateLoader;

      }

      var linker = function(scope, element, attrs) {

          var loader = getTemplate(scope.type);

          var promise = loader.success(function(html) {
              element.html(html);
          }).then(function (response) {
              element.replaceWith($compile(element.html())(scope));
          });
      }

      return {
          restrict: 'E',
          scope: {
              type:'='
          },
          link: linker,
          replace: true
      };
  }]);