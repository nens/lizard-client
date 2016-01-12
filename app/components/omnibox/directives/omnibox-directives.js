'use strict';

angular.module("omnibox")
  .directive("omnibox", ["$compile", "$templateCache", "UtilService", "State",
    function ($compile, $templateCache, UtilService, State) {

    var getTemplate = function (scope, contentType, context) {
      if (context === 'dashboard') {
        contentType = 'dashboard-cards';
      }
      else if (contentType === undefined) {
        contentType = 'area';
      }

      var templateUrl = 'omnibox/templates/' + contentType + '.html';
      return $templateCache.get(templateUrl);
    };

    var linker = function (scope, element, attrs) {

      // var oldScope;

      // var replaceTemplate = function () {
      //   var template = getTemplate(scope, State.box.type, State.context);
      //   // We need to manually destroy scopes here when switching templates.
      //   // It is necessary to do this *before* withching templates. Otherwise
      //   // the new scope is active while the previous on is to and they affect
      //   // each other.
      //   if (oldScope) { oldScope.$destroy(); }
      //   // we don't want the dynamic template to overwrite the search box.
      //   // NOTE: the reason for selecting the specific child is jqLite does
      //   // not support selectors. So an element is created of the second child
      //   // of the directive's element and the first child of that element is
      //   // transformed into an element and replaced by the point/line/area
      //   // template. Please replace if you know a nicer way..
      //   var boxTypeCards = angular.element(
      //     angular.element(element.children()[1]).children()[0]
      //   ).replaceWith(template);
      //   var newScope = scope.$new();
      //   $compile(element.contents())(newScope);

      //   oldScope = newScope;
      // };

      // var finalizeTemplateRendering = function () {
      //   replaceTemplate();
      //   scope.box.showCards = State.box.type !== 'empty';
      // };

      // scope.$watch(State.toString('box.type'), function (n, o) {
      //   if (n === o) { return true; }
      //   finalizeTemplateRendering();
      // });

      // scope.$watch(State.toString('context'), function (n, o) {
      //   if (n === o) { return true; }
      //   finalizeTemplateRendering();
      // });

      // finalizeTemplateRendering();

    };

    return {
      restrict: 'E',
      link: linker,
      templateUrl: 'omnibox/templates/omnibox.html'
    };
  }]);

