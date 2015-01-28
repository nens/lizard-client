angular.module('lizard-nxt')
.service("CSVService",

  [

  "UtilService",
  "DataService",
  "State",

  function (

    UtilService,
    DataService,
    State

    ) {

    // PUBLIC /////////////////////////////////////////////////////////////////

    this.formatLineCSV = function (lgSlug, layer) {

      if (layer.data && layer.data[0][1]) {
        return _dataIsTemporal(lgSlug, layer.data)
          ? _formatLineCSVTemporal(lgSlug, layer.data)
          : _formatLineCSVNonTemporal(lgSlug, layer.data);
      } else {
        _throwDataError(layer);
      }
    };

    this.getLineCSVHeaders = function (lgSlug, layer) {

      var humanReadableX = {
          }[lgSlug] || "Afstand [m]",
          humanReadableY = layer.quantity + ' [' + layer.unit + ']';

      if (layer.data && layer.data[0][1]) {
        return _dataIsTemporal(lgSlug, layer.data)
          ? [ 'Timestamp',
              humanReadableX,
              humanReadableY,
              'Lijn start (latitude)',
              'Lijn start (longitude)',
              'Lijn eind (latitude)',
              'Lijn eind (longitude)'
            ]
          : [
              humanReadableX,
              humanReadableY,
              'Lijn start (latitude)',
              'Lijn start (longitude)',
              'Lijn eind (latitude)',
              'Lijn eind (longitude)'
          ];
      } else {
        _throwDataError(layer);
      }
    };

    // PRIVATE ////////////////////////////////////////////////////////////////

    var _throwDataError = function (layer) {
      throw new Error(
        "Cannot format CSV since the specified layer has not enough data. layer =",
        layer
      );
    };

    var _throwLayerGroupError = function (lgSlug) {
      throw new Error(
        "No layerGroup retrievable from DataService when using the slug:",
        lgSlug
      );
    };

    var _dataIsTemporal = function (lgSlug, data) {
      var lg = DataService.layerGroups[lgSlug];
      if (lg !== undefined) {
        return lg.isTemporal();
      } else {
        _throwLayerGroupError(lgSlug);
      }
    };

    var _formatLineCSVTemporal = function (lgSlug, data) {
      console.log("[F] formatLineCSVTemporal");
      console.log("-- lgSlug =", lgSlug);
      console.log("-- first 5 data =", data.splice(0, 5));
    };

    var _formatLineCSVNonTemporal = function (lgSlug, data) {

      var i,
          result = [],
          NO_DATA_MSG = "Geen waarde bekend.";

      for (i = 0; i < data.length; i++) {
        result.push([
          data[i][0],
          data[i][1][0] || NO_DATA_MSG,
          State.spatial.points[0].lat,
          State.spatial.points[0].lng,
          State.spatial.points[1].lat,
          State.spatial.points[1].lng
        ]);
      }

      return result;
    };


}]);