/**
 * Wrapper around bootstrap modal.
 * There is a MotherModal that provides a skeleton.
 * <ui-modal></ui-modal>
 * For now it always contains the export-selector directive
 */

angular.module('ui-utils').directive('uiModal', ['ExportService',
  function (ExportService) {
    var link = function (scope, el) {
      var mode = (scope.active) ? 'show' : 'hide';
      $(el).modal(mode);

      /**
       * closeModal - close the modal with an angular click.
       *
       */
      scope.closeModal = function () {
        scope.active = false;
        var mode = (scope.active) ? 'show' : 'hide';
        $(el).modal(mode);
      };

      scope.mayCloseModal = function () {
        return !ExportService.isPolling.value;
      };

      // ensures there is no conflict between Bootstrap set state and ng internals
      el.on('hide.bs.modal', function (e) {

        // check if the modal is triggering the hide, not the datepicker
        if (e.target.id === el[0].id){
          if (scope.active) {
            scope.active = false;
          }
          // justin kees
          $('.modal-backdrop').remove();
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
