/**
 * Persistent storage of card property priority.
 *
 * Usage: inject service and setPriority to store
 * priority of card properties betweeen different
 * instantiations of raster-extent-controller and
 * possibly point-object-controller.
 */

app.service("CardService", [
  function () {

    var priorities = {
      // extent property: priority
      landuse: false,
      soil: false,
      elevation: false,
    };

    var setPriority = function (property, value) {
      priorities[property] = value;
    };

    var getPriority = function (property) {
      var value;
      value = priorities[property] || false;
      return value;
    };

    return {
      setPriority: setPriority,
      getPriority: getPriority
    };
  }
]);
