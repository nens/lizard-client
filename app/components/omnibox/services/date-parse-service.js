angular.module('omnibox')
  .service('DateParser', [function DateParser () {

    var moment = window.moment;

    moment().locale('nl');

    var HOUR = moment.duration(1, 'hour');
    var DAY = moment.duration(1, 'day');
    var MONTH = moment.duration(1, 'month');
    var YEAR = moment.duration(1, 'year');

    /**
     * Ordered object of date formats, with zoom intervals. First match is
     * preferred. Non specified values default to the current date, also when
     * in the future. 03-10 results in 3rd of november while 03-13 results in
     * the 13th of march.
     */
    var FORMATS_INTERVALS = {
      'DD': DAY, // 21
      // 'DD MM': DAY,  // 21-04 (Clashes with YYYY for 2000 - 2012)
      'DD MM YYYY': DAY, // 21-04-2013
      'DD MM YYYY HH': HOUR, // 21-04-2013 11
      'DD MMM': DAY, // 21 april
      'DD MMM YYYY': DAY, // 21 april 2013
      'DD MMM YYYY HH': HOUR, // 21 april 2013 11
      'MM DD': DAY, // 04-21
      'MMM': MONTH, // april 21
      'MMM DD': DAY, // april 21
      'MM YYYY': MONTH, // 04-2013
      'MMM YYYY': MONTH, // april 2013
      'YYYY': YEAR, // 2013
      'YYYY MM': MONTH, // 2013-04
      'YYYY MMM': MONTH, // 2013 april
      'YYYY MM DD': DAY, // 2013-04-21
      'YYYY MM DD HH': HOUR, // 2013-04-21 11
      'YYYY MMM DD': DAY, // 2013 april 21
      'YYYY MMM DD HH': HOUR, // 2013 april 21 11
    };

    /**
     * Lookup for display formats from ISO duration representations to display
     * format strings.
     */
    var FORMAT_STRINGS = {
      'PT1H': 'DD MMMM YYYY, HH uur',
      'P1D': 'DD MMMM YYYY',
      'P1M': 'MMMM YYYY',
      'P1Y': 'YYYY'
    };

    // add ISO date support http://en.wikipedia.org/wiki/ISO_8601
    var formatters = Object.keys(FORMATS_INTERVALS);
    formatters.push(moment.ISO_8601);

    /**
     * Takes a string and attempts to parse it using a list of formatter
     * strings. Return a moment.js moment and adds a nxt specific nxtInterval
     * containing the interval beloning to the matched format as a moment.js
     * duration and a nxtFormatString containing the format stirng that should
     * be used for display.
     *
     * Example: dString 'maa 2015' gets a moment.js duration of 1 month. And
     * a format string of 'MMMM YYYY' which will parse the moment as
     * 'Maart 2015'.
     *
     * @param  {string} dString string to match a date to.
     * @return {moment} moment with a moment duration under nxtInterval and a
     *                         display format under nxtFormatString.
     */
    var parser = function (dString) {
      var m = moment(dString, formatters);
      m.nxtInterval = FORMATS_INTERVALS[m._f] || HOUR;
      m.nxtFormatString = FORMAT_STRINGS[m.nxtInterval.toString()];
      return m;
    };

    return parser;

  }
]);
