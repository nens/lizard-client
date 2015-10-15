/**
 *
 * Toggle directive for omnibox cards
 *
 * TODO: this directive or an attribute directive should be responsible for
 * making the card small when there is not enough space.
 *
 * TODO 2: use ng-click so we do not have to worry about running a digest cycle
 * manually.
 */
angular.module('lizard-nxt')
  .directive('fullDetails', [function () {

    var link = function (scope, element, attrs) {

      if (scope.fullDetails === undefined) {
        scope.fullDetails = true;
      }

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

