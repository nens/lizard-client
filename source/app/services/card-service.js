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
