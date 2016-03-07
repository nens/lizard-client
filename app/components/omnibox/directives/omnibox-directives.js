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


    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'omnibox/templates/omnibox.html'
    };
  }]);
