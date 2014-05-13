/**
 * Generic utilities
 */
app.service("UtilService", function () {

  /**
   * Round javascript timestamp to nearest coefficient.
   *
   * For example, if you want to round timestamp to the nearest 5 minutes,
   * coefficient = 1000 * 60 * 5 = 30000
   *
   * @param {integer} timestamp - javascript timestamp in ms.
   * @param {integer} coefficient - coefficient to round to in ms.
   * @param {boolean} tzOffset - true if you want to correct for timezone
   * offset.
   * @returns {integer} roundedTimestamp - timestamp rounded to nearest
   * coefficient.
   */
  this.roundTimestamp = function (timestamp, coefficient, tzOffset) {
    var roundedTimestamp = parseInt((timestamp + (coefficient / 2)) /
                                    coefficient) * coefficient;

    if (tzOffset === true) {
      var timeZoneOffset = (new Date(roundedTimestamp)).getTimezoneOffset() *
        1000 * 60;
      roundedTimestamp = roundedTimestamp - timeZoneOffset;
    }

    return roundedTimestamp;
  };

});
