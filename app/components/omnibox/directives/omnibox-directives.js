'use strict';

angular.module("omnibox")
.directive("omnibox", ['$window', '$document', 'State', 'user',
  function ($window, $document, State, user) { return {

    /**
     * Keeps omnibox size in check and creates and maintains a scrollbar.
     */
    link: function (scope, element) {

      scope.showAnnotations = function () {
        return (
          user.authenticated &&
          (State.selected.assets.length ||
           State.layers.active.indexOf('Annotations') !== -1) &&
          (scope.omnibox.data.geometries.length +
           scope.omnibox.data.assets.length) < 2
        );
      };

      // In pixels
      var SEARCHBAR_FROM_TOP = 60;
      var TIMLINE_BOTTOM_MARGIN = 10;
      var OMNIBOX_BOTTOM_MARGIN = 5;
      var OMNIBOX_TOP_MARGIN = 5;

      var cards = element.find('#cards');

      window.Ps.initialize(cards[0]);

      /**
       * Sets the height of the scroll area to fit between search box and
       * timeline and updates PerfectScroll.
       */
      var setMaxHeight = function () {
        var tlHeight = $document.find('#timeline').height()
          + TIMLINE_BOTTOM_MARGIN;
        var maxHeight = $window.innerHeight
          - SEARCHBAR_FROM_TOP
          - OMNIBOX_BOTTOM_MARGIN
          - OMNIBOX_TOP_MARGIN;
        maxHeight = maxHeight - tlHeight;

        cards.css('max-height', maxHeight + 'px');
        window.Ps.update(cards[0]);
      };

      // Its is not necassary to set height exactly when digest loops, as long
      // as it occasionally happens and it should not block the ui.
      var WAIT = 300; // min ms to wait between calling throttled.
      var throttled = _.throttle(setMaxHeight, WAIT, {trailing: true});

      /**
       * Update scroll bar on every digest since we do not know about timelines
       * and searchresults and who knows.
       */
      scope.$watch(throttled);

      // Cancel throttled function and rm scroll bar.
      scope.$on('$destroy', function () {
        throttled.cancel();
        window.Ps.destroy(cards[0]);
      });

    },

    restrict: 'E',
    replace: true,
    templateUrl: 'omnibox/templates/omnibox.html'
  };

}]);
