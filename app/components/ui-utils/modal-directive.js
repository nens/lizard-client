/**
 * Wrapper around bootstrap modal.
 * There is a MotherModal that provides a skeleton.
 * The skeleton is now supplemented with the right contents if you
 * start the following directive:
 * <ui-modal></ui-modal>
 * The state as well as the templateName are in the
 * state service.
 */

angular.module('ui-utils').directive('uiModal', [
  function () {

    var link = function (scope, el) {
      var mode = (scope.active) ? 'show' : 'hide';
      $(el).modal(mode);

      scope.closeModal = function () {
        scope.active = false;
        var mode = (scope.active) ? 'show' : 'hide';
        $(el).modal(mode);
      }

      // ensures there is no conflict between Bootstrap set state and ng internals
      el.on('hide.bs.modal', function () {
        console.log('bla')
        if (scope.active) {
          scope.active = false;
        }
      });
    };

    return {
      link: link,
      templateUrl: 'ui-utils/modal-base.html',
      restrict: 'E',
      replace: true,
      scope: {
        active: '='
      }
    };
  }
]);
