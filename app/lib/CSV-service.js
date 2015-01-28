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

    // CONSTANTS

    var NO_DATA_MSG = "Geen waarde bekend";

    // PUBLIC /////////////////////////////////////////////////////////////////

    this.formatLineCSV = function (lgSlug, layer) {
      if (layer.data && layer.data[0][1]) {
        return _dataIsTemporal(lgSlug)
          ? _formatLineCSVTemporal(layer.data)
          : _formatLineCSVNonTemporal(layer.data);
      } else {
        _throwDataError(layer);
      }
    };

    this.getLineCSVHeaders = function (lgSlug, layer) {

      var DEFAULT_HUMAN_READABLE_X = "Afstand [m]",
          humanReadableX = {
            // someLGslug: someHumanReadableXforThatLG
          }[lgSlug] || DEFAULT_HUMAN_READABLE_X,
          humanReadableY = layer.quantity + ' [' + layer.unit + ']';

      if (layer.data && layer.data[0][1]) {
        return _dataIsTemporal(lgSlug)
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

    var _dataIsTemporal = function (lgSlug) {
      var lg = DataService.layerGroups[lgSlug];
      if (lg !== undefined) {
        return lg.isTemporal();
      } else {
        _throwLayerGroupError(lgSlug);
      }
    };

    var _formatLineCSVTemporal = function (data) {
      // TODO: absolute timestamps mofo!
      var t,
          i,
          datum,
          result = [],
          timestamp,
          startLat = State.spatial.points[0].lat,
          startLng = State.spatial.points[0].lng,
          endLat = State.spatial.points[1].lat,
          endLng = State.spatial.points[1].lng,
          amountOfTimestamps = data[0][1].length,
          tempExtentInterval = State.temporal.end - State.temporal.start,
          // Assumption which holds when measurements (i) are present for full
          // temp.extent and (ii) are equidistant with distance equal to aggWindow:
          durationPerMeasurement = State.temporal.aggWindow;

      var roundedStartTime = State.temporal.start - (
        State.temporal.start % durationPerMeasurement
      );

      for (t = 0; t < amountOfTimestamps; t++) {
        timestamp = new Date(roundedStartTime + (t * durationPerMeasurement));
        for (i = 0; i < data.length; i++) {
          datum = data[i];
          result.push([
            timestamp,
            typeof data[i][0] === 'number'
              ? UtilService.round(datum[0], 2)
              : NO_DATA_MSG,
            typeof data[i][1][t] === 'number'
              ? UtilService.round(datum[1][t], 2)
              : NO_DATA_MSG,
            startLat,
            startLng,
            endLat,
            endLng,
          ]);
        }
      }
      return result;
    };

    var _formatLineCSVNonTemporal = function (data) {

      var i,
          datum,
          result = [],
          startLat = State.spatial.points[0].lat,
          startLng = State.spatial.points[0].lng,
          endLat = State.spatial.points[1].lat,
          endLng = State.spatial.points[1].lng;

      for (i = 0; i < data.length; i++) {
        datum = data[i];
        result.push([
          typeof data[i][0] === 'number'
            ? UtilService.round(datum[0], 2)
            : NO_DATA_MSG,
          typeof data[i][1][0] === 'number'
            ? UtilService.round(datum[1][0], 2)
            : NO_DATA_MSG,
          startLat,
          startLng,
          endLat,
          endLng
        ]);
      }
      return result;
    };

}]);