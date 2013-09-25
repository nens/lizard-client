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

        scope.$watch('box.type', function(){
          replaceTemplate();
        });

        var replaceTemplate = function(){
          var loader = getTemplate(scope.box.type);

          var promise = loader.success(function(html) {
              element.html(html);
          }).then(function (response) {
              $compile(element.contents())(scope);
          });
        };
        replaceTemplate();
      };

      return {
          restrict: 'A',
          link: linker
      };
  }]);
