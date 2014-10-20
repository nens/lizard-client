// cursor-tooltip-directive.js

'use strict';
angular.module('lizard-nxt')
  .directive('cursorTooltip', function () {
  var link = function (scope, element, attrs) {
    var locationWatch;
    scope.$watch('tools.cursorTooltip.enabled', function (newVal, oldVal) {
      if (newVal === oldVal) { return; }
      if (newVal) {
        locationWatch = scope.$watch('tools.cursorTooltip.location', function (newVal) {
          element.offset({top: newVal.clientY - 5, left: newVal.clientX + 5});
        });
      } else if (!newVal) {
        locationWatch();
      }
    });

  };

  return {
    link: link,
    restrict: 'E',
    replace: true,
    template: '<div><% tools.cursorTooltip.content %></div>'
  };
});