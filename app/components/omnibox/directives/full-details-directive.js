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
  .directive('fullDetails', ['State', function (State) {

    var link = function (scope, element, attrs) {

      if (scope.fullDetails === undefined) {
        scope.fullDetails = true;
      }

      // FullDetails is set programmatically and by users. Do not set
      // programmatically when a user set it manually.
      var toggledByUser = false;

      // does the actual toggling.
      var toggleDetails = function () {
        if (scope.$$phase) {
          scope.fullDetails = !scope.fullDetails;
        } else {
          scope.$apply(function () {
            scope.fullDetails = !scope.fullDetails;
          });
        }
        toggledByUser = true;
      };

      element.bind('click', toggleDetails);

      /**
       * Minimize boxes when lots of cards.
       */
      scope.$watch(State.toString('selected'), function () {
        var boxLength = State.selected.assets.length
         + State.selected.geometries.length;

        if (!toggledByUser && boxLength > 2) {
          scope.fullDetails = false;
        }
        else if (!toggledByUser) {
          scope.fullDetails = true;
        }
      });

    };


    return {
      link: link,
      restrict: 'E',
      replace: true,
      scope: false,
      templateUrl: 'omnibox/templates/full-details.html'
    };

  }]);

