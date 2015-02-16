/**
 *
 * Directive for dashboard component.
 */
angular.module('dashboard')
  .directive('dashboard', function () {

  var link = function (scope, element, attr) {

    var resizePane = function () {
      var PADDINGTOP = 70,
          SELECTORHEIGHT = 50,
          ROWMARGIN = 10,
          TITLEHEIGHT = 35;

      var height = angular.element('body').height();
      // if smaller screen below each other in stead of next to
      var width = (element.width() < 960) ? element.width() : element.width() / 3;

      var rowHeight = (height - PADDINGTOP) / 2 - ROWMARGIN;
      angular.element('.dashboard-row').height(rowHeight);
      scope.dashboard.dimensions = {
        height: rowHeight - SELECTORHEIGHT - TITLEHEIGHT,
        width: width - 120,
        padding: {
          top: 25,
          bottom: 60,
          left: 50,
          right: 10
        }
      };
    };

    scope.$on('$destroy', function () {
      window.removeEventListener('resize', resizePane);
    });

    window.addEventListener('resize', resizePane);
    resizePane();

  };


  return {
    link: link,
    replace: true,
    restrict: 'E',
    templateUrl: 'dashboard/dashboard.html'
  }
});
