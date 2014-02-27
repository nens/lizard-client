'use strict';

/**
 * Lizard-nxt filters
 *
 * Overview
 * ========
 *
 * Defines custom filters
 * 
 */


/**
 * Nice number or dash returns a rounded number or a '-'
 *
 * @param {string or number} input to round or convert to dash
 * @param {number} optional decimals to round the number to
 * @return {string or number} when input is a number: returns a number
 * rounded to specified decimals else returns '-'
 */
app.filter('niceNumberOrDash', function () {
    return function (input, decimals) {
      var out;
      if (typeof(input) === 'number') {
        var factor = 1;
        if (decimals) {
          factor = Math.pow(10, decimals);
        }
        out = Math.round(input * factor) / factor;
      } else {
        out = '...';
      }
      return out;
    };
  });