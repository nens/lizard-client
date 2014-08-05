'use strict';

angular.module("omnibox", ["templates-main"])
  .directive("omnibox", ["$compile", "$templateCache", "UtilService",
    function ($compile, $templateCache, UtilService) {

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

      var finalizeTemplateRendering = function () {
        replaceTemplate();
        scope.box.showCards = scope.box.type !== 'empty';

        // console.log("in function: finalizeTemplateRendering()");
        // console.log("scope.box.type: " + scope.box.type);
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

