angular.module('omnibox', [])
	.directive('boxContent', ["$compile", "$http", "$templateCache",
		function($compile, $http, $templateCache) {

      var getTemplate = function(contentType) {
          if (contentType === undefined){
            contentType = 'empty'
          }
          var templateLoader,
          baseUrl = '/static/source/app/templates/',
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
          }).error(function(html){
            element.html('');
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