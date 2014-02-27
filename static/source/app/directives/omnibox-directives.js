'use strict';

angular.module("omnibox", ["templates-main"])
  .directive("omnibox", ["$compile", "$templateCache",
    function ($compile, $templateCache) {

    var getTemplate = function (contentType) {
      if (contentType === undefined) {
        contentType = 'empty';
      }

      var template,
      templateUrl = 'templates/' + contentType + '.html';

      template = $templateCache.get(templateUrl);

      return template;

    };

    var linker = function (scope, element, attrs) {

      var replaceTemplate = function () {
        var template = getTemplate(scope.box.type);
        // we don't want the dynamic template to overwrite the search box.
        // NOTE: the reason for selecting the specific child is jqLite does not
        // support selectors.
        angular.element(element.children()[1]).html(template);
        $compile(element.contents())(scope);
        // angular.element(angular.element('.card')[0]).prepend( '' 
        //   + '<span class="close-button pull-right clickable" ng-click="reset_query()">'
        //   + '<i class="icon-remove"></i></span>');
        // scope.$apply();
      };

      scope.$watch('box.type', function () {
        replaceTemplate();
        if (scope.box.type !== 'empty') {
          scope.box.showCards = true;
        } else {
          scope.box.showCards = false;
        }
      });

      replaceTemplate();

    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: 'templates/omnibox-search.html'
    };
  }]);
