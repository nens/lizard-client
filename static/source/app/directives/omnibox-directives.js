app
	.directive('boxContent', ["$compile", "$http", "$templateCache", "OmniboxService",
		function($compile, $http, $templateCache, OmniboxService) {

      var getTemplate = function(contentType) {
          if (contentType === undefined) contentType = 'empty';

          var templateLoader,
          baseUrl = '/static/source/app/templates/',
          templateUrl = baseUrl + contentType + '.html';

          templateLoader = $http.get(templateUrl, {cache: $templateCache});

          return templateLoader;

      };

      var linker = function(scope, element, attrs) {

        scope.$watch('type', function(){
          replaceTemplate();
        });

        var replaceTemplate = function(){
          var loader = getTemplate(scope.type);

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
        $scope.box = OmniboxService;
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
          scope: {
              type:'='
          },
          link: linker,
          controller: BoxCtrl
      };
  }]);

app
  .directive('boxToggle', function(){
    return {
      require: 'boxContent',
      link: function(scope, element, attrs, BoxCtrl){
        element.bind("click", function(){
          console.log(scope.boxtype, attrs.boxtype)
          BoxCtrl.open(scope.type);
        });
      },
      scope: {
        boxToggle: '@'
      }
    }
  });