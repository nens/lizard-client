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

    var NO_DATA_MSG = "Geen waarde bekend",
        TOO_MUCH_DATA_MSG = "De door u getrokken lijn is te lang. Er zijn te veel metingen om in een CSV weer te geven: ",
        COORD_DECIMAL_COUNT = 8,
        DUTCHIFY_TIMESTAMPS = true,
        MAX_ROW_COUNT = 15000;

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

    var _getLineCoordinates = function () {

      return {

        startLat: UtilService.formatNumber(UtilService.round(
          State.spatial.points[0].lat, COORD_DECIMAL_COUNT
        ), 0, COORD_DECIMAL_COUNT, true),

        startLng: UtilService.formatNumber(UtilService.round(
          State.spatial.points[0].lng, COORD_DECIMAL_COUNT
        ), 0, COORD_DECIMAL_COUNT, true),

        endLat: UtilService.formatNumber(UtilService.round(
          State.spatial.points[1].lat, COORD_DECIMAL_COUNT
        ), 0, COORD_DECIMAL_COUNT, true),

        endLng: UtilService.formatNumber(UtilService.round(
          State.spatial.points[1].lng, COORD_DECIMAL_COUNT
        ), 0, COORD_DECIMAL_COUNT, true)
      };
    };

    var _dutchifyTimestamp = function (epoch) {

      var d = new Date(epoch),
          datePart = [
            d.getDate(),
            d.getMonth() + 1,
            d.getFullYear()
          ].join('-'),
          timePart = [
            d.getHours() || "00",
            d.getMinutes() || "00",
            d.getSeconds() || "00"
          ].join(':');

      return timePart + " " + datePart;
    };

    var _formatLineCSVNonTemporal = function (data) {

      var i,
          datum,
          result = [],
          coords = _getLineCoordinates(),
          startLat = coords.startLat,
          startLng = coords.startLng,
          endLat = coords.endLat,
          endLng = coords.endLng;

      console.log("data.length =", data.length);

      if (data.length > MAX_ROW_COUNT)
        return [[TOO_MUCH_DATA_MSG + data.length]];

      for (i = 0; i < data.length; i++) {
        datum = data[i];
        result.push([
          typeof data[i][0] === 'number'
            ? UtilService.formatNumber(UtilService.round(datum[0], 2), 0, 2, true)
            : NO_DATA_MSG,
          typeof data[i][1][0] === 'number'
            ? UtilService.formatNumber(UtilService.round(datum[1][0], 2), 0, 2, true)
            : NO_DATA_MSG,
          startLat,
          startLng,
          endLat,
          endLng
        ]);
      }
      return result;
    };

    var _formatLineCSVTemporal = function (data) {

      var t,
          i,
          datum,
          result = [],
          timestamp,
          coords = _getLineCoordinates(),
          startLat = coords.startLat,
          startLng = coords.startLng,
          endLat = coords.endLat,
          endLng = coords.endLng,
          amountOfTimestamps = data[0][1].length,
          tempExtentInterval = State.temporal.end - State.temporal.start,
          // Assumption which holds when measurements (i) are present for full
          // temp.extent and (ii) are equidistant with distance equal to aggWindow:
          durationPerMeasurement = State.temporal.aggWindow;

      if (amountOfTimestamps * data.length > MAX_ROW_COUNT)
        return [[TOO_MUCH_DATA_MSG + amountOfTimestamps * data.length]];

      var roundedStartTime = State.temporal.start - (
        State.temporal.start % durationPerMeasurement
      );

      for (t = 0; t < amountOfTimestamps; t++) {

        timestamp = DUTCHIFY_TIMESTAMPS
          ? _dutchifyTimestamp(roundedStartTime + (t * durationPerMeasurement))
          : roundedStartTime + (t * durationPerMeasurement);

        for (i = 0; i < data.length; i++) {
          datum = data[i];
          result.push([
            timestamp,
            typeof data[i][0] === 'number'
              ? UtilService.formatNumber(UtilService.round(datum[0], 2), 0, 2, true)
              : NO_DATA_MSG,
            typeof data[i][1][t] === 'number'
              ? UtilService.formatNumber(UtilService.round(datum[1][t], 2), 0, 2, true)
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
}]);