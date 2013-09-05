angular.module('omnibox', [])
	.directive('boxContent', ["$compile", "$http", "$templateCache",
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
        // because this is not a standard directive.
        scope.$watch('type', function(){
          replaceTemplate();
        });

        var replaceTemplate = function(){
          var loader = getTemplate(scope.type);

          var promise = loader.success(function(html) {
              element.html(html);
          }).then(function (response) {
              console.log(element);
              $compile(element.contents())(scope);

              console.log(element);
          });
        };
        replaceTemplate();
      };

      return {
          restrict: 'A',
          scope: {
              type:'='
          },
          link: linker
      };
  }]);