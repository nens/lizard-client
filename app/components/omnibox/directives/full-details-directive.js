/**
 *
 * Toggle directive for omnibox cards
 *
 */
angular.module('lizard-nxt')
  .directive('fullDetails', [function () {
    
    var link = function (scope, element, attrs) {

      scope.fullDetails = true;
      
      // does the actual toggling.
      var toggleDetails = function () {
        if (scope.$$phase) {
          scope.fullDetails = !scope.fullDetails;
        } else {
          scope.$apply(function () {
            scope.fullDetails = !scope.fullDetails;
          });
        }
      };

      scope.$parent.box.minimizeCards();
      element.bind('click', toggleDetails);

    };
    

    return {
      link: link,
      restrict: 'E',
      replace: true,
      scope: false,
      templateUrl: 'omnibox/templates/full-details.html'
    }
  }]);

