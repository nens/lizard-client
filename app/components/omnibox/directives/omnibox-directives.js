'use strict';

angular.module("omnibox")
.directive("omnibox", ['$window', '$document', 'State', 'user', '$timeout',
  function ($window, $document, State, user, $timeout) { return {

    /**
     * Keeps omnibox size in check and creates and maintains a scrollbar.
     */
    link: function (scope, element) {

      var KeyCodes = {
        BACKSPACE: 8,
        SPACE: 32,
        ESC: 27,
        UPARROW: 38,
        DOWNARROW: 40,
        RETURNKEY: 13,
      };

      scope.onFocus = function(item, $event) {
        item.selected = "selected";
        if (item.hasOwnProperty('formatted_address')) {
          scope.zoomToSpatialResultWithoutClearingSeach(item);
        }
        if (item.hasOwnProperty('entity_url')) {
          scope.zoomToSearchResultWithoutClearingSearch(item);
        }
      }

      scope.selectItem = function($event, result) {
        var e = $event;
        switch (e.keyCode) {
          case KeyCodes.RETURNKEY:
            scope.zoomToSearchResult(result);
            break;
        }
      }

      scope.onKeydown = function($event) {
        var e = $event;
        var $target = $(e.target);
        var nextTab;
        switch (e.keyCode) {
            case KeyCodes.ESC:
                $target.blur();
                scope.cleanInput();
                break;
            case KeyCodes.UPARROW:
                nextTab = - 1;
                break;
            case KeyCodes.DOWNARROW:
                nextTab = 1;
                break;
        }
        if (nextTab != undefined) {
            // Do this outside the current $digest cycle:
            // focus the next element by tabindex
           $timeout(() => $('[tabindex=' + (parseInt($target.attr("tabindex")) + nextTab) + ']').focus());
        }
      }



      scope.showAnnotations = function () {
        return (
          user.authenticated &&
          (State.selected.assets.length ||
           State.annotations.active) &&
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
