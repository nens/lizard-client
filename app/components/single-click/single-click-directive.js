
/**
 * A double click in browsers is also two seperate clicks. So to have both
 * double click listeners as single click listeneres this directive checks if
 * a single click is really just one before firing the single click callback.
 * As a result single clicks are slow.
 */
angular.module('data-menu')
  .directive('singleClick', ['$parse', function ($parse) {
    return {
      restrict: 'A',
      link: function (scope, element, attr) {
        var fn = $parse(attr.singleClick);
        var delay = 300,
            clicks = 0,
            timer = null;

        element.on('click', function (event) {
          clicks++;  //count clicks
          if (clicks === 1) {
            timer = setTimeout(function () {
              scope.$apply(function () {
                fn(scope, { $event: event });
              });
              clicks = 0;             //after action performed, reset counter
            }, delay);
          } else {
            clearTimeout(timer);    //prevent single-click action
            clicks = 0;             //after action performed, reset counter
          }
        });
      }
    };
  }
]);
