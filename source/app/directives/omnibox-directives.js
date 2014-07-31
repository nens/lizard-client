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

      var oldScope;

      var replaceTemplate = function () {
        var template = getTemplate(scope.box.type);
        // we don't want the dynamic template to overwrite the search box.
        // NOTE: the reason for selecting the specific child is jqLite does
        // not support selectors.
        angular.element(element.children()[1]).html(template);
        var newScope = scope.$new();
        $compile(element.contents())(newScope);
        // We need to manually destroy scopes here when switching templates.
        if (oldScope) { oldScope.$destroy(); }
        oldScope = newScope;
      };

      scope.$watch('box.type', function (n, o) {
        if (n === o) { return true; }
        replaceTemplate();
        if (scope.box.type === 'empty') {
          scope.box.showCards = false;
        } else {
          scope.box.showCards = true;
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

