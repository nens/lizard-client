app
	.directive('boxContent', ["$compile", "$http", "$templateCache", "Omnibox",
		function($compile, $http, $templateCache, Omnibox) {

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

      // TODO: this is going to handle the opening. Not yet
      function BoxCtrl ($scope){
        $scope.box = Omnibox;
        this.open = function(){
          $scope.box.type = type;
          $scope.box.showCards = true;
        };

        this.close = function(){
          $scope.box.type = 'empty';
          $scope.box.showCards = false;
        };
        $scope.$watch('box.changed', function(){
          // this.open($scope.box.type);
        });
      };

      return {
          restrict: 'A',
          link: linker
      };
  }]);
