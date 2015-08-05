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
        TOO_MUCH_DATA_MSG = "De door u getrokken lijn of het temporeel interval is te lang. Er zijn te veel metingen om in een CSV weer te geven: ",
        COORD_DECIMAL_COUNT = 8,
        DUTCHIFY_TIMESTAMPS = true,
        MAX_ROW_COUNT = 15000;

    // PUBLIC /////////////////////////////////////////////////////////////////

    /**
     * @description - Delegates between the two CSV generating functions, one
     *                for temporal rasters and on for non-temporal rasters.
     * @param {string} lgSlug - The slug for the layergroup we want to intersect.
     * @param {object} layer - The layer we want to intersect.
     * @return {string/number[][]} - The result, which can be formatted to an
     *                               actual CSV by the ng-csv directive.
     */
    this.formatLineCSV = function (lgSlug, layer) {
      if (layer.data) {
        return _dataIsTemporal(lgSlug)
          // NB! Sometimes a resolved API call uses layer.data for housing it's
          // raw response, and sometimes it uses layer.temporalData; in the latter
          // case layer.data is already needed for the Graph svc, where D3 requires
          // specifically formatted data:
          ? _formatLineCSVTemporal(layer.temporalData || layer.data, lgSlug)
          : _formatLineCSVNonTemporal(layer.data);
      } else {
        _throwDataError(layer);
      }
    };

    /*
     * @description - Get the column names for CSV
     * @param {string} lgSlug - The slug for the layergroup we want to intersect.
     * @param {object} layer - The layer we want to intersect.
     * @return {string[]} - A list with the column names.
     */
    this.getLineCSVHeaders = function (lgSlug, layer) {

      var DEFAULT_HUMAN_READABLE_X = "Afstand [m]",
          humanReadableX = {
            // someLGslug: someHumanReadableXforThatLG
          }[lgSlug] || DEFAULT_HUMAN_READABLE_X,
          humanReadableY = layer.quantity + ' [' + layer.unit + ']';

      if (layer.data) {
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

    /**
     * @description - Throws error because insufficient data.
     * @param {object} layer - The layer we want to intersect.
     * @return {void}
     */
    var _throwDataError = function (layer) {
      throw new Error(
        "Cannot format CSV since the specified layer has not enough data. layer.slug =" + layer.slug
      );
    };

    /**
     * @description - Throws error because incorrect layergroup slug.
     * @param {object} lgSlug - The slug for the layergroup we want to intersect.
     * @return {void}
     */
    var _throwLayerGroupError = function (lgSlug) {
      throw new Error(
        "No layerGroup retrievable from DataService when using the slug: " + lgSlug
      );
    };

    /**
     * @description - Check whether a layergroup has a temporal component.
     * @param {string} lgSlug - The slug for the layergroup we want to intersect.
     * @return {boolean}
     */
    var _dataIsTemporal = function (lgSlug) {
      var lg = DataService.layerGroups[lgSlug];
      if (lg !== undefined) {
        return lg.isTemporal();
      } else {
        _throwLayerGroupError(lgSlug);
      }
    };

    var _getStoreResolution = function (lgSlug) {
      var lg = DataService.layerGroups[lgSlug];
      if (lg !== undefined && lg.temporalResolution) {
        return lg.temporalResolution;
      } else {
        _throwLayerGroupError(lgSlug);
      }
    };

    /**
     * @description - Get start-/end coordinates for current line.
     * @return {float[]} - A list with the 4 floats denoting the start-/end of
     *                     the line.
     */
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

    /**
     * @description - Make timestamps readable for dutch-only people
     * @param {integer} epoch - Seconds since 1970-01-01 00:00:00 .
     * @return {string} - Timestamp in "horlogetijd"
     */
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

    /**
     * @description - format the CSV data (non-temporal raster data)
     * @param {number[][]} data - The data to be formatted.
     * @return {number/string[][]} - the formatted data
     */
    var _formatLineCSVNonTemporal = function (data) {

      var i,
          datum,
          result = [],
          coords = _getLineCoordinates(),
          startLat = coords.startLat,
          startLng = coords.startLng,
          endLat = coords.endLat,
          endLng = coords.endLng;

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

    /**
     * @description - format the CSV data (temporal raster data)
     * @param {number[][]} data - The data to be formatted.
     * @return {number/string[][]} - the formatted data
     */
    var _formatLineCSVTemporal = function (data, lgSlug) {

      console.log(data);
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
          durationPerMeasurement = _getStoreResolution(lgSlug);

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
