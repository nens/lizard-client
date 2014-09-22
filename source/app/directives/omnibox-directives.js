'use strict';

angular.module("omnibox", ["templates-main"])
  .directive("omnibox", ["$compile", "$templateCache", "UtilService",
    function ($compile, $templateCache, UtilService) {

    var getTemplate = function (scope, contentType) {
      if (contentType === undefined) {
        contentType = 'area';
        //contentType = 'empty';
      }

      var templateUrl = 'templates/' + contentType + '.html';
      return $templateCache.get(templateUrl);
    };

    var linker = function (scope, element, attrs) {

      var oldScope;

      var replaceTemplate = function () {
        var template = getTemplate(scope, scope.box.type);
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

      var finalizeTemplateRendering = function () {
        replaceTemplate();
        scope.box.showCards = scope.box.type !== 'empty';
      };

      scope.$watch('box.type', function (n, o) {
        if (n === o) { return true; }
        finalizeTemplateRendering();
      });

      scope.$watch('mapState.mapMoving', function (n, o) {
        if (n === o) { return true; }
        if (n)
          UtilService.fadeCurrentCards(scope);
        else {
          // Snap away from current card fade-in/out practices:
          // make cards visible again, unconditionally and w/o possible
          // setTimeout() conflicts.
          d3.selectAll(".card").transition(200).style("opacity", 1);
        }
      });

      finalizeTemplateRendering();
    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: 'templates/omnibox-search.html'
    };
  }]);

