// cursor-tooltip-directive.js

'use strict';
app.directive('cursorTooltip', function () {
  var link = function (scope, element, attrs) {
    scope.$watch('tools.cursorTooltip.enabled', function (newVal) {
      if (newVal) {
        scope.$watch('tools.cursorTooltip.location', function (newVal) {
          element.offset({top: newVal.clientY - 5, left: newVal.clientX + 5});
        });
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