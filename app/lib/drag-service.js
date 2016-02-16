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

  var drake = dragula({
    copy: true
  });

  var dragContainer;

  var addContainer = function (el) {
    drake.containers.push(el);
  };

  this.addDraggableContainer = function (el) {
    dragContainer = el[0];
    addContainer(dragContainer);
    return drake;
  };

  this.addDropZones = function (elements) {
    drake.containers = [];
    if (dragContainer) { addContainer(dragContainer); }
    _.forEach(elements, addContainer);
    return drake;
  };

  return this;

}]);
