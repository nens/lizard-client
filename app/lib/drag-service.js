/**
 * @ngdoc service
 * @class DragulaService
 * @memberof app
 * @name DragulaService
 * @description Trivial wrapper for global dragula object.
 *
 * Perhaps in the future this can be done with CommonJS style requires.
 */
angular.module('lizard-nxt')
.service('DragService', [function () {

  var dragula;

  if (window.dragula) {
    dragula =  window.dragula;
  } else {
    throw new Error('Dragula can not be found');
  }

  var dragContainer;
  var dropContainer;

  var isDropContainerOrChild = function (el) {
    if (dropContainer === undefined) { return false; }
    return el === dropContainer || el in dropContainer.children;
  };

  /**
   * Recursively searches for dropContainer in element and
   * element.parentElement.
   *
   * @param  {DOM element}  el DOM element.
   * @return {Boolean} is dropContainer or in dropcontainer.
   */
  var isDropContainerOrDescendant = function (el) {
    if (isDropContainerOrChild(el)) {
      return true;
    } else if (el.parentElement) {
      return isDropContainerOrDescendant(el.parentElement);
    } else { return false; }
  };

  var addContainer = function (el) {
    drake.containers.push(el);
  };

  var drake = dragula({

    // Dynamically accept all existing graphs in dashboard as valid dropzones.
    isContainer: isDropContainerOrChild,

    // Elements cannot be dragged into the dragContainer
    accepts: function (el, target) {
      return target !== dragContainer;
    },

    // Dropcontainer elements cannot be dragged.
    invalid: isDropContainerOrDescendant,

    copy: true, // Keep original in place.
    revertOnSpill: true // Spilling puts element back where it was dragged from.

  });

  return {

    /**
     * Adds a container with draggable elements in it to the "drake". Makes
     * all children elements draggable.
     *
     * @param {Angular.element} element Angular element containing draggable
     *                                  elements.
     */
    addDraggableContainer: function (element) {
      dragContainer = element[0];
      addContainer(dragContainer);
      return drake;
    },

    /**
     * Adds a container of drop zones. Drops can be made in element or
     * element.children
     *
     * @param {Angular.element} element Angular element containing dropzones.
     */
    addDropZone: function (element) {
      dropContainer = element[0];
      return drake;
    }

  };

}]);